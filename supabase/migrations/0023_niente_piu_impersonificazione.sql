-- 0023 — nessuno entra col nome di un altro.
--
-- IL DIFETTO, dal primo test con persone vere (kimari-work-order-fix.md, fix 4).
-- Chi apriva un link d'invito vedeva l'elenco dei nomi gia' nel piano e poteva
-- toccarne uno — "Sei uno di questi?" — entrando come quella persona.
--
-- Non era una svista: era una comodita' voluta. L'organizzatore scrive i nomi
-- degli amici, ognuno tocca il suo e non si creano doppioni. Il problema e'
-- cosa comporta davvero:
--
--   1. il link gira su WhatsApp e viene inoltrato. CHIUNQUE lo riceva puo'
--      scegliere di essere Liviana e votare al posto suo.
--   2. il claim era DEFINITIVO: join_plan faceva
--        update actors set auth_user_id = auth.uid() where id = p_claim_actor
--      cioe' legava quel nome al telefono di chi aveva toccato per primo. La
--      vera Liviana, arrivando dopo, non poteva piu' rivendicarlo. Primo
--      arrivato, primo servito, e senza appello.
--
-- Il claim era gia' ristretto agli attori SENZA account: non si poteva rubare
-- l'identita' di una persona registrata. Ma fra "non puoi rubare un account" e
-- "non puoi spacciarti per un invitato" c'e' la differenza che il test con
-- persone vere ha trovato.
--
-- COSA CAMBIA (e nient'altro: i due corpi sono quelli estratti dal database
-- il 24/8, con le sole righe qui sotto diverse):
--   - join_plan rifiuta ogni claim. Il nome crea SEMPRE un'identita' nuova.
--   - preview_invite non manda piu' l'elenco dei nomi. Restituisce comunque
--     'people' come lista VUOTA invece di togliere il campo: un client vecchio
--     rimasto in cache trova zero nomi, non disegna nessun bottone, e cade da
--     solo sul campo del nome. Togliere il campo lo farebbe cadere e basta.
--
-- CONSEGUENZA DA SAPERE: se l'organizzatore scrive "Liviana" e poi la vera
-- Liviana entra col suo nome, nel piano compaiono DUE Liviana — il segnaposto
-- e la persona. L'organizzatore puo' togliere il segnaposto con
-- remove_participant. E' il prezzo di non far impersonare nessuno, ed e' il
-- verso giusto in cui sbagliare: un doppione si cancella, un voto rubato no.
--
-- Collegarsi a un membro esistente resta possibile in un modo solo: entrare
-- con l'account di quel membro (fix 4, punto 4).
--
-- NOTA su search_path: 'public', 'extensions' — non e' decorativo, digest()
-- vive in extensions. Copiarlo storto fa fallire ogni invito.

begin;

create or replace function public.preview_invite(p_token text)
returns jsonb
language plpgsql
security definer
set search_path to 'public', 'extensions'
as $function$
declare
  v_link   invite_links%rowtype;
  v_plan   plans%rowtype;
  v_org    text;
  v_voters int;
  v_cands  jsonb;
begin
  select * into v_link from invite_links where token_hash = encode(digest(p_token, 'sha256'), 'hex');
  if v_link.id is null or v_link.revoked_at is not null
     or (v_link.expires_at is not null and v_link.expires_at < now()) then
    return jsonb_build_object('ok', false, 'reason', 'invalid');
  end if;

  select * into v_plan from plans where id = v_link.plan_id;
  select display_name into v_org from actors where id = v_plan.organizer_id;
  select count(distinct actor_id) into v_voters from ballots where plan_id = v_plan.id;

  select coalesce(jsonb_agg(jsonb_build_object(
           'id', id, 'field', field, 'position', position,
           'starts_at', starts_at, 'ends_at', ends_at, 'all_day', all_day, 'timezone', timezone,
           'place_name', place_name, 'place_address', place_address
         ) order by field, position), '[]'::jsonb)
    into v_cands from candidates where plan_id = v_plan.id;

  -- I nomi di chi partecipa NON si dicono a chi ha solo il link (0023).
  -- Prima erano qui, e servivano a "Sei uno di questi?".

  return jsonb_build_object(
    'ok', true, 'plan_id', v_plan.id, 'title', v_plan.title, 'status', v_plan.status,
    'version', v_plan.version, 'organizer', v_org, 'voters', v_voters,
    'when_mode', v_plan.when_mode, 'where_mode', v_plan.where_mode,
    'starts_at', v_plan.starts_at, 'ends_at', v_plan.ends_at, 'all_day', v_plan.all_day, 'timezone', v_plan.timezone,
    'place_name', v_plan.place_name, 'place_address', v_plan.place_address,
    'deadline_at', v_plan.deadline_at, 'candidates', v_cands, 'people', '[]'::jsonb
  );
end $function$;

create or replace function public.join_plan(
  p_token text, p_display_name text, p_claim_actor uuid default null::uuid)
returns uuid
language plpgsql
security definer
set search_path to 'public', 'extensions'
as $function$
declare
  v_link    invite_links%rowtype;
  v_actor   uuid;
  v_uses    int;
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

  -- QUI stava il buco. Il messaggio e' scritto per essere letto da una
  -- persona: la regola 5 mostra a schermo il dettaglio vero di Supabase,
  -- quindi questo testo finisce davanti a chi ha in mano il telefono.
  if p_claim_actor is not null then
    raise exception 'Entra col tuo nome: non si puo'' piu'' entrare con quello di un altro';
  end if;

  v_actor := ensure_actor(p_display_name);

  insert into participants (plan_id, actor_id, role, joined_via)
  values (v_link.plan_id, v_actor, 'member', v_link.id)
  on conflict do nothing;

  insert into invite_uses (invite_link_id, actor_id) values (v_link.id, v_actor)
  on conflict do nothing;

  return v_link.plan_id;
end $function$;

commit;
