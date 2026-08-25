-- 0013_claim_solo_nomi_liberi.sql — chiude una falla presente dalla 0001.
--
-- LA FALLA. join_plan permetteva di rivendicare il nome di un altro
-- partecipante. Il controllo era:
--
--     select coalesce(u.is_anonymous, true) into v_is_anon ...
--     if not found or v_is_anon = false then raise exception 'claim not allowed';
--
-- cioè: "questo nome è preso da qualcuno con un account vero?" Se no, si può
-- prendere. Ma un ospite che ha appena votato dal link È anonimo — quindi il
-- suo nome risultava ancora libero.
--
-- L'attacco, per intero, con il solo link condiviso nel gruppo:
--   1. preview_invite risponde anche a chi non è entrato, e restituisce
--      l'actor_id di OGNI partecipante insieme al nome;
--   2. join_plan(token, null, quell_actor_id) attacca la tua sessione al suo
--      profilo;
--   3. da lì i suoi voti sono tuoi, e li puoi cambiare.
--
-- Chiunque riceva il link su WhatsApp poteva votare al posto di chiunque altro
-- non avesse ancora collegato Google. Nessuna competenza richiesta.
--
-- L'ha trovata smoke_0012.sql al controllo 6, scritto apposta per chiedersi se
-- due persone potessero prendersi lo stesso nome. Non è una falla introdotta
-- dalla 0012: è lì dalla prima migrazione, ed è stata scritta cercandola.
--
-- LA CORREZIONE. Un nome si rivendica solo finché non lo tiene NESSUNO, cioè
-- finché actors.auth_user_id è NULL — un vero segnaposto scritto
-- dall'organizzatore. Appena qualcuno se lo prende, anche da ospite, è suo.
--
-- Il caso legittimo che il vecchio controllo cercava di coprire — "ho votato
-- dal telefono, ora sono al computer e voglio riprendermi la mia identità" —
-- non si può autenticare: non c'è modo di dimostrare di essere la stessa
-- persona. Va risolto con un'identità vera (Google), che è quello che fa la
-- fusione degli account. Confondere i due casi era l'origine della falla.

begin;

do $$
begin
  if not exists (
    select 1 from information_schema.columns
     where table_schema = 'public' and table_name = 'plans' and column_name = 'join_policy'
  ) then
    raise exception 'applica prima 0012_politica_ingresso.sql';
  end if;
end $$;

create or replace function public.join_plan(p_token text, p_display_name text,
                                            p_claim_actor uuid default null)
returns uuid
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_link    invite_links%rowtype;
  v_actor   uuid;
  v_uses    int;
  v_is_anon boolean;
  v_libero  boolean;
  v_policy  text;
begin
  if auth.uid() is null then raise exception 'not authenticated'; end if;

  select * into v_link from invite_links where token_hash = encode(digest(p_token, 'sha256'), 'hex');
  if v_link.id is null or v_link.revoked_at is not null
     or (v_link.expires_at is not null and v_link.expires_at < now()) then
    raise exception 'invalid invite';
  end if;
  if v_link.max_uses is not null then
    select count(*) into v_uses from invite_uses where invite_link_id = v_link.id;
    if v_uses >= v_link.max_uses then raise exception 'invite exhausted'; end if;
  end if;

  select coalesce(join_policy, 'open') into v_policy from plans where id = v_link.plan_id;

  -- Chi è già dentro rientra sempre: le regole valgono per chi arriva.
  if current_actor_id() is not null
     and exists (select 1 from participants
                  where plan_id = v_link.plan_id and actor_id = current_actor_id()) then
    return v_link.plan_id;
  end if;

  if v_policy = 'account' then
    select coalesce(is_anonymous, true) into v_is_anon from auth.users where id = auth.uid();
    if v_is_anon then
      raise exception 'per questo piano serve entrare con il proprio account';
    end if;
  end if;

  if v_policy = 'roster' and p_claim_actor is null then
    raise exception 'per questo piano si entra scegliendo il proprio nome dall''elenco';
  end if;

  if p_claim_actor is not null and current_actor_id() is null then
    -- LA CORREZIONE È QUI. Prima si chiedeva "chi lo tiene ha un account
    -- vero?", che lasciava libero il nome di ogni ospite. Ora: è libero solo
    -- se non lo tiene nessuno.
    select (a.auth_user_id is null) into v_libero
      from actors a
      where a.id = p_claim_actor
        and exists (select 1 from participants
                     where plan_id = v_link.plan_id and actor_id = a.id);
    if not found or not v_libero then raise exception 'claim not allowed'; end if;

    update actors set auth_user_id = auth.uid() where id = p_claim_actor;
    v_actor := p_claim_actor;
  else
    v_actor := ensure_actor(p_display_name);
  end if;

  insert into participants (plan_id, actor_id, role, joined_via)
  values (v_link.plan_id, v_actor, 'member', v_link.id)
  on conflict do nothing;

  insert into invite_uses (invite_link_id, actor_id) values (v_link.id, v_actor)
  on conflict do nothing;

  return v_link.plan_id;
end;
$$;

commit;

-- ---------------------------------------------------------------------------
-- DA FARE SUBITO DOPO, sul sito in produzione: il messaggio giusto c'era già.
-- index.html mostra "Quel nome è già collegato a qualcun altro: scrivi il tuo"
-- quando arriva 'claim not allowed'. Prima non compariva quasi mai perché il
-- controllo lasciava passare; adesso comparirà quando deve.
--
-- DA VALUTARE: preview_invite espone l'actor_id di ogni partecipante a chi ha
-- il link. Serve alla schermata "Sei uno di questi?", ma dopo questa correzione
-- basterebbe esporre gli id dei soli segnaposto ancora liberi — gli altri non
-- sono rivendicabili e quell'id non serve a nessuno.
-- ---------------------------------------------------------------------------
