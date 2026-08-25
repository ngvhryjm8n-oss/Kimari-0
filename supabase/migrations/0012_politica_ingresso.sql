-- 0012_politica_ingresso.sql — quanto è chiuso un piano.
--
-- Il problema, sollevato da Vincenzo: con un link aperto uno può votare più
-- volte. Basta una finestra anonima nuova, un nome diverso, e si vota ancora.
-- Nessuna competenza richiesta.
--
-- Obbligare il login lo risolverebbe, ma toglie di mezzo la cosa che regge il
-- prodotto: si vota dal link senza installare niente. Quindi tre livelli, e
-- l'organizzatore sceglie quanto stringere:
--
--   'open'    (predefinito) chi ha il link entra scrivendo un nome. Difese:
--             tetto di utilizzi sul link, scadenza, revoca, e la possibilità
--             di togliere qualcuno. Il voto resta nominale e l'organizzatore
--             vede l'elenco: chi imbroglia si nota.
--   'roster'  elenco chiuso. L'organizzatore scrive i nomi del gruppo, chi
--             apre il link DEVE rivendicarne uno e ogni nome si prende una
--             volta sola. Falsificare diventa impossibile senza chiedere il
--             login a nessuno.
--   'account' serve un account vero (Google/Apple), niente ospiti.
--
-- Le difese di 'open' esistevano già dalla 0001 — invite_links.max_uses,
-- expires_at, revoke_invite_links, remove_participant — e non le usava
-- nessuno. Qui si aggiunge solo il modo di impostarle senza creare un link
-- nuovo, così quello già mandato nel gruppo continua a valere (regola 2).

begin;

do $$
begin
  if to_regclass('public.invite_links') is null then
    raise exception 'schema inatteso: manca invite_links';
  end if;
  if exists (
    select 1 from information_schema.columns
     where table_schema = 'public' and table_name = 'plans' and column_name = 'join_policy'
  ) then
    raise exception '0012 è già applicata: plans.join_policy esiste.';
  end if;
end $$;

alter table public.plans add column join_policy text not null default 'open'
  check (join_policy in ('open', 'roster', 'account'));

create function public.set_join_policy(p_plan uuid, p_policy text)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if not public.kimari_is_organizer(p_plan) then
    raise exception 'solo chi organizza può cambiare come si entra';
  end if;
  if p_policy not in ('open', 'roster', 'account') then
    raise exception 'politica non valida';
  end if;
  -- Stringere a votazione in corso è legittimo (ci si accorge di un problema);
  -- allargarla dopo aver chiuso no, il piano è già deciso.
  if not exists (select 1 from public.plans where id = p_plan and status = 'deciding') then
    raise exception 'il piano non è più ai voti';
  end if;

  update public.plans set join_policy = p_policy where id = p_plan;
end;
$$;

-- ------------------------------------------------- l'elenco chiuso
-- Un partecipante che esiste come NOME e basta: nessun account, nessuna email.
-- Quando la persona apre il link se lo rivendica, e quel nome è preso.
-- È il pezzo che in 0003 avevo lasciato fuori perché non conoscevo i vincoli di
-- actors; ora si sa che auth_user_id è nullable, ed è proprio così che join_plan
-- riconosce un segnaposto rivendicabile.
create function public.add_plan_placeholder(p_plan uuid, p_name text)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_actor uuid;
  v_n     integer;
begin
  if not public.kimari_is_organizer(p_plan) then
    raise exception 'solo chi organizza può scrivere l''elenco';
  end if;
  if coalesce(btrim(p_name), '') = '' then
    raise exception 'serve un nome';
  end if;

  select count(*) into v_n from public.participants where plan_id = p_plan;
  if v_n >= 50 then
    raise exception 'massimo 50 persone per piano';
  end if;

  if exists (
    select 1 from public.participants pa
      join public.actors a on a.id = pa.actor_id
     where pa.plan_id = p_plan and lower(a.display_name) = lower(btrim(p_name))
  ) then
    raise exception 'quel nome è già nell''elenco';
  end if;

  insert into public.actors (display_name) values (btrim(p_name)) returning id into v_actor;
  insert into public.participants (plan_id, actor_id, role) values (p_plan, v_actor, 'member');

  return v_actor;
end;
$$;

-- Togliere un nome dall'elenco, finché nessuno se l'è preso.
create function public.remove_plan_placeholder(p_actor uuid, p_plan uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if not public.kimari_is_organizer(p_plan) then
    raise exception 'solo chi organizza può togliere dall''elenco';
  end if;
  if exists (select 1 from public.actors where id = p_actor and auth_user_id is not null) then
    raise exception 'quella persona è già entrata: usa remove_participant';
  end if;

  delete from public.participants where plan_id = p_plan and actor_id = p_actor;
  delete from public.actors
   where id = p_actor
     and auth_user_id is null
     and not exists (select 1 from public.participants where actor_id = p_actor);
end;
$$;

-- --------------------------------------- limiti sul link già condiviso
-- Si aggiornano sul link ESISTENTE invece di crearne uno nuovo: quello già
-- mandato nel gruppo deve continuare a funzionare (regola 2).
create function public.set_invite_limits(p_plan uuid, p_max_uses integer default null,
                                         p_expires_at timestamptz default null)
returns integer
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_n integer;
  v_usati integer;
begin
  if not public.kimari_is_organizer(p_plan) then
    raise exception 'solo chi organizza può mettere limiti al link';
  end if;
  if p_max_uses is not null then
    if p_max_uses < 1 then raise exception 'il tetto deve essere almeno 1'; end if;
    -- Un tetto sotto il numero di chi è già entrato non caccia nessuno, ma
    -- confonde: meglio dirlo subito.
    select count(*) into v_usati
      from public.invite_uses u
      join public.invite_links l on l.id = u.invite_link_id
     where l.plan_id = p_plan;
    if p_max_uses < v_usati then
      raise exception 'sono già entrate % persone: il tetto non può essere più basso', v_usati;
    end if;
  end if;

  update public.invite_links
     set max_uses = p_max_uses, expires_at = p_expires_at
   where plan_id = p_plan and revoked_at is null;

  get diagnostics v_n = row_count;
  return v_n;
end;
$$;

-- ---------------------------------------------------------------- join_plan
-- Riscritta a partire dal sorgente estratto dal database (0001), con in più il
-- controllo della politica. Tutto il resto — token, scadenza, tetto, claim,
-- invite_uses — è identico all'originale: è codice che funziona in produzione
-- da mesi e non c'era motivo di ripensarlo.
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

  -- NUOVO: chi è già dentro rientra sempre, qualunque sia la politica. Le
  -- regole valgono per chi arriva, non per chi torna.
  if current_actor_id() is not null
     and exists (select 1 from participants
                  where plan_id = v_link.plan_id and actor_id = current_actor_id()) then
    return v_link.plan_id;
  end if;

  -- NUOVO: 'account' non ammette ospiti.
  if v_policy = 'account' then
    select coalesce(is_anonymous, true) into v_is_anon from auth.users where id = auth.uid();
    if v_is_anon then
      raise exception 'per questo piano serve entrare con il proprio account';
    end if;
  end if;

  -- NUOVO: 'roster' ammette solo chi si riconosce in un nome dell'elenco.
  if v_policy = 'roster' and p_claim_actor is null then
    raise exception 'per questo piano si entra scegliendo il proprio nome dall''elenco';
  end if;

  if p_claim_actor is not null and current_actor_id() is null then
    select coalesce(u.is_anonymous, true) into v_is_anon
      from actors a
      left join auth.users u on u.id = a.auth_user_id
      where a.id = p_claim_actor
        and exists (select 1 from participants where plan_id = v_link.plan_id and actor_id = a.id);
    if not found or v_is_anon = false then raise exception 'claim not allowed'; end if;
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

-- ---------------------------------------------------------------- permessi
revoke execute on function
  public.set_join_policy(uuid, text),
  public.add_plan_placeholder(uuid, text),
  public.remove_plan_placeholder(uuid, uuid),
  public.set_invite_limits(uuid, integer, timestamptz)
from public;

grant execute on function
  public.set_join_policy(uuid, text),
  public.add_plan_placeholder(uuid, text),
  public.remove_plan_placeholder(uuid, uuid),
  public.set_invite_limits(uuid, integer, timestamptz)
to authenticated;

commit;
