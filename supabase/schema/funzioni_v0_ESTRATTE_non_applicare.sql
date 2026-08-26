-- 0001_0002_funzioni.sql — le funzioni di V0, finalmente sotto versione.
--
-- NON è una migrazione da applicare: è il sorgente ESTRATTO dal database di
-- produzione il 24 agosto 2026 con `tools/dump_schema.sql`, riportato qui
-- perché prima esisteva solo dentro Supabase.
--
-- Serve a due cose concrete:
--   1. poter rileggere e rivedere il codice che regge la sicurezza;
--   2. far verificare a `npm run test:rpc` anche le 12 RPC che il client
--      chiama e che finora non si potevano controllare.
--
-- Se le cambi sulla dashboard, riesporta e aggiorna questo file, altrimenti
-- torna a divergere.

-- ============================================================ helper
-- NOTA: kimari_actor_id(), kimari_is_organizer() e kimari_is_participant(),
-- che ho scritto in 0003 e 0005, fanno esattamente la stessa cosa di queste
-- tre. Sono duplicati: vedi la nota in fondo al file.

CREATE OR REPLACE FUNCTION public.current_actor_id()
 RETURNS uuid
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select id from actors where auth_user_id = auth.uid()
$function$;

CREATE OR REPLACE FUNCTION public.is_organizer(p_plan uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select exists (
    select 1 from plans
    where id = p_plan and organizer_id = (select id from actors where auth_user_id = auth.uid())
  )
$function$;

CREATE OR REPLACE FUNCTION public.is_participant(p_plan uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select exists (
    select 1 from participants
    where plan_id = p_plan and actor_id = (select id from actors where auth_user_id = auth.uid())
  )
$function$;

-- ============================================================ profilo

CREATE OR REPLACE FUNCTION public.ensure_actor(p_display_name text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare v_id uuid;
begin
  if auth.uid() is null then raise exception 'not authenticated'; end if;
  select id into v_id from actors where auth_user_id = auth.uid();
  if v_id is null then
    if p_display_name is null or trim(p_display_name) = '' then raise exception 'display_name required'; end if;
    insert into actors (auth_user_id, display_name) values (auth.uid(), trim(p_display_name)) returning id into v_id;
  elsif p_display_name is not null and trim(p_display_name) <> '' then
    update actors set display_name = trim(p_display_name) where id = v_id;
  end if;
  return v_id;
end $function$;

CREATE OR REPLACE FUNCTION public.set_my_email(p_email text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  update actors set email = lower(trim(p_email)) where auth_user_id = auth.uid();
  if not found then raise exception 'no actor'; end if;
end $function$;

-- ============================================================ piani

CREATE OR REPLACE FUNCTION public.create_plan(p jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
declare
  v_actor uuid := current_actor_id();
  v_plan  uuid;
  v_token text;
  c       jsonb;
  i       int := 0;
begin
  if v_actor is null then raise exception 'no actor'; end if;

  insert into plans (title, organizer_id, when_mode, where_mode,
                     starts_at, ends_at, all_day, timezone,
                     place_name, place_address, place_lat, place_lng, place_id, deadline_at)
  values (p->>'title', v_actor,
          coalesce((p->>'when_mode')::field_mode, 'deciding'),
          coalesce((p->>'where_mode')::field_mode, 'deciding'),
          (p->>'starts_at')::timestamptz, (p->>'ends_at')::timestamptz,
          coalesce((p->>'all_day')::boolean, false), p->>'timezone',
          p->>'place_name', p->>'place_address',
          (p->>'place_lat')::double precision, (p->>'place_lng')::double precision, p->>'place_id',
          (p->>'deadline_at')::timestamptz)
  returning id into v_plan;

  for c in select * from jsonb_array_elements(coalesce(p->'when_candidates', '[]'::jsonb)) loop
    i := i + 1;
    insert into candidates (plan_id, field, position, starts_at, ends_at, all_day, timezone, created_by)
    values (v_plan, 'when', i, (c->>'starts_at')::timestamptz, (c->>'ends_at')::timestamptz,
            coalesce((c->>'all_day')::boolean, false), c->>'timezone', v_actor);
  end loop;

  i := 0;
  for c in select * from jsonb_array_elements(coalesce(p->'where_candidates', '[]'::jsonb)) loop
    i := i + 1;
    insert into candidates (plan_id, field, position, place_name, place_address, place_lat, place_lng, place_id, created_by)
    values (v_plan, 'where', i, c->>'place_name', c->>'place_address',
            (c->>'place_lat')::double precision, (c->>'place_lng')::double precision, c->>'place_id', v_actor);
  end loop;

  insert into participants (plan_id, actor_id, role) values (v_plan, v_actor, 'organizer');

  -- 12 byte casuali → 16 caratteri base64url, senza padding
  v_token := translate(encode(gen_random_bytes(12), 'base64'), '+/', '-_');
  insert into invite_links (plan_id, token_hash, created_by)
  values (v_plan, encode(digest(v_token, 'sha256'), 'hex'), v_actor);

  insert into plan_changes (plan_id, version, changed_by, kind, new_value)
  values (v_plan, 0, v_actor, 'created', jsonb_build_object('title', p->>'title'));

  return jsonb_build_object('plan_id', v_plan, 'token', v_token);
end $function$;

CREATE OR REPLACE FUNCTION public.add_candidates(p_plan uuid, p_field plan_field, p_items jsonb)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_actor uuid := current_actor_id();
  v_pos   int;
  c       jsonb;
begin
  if not is_organizer(p_plan) then raise exception 'not organizer'; end if;
  if (select status from plans where id = p_plan) <> 'deciding' then
    raise exception 'plan not deciding';
  end if;
  select coalesce(max(position), 0) into v_pos
    from candidates where plan_id = p_plan and field = p_field;
  for c in select * from jsonb_array_elements(coalesce(p_items, '[]'::jsonb)) loop
    v_pos := v_pos + 1;
    if p_field = 'when' then
      insert into candidates (plan_id, field, position, starts_at, ends_at, all_day, timezone, created_by)
      values (p_plan, 'when', v_pos, (c->>'starts_at')::timestamptz, (c->>'ends_at')::timestamptz,
              coalesce((c->>'all_day')::boolean, false), c->>'timezone', v_actor);
    else
      insert into candidates (plan_id, field, position, place_name, place_address, created_by)
      values (p_plan, 'where', v_pos, c->>'place_name', c->>'place_address', v_actor);
    end if;
  end loop;
end $function$;

CREATE OR REPLACE FUNCTION public.confirm_plan(p_plan uuid, p_when uuid DEFAULT NULL::uuid, p_where uuid DEFAULT NULL::uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_actor uuid := current_actor_id();
  v_plan  plans%rowtype;
  c       candidates%rowtype;
  v_new   jsonb := '{}'::jsonb;
begin
  select * into v_plan from plans where id = p_plan for update;
  if v_plan.id is null or v_plan.organizer_id is distinct from v_actor then raise exception 'not organizer'; end if;
  if v_plan.status <> 'deciding' then raise exception 'plan already closed'; end if;

  if v_plan.when_mode = 'deciding' then
    select * into c from candidates where id = p_when and plan_id = p_plan and field = 'when';
    if c.id is null then raise exception 'when candidate required'; end if;
    update plans set starts_at = c.starts_at, ends_at = c.ends_at, all_day = c.all_day,
                     timezone = c.timezone, when_mode = 'fixed'
    where id = p_plan;
    v_new := v_new || jsonb_build_object('starts_at', c.starts_at, 'ends_at', c.ends_at,
                                         'all_day', c.all_day, 'timezone', c.timezone);
  end if;

  if v_plan.where_mode = 'deciding' then
    select * into c from candidates where id = p_where and plan_id = p_plan and field = 'where';
    if c.id is null then raise exception 'where candidate required'; end if;
    update plans set place_name = c.place_name, place_address = c.place_address,
                     place_lat = c.place_lat, place_lng = c.place_lng, place_id = c.place_id,
                     where_mode = 'fixed'
    where id = p_plan;
    v_new := v_new || jsonb_build_object('place_name', c.place_name, 'place_address', c.place_address);
  end if;

  update plans set status = 'confirmed', version = 1, confirmed_at = now() where id = p_plan;
  insert into plan_changes (plan_id, version, changed_by, kind, new_value)
  values (p_plan, 1, v_actor, 'confirmed', v_new);
end $function$;

CREATE OR REPLACE FUNCTION public.update_plan_field(p_plan uuid, p_field plan_field, p_value jsonb, p_note text DEFAULT NULL::text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_actor uuid := current_actor_id();
  v_plan  plans%rowtype;
  v_old   jsonb;
begin
  select * into v_plan from plans where id = p_plan for update;
  if v_plan.id is null or v_plan.organizer_id is distinct from v_actor then raise exception 'not organizer'; end if;
  if v_plan.status <> 'confirmed' then raise exception 'plan not confirmed'; end if;

  if p_field = 'when' then
    if p_value->>'starts_at' is null then raise exception 'starts_at required'; end if;
    v_old := jsonb_build_object('starts_at', v_plan.starts_at, 'ends_at', v_plan.ends_at,
                                'all_day', v_plan.all_day, 'timezone', v_plan.timezone);
    update plans set starts_at = (p_value->>'starts_at')::timestamptz,
                     ends_at   = (p_value->>'ends_at')::timestamptz,
                     all_day   = coalesce((p_value->>'all_day')::boolean, false),
                     timezone  = coalesce(p_value->>'timezone', timezone),
                     when_mode = 'fixed'
    where id = p_plan;
  else
    if p_value->>'place_name' is null then raise exception 'place_name required'; end if;
    v_old := jsonb_build_object('place_name', v_plan.place_name, 'place_address', v_plan.place_address);
    update plans set place_name    = p_value->>'place_name',
                     place_address = p_value->>'place_address',
                     place_lat     = (p_value->>'place_lat')::double precision,
                     place_lng     = (p_value->>'place_lng')::double precision,
                     place_id      = p_value->>'place_id',
                     where_mode    = 'fixed'
    where id = p_plan;
  end if;

  update plans set version = version + 1 where id = p_plan;
  insert into plan_changes (plan_id, version, changed_by, kind, old_value, new_value, note)
  values (p_plan, v_plan.version + 1, v_actor, p_field::text || '_changed', v_old, p_value, p_note);
end $function$;

CREATE OR REPLACE FUNCTION public.cancel_plan(p_plan uuid, p_note text DEFAULT NULL::text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare v_actor uuid := current_actor_id(); v_plan plans%rowtype;
begin
  select * into v_plan from plans where id = p_plan for update;
  if v_plan.id is null or v_plan.organizer_id is distinct from v_actor then raise exception 'not organizer'; end if;
  if v_plan.status = 'cancelled' then return; end if;
  update plans set status = 'cancelled', version = version + 1 where id = p_plan;
  insert into plan_changes (plan_id, version, changed_by, kind, note)
  values (p_plan, v_plan.version + 1, v_actor, 'cancelled', p_note);
end $function$;

CREATE OR REPLACE FUNCTION public.set_rsvp(p_plan uuid, p_rsvp rsvp_status)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  update participants
     set rsvp = p_rsvp,
         rsvp_at = case when rsvp is distinct from p_rsvp then now() else rsvp_at end
   where plan_id = p_plan and actor_id = current_actor_id();
  if not found then raise exception 'not a participant'; end if;
end $function$;

CREATE OR REPLACE FUNCTION public.remove_participant(p_plan uuid, p_actor uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  if not is_organizer(p_plan) then raise exception 'not organizer'; end if;
  if p_actor = current_actor_id() then raise exception 'cannot remove yourself'; end if;
  delete from approvals where actor_id = p_actor
    and candidate_id in (select id from candidates where plan_id = p_plan);
  delete from ballots where plan_id = p_plan and actor_id = p_actor;
  delete from participants where plan_id = p_plan and actor_id = p_actor;
end $function$;

-- ============================================================ voto

CREATE OR REPLACE FUNCTION public.submit_ballot(p_plan uuid, p_field plan_field, p_candidates uuid[], p_none_ok boolean DEFAULT false, p_note text DEFAULT NULL::text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_actor  uuid := current_actor_id();
  v_status plan_status;
begin
  if v_actor is null then raise exception 'no actor'; end if;
  if not exists (select 1 from participants where plan_id = p_plan and actor_id = v_actor) then
    raise exception 'not a participant';
  end if;
  select status into v_status from plans where id = p_plan for update;
  if v_status <> 'deciding' then raise exception 'plan not deciding'; end if;
  if exists (
    select 1 from unnest(coalesce(p_candidates, '{}'::uuid[])) cid
    where not exists (select 1 from candidates where id = cid and plan_id = p_plan and field = p_field)
  ) then
    raise exception 'invalid candidate';
  end if;

  delete from approvals
  where actor_id = v_actor
    and candidate_id in (select id from candidates where plan_id = p_plan and field = p_field);

  insert into approvals (candidate_id, actor_id)
  select cid, v_actor from unnest(coalesce(p_candidates, '{}'::uuid[])) cid;

  insert into ballots (plan_id, actor_id, field, none_ok, note)
  values (p_plan, v_actor, p_field, p_none_ok, p_note)
  on conflict (plan_id, actor_id, field)
  do update set none_ok = excluded.none_ok, note = excluded.note, submitted_at = now();
end $function$;

-- ============================================================ inviti

CREATE OR REPLACE FUNCTION public.preview_invite(p_token text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
declare
  v_link   invite_links%rowtype;
  v_plan   plans%rowtype;
  v_org    text;
  v_voters int;
  v_cands  jsonb;
  v_people jsonb;
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

  -- nomi dei partecipanti: servono per "Sei uno di questi?"
  select coalesce(jsonb_agg(jsonb_build_object('actor_id', a.id, 'name', a.display_name) order by a.display_name), '[]'::jsonb)
    into v_people
    from participants pa join actors a on a.id = pa.actor_id
    where pa.plan_id = v_plan.id;

  return jsonb_build_object(
    'ok', true, 'plan_id', v_plan.id, 'title', v_plan.title, 'status', v_plan.status,
    'version', v_plan.version, 'organizer', v_org, 'voters', v_voters,
    'when_mode', v_plan.when_mode, 'where_mode', v_plan.where_mode,
    'starts_at', v_plan.starts_at, 'ends_at', v_plan.ends_at, 'all_day', v_plan.all_day, 'timezone', v_plan.timezone,
    'place_name', v_plan.place_name, 'place_address', v_plan.place_address,
    'deadline_at', v_plan.deadline_at, 'candidates', v_cands, 'people', v_people
  );
end $function$;

CREATE OR REPLACE FUNCTION public.join_plan(p_token text, p_display_name text, p_claim_actor uuid DEFAULT NULL::uuid)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
declare
  v_link    invite_links%rowtype;
  v_actor   uuid;
  v_uses    int;
  v_is_anon boolean;
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
end $function$;

CREATE OR REPLACE FUNCTION public.create_invite_link(p_plan uuid, p_max_uses integer DEFAULT NULL::integer, p_expires_at timestamp with time zone DEFAULT NULL::timestamp with time zone)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
declare v_token text;
begin
  if not is_organizer(p_plan) then raise exception 'not organizer'; end if;
  v_token := translate(encode(gen_random_bytes(12), 'base64'), '+/', '-_');
  insert into invite_links (plan_id, token_hash, created_by, max_uses, expires_at)
  values (p_plan, encode(digest(v_token, 'sha256'), 'hex'), current_actor_id(), p_max_uses, p_expires_at);
  return v_token;
end $function$;

CREATE OR REPLACE FUNCTION public.revoke_invite_links(p_plan uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  if not is_organizer(p_plan) then raise exception 'not organizer'; end if;
  update invite_links set revoked_at = now() where plan_id = p_plan and revoked_at is null;
end $function$;

-- ============================================================ metriche

CREATE OR REPLACE FUNCTION public.log_event(p_name text, p_plan uuid DEFAULT NULL::uuid, p_props jsonb DEFAULT '{}'::jsonb)
 RETURNS void
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  insert into funnel_events (actor_id, plan_id, name, props)
  values (current_actor_id(), p_plan, p_name, coalesce(p_props, '{}'::jsonb));
$function$;

-- ============================================================ trigger

-- Massimo 5 opzioni per campo. Vincolo di prodotto che non era scritto da
-- nessuna parte fuori dal database: le domande extra di 0005 NON ce l'hanno.
CREATE OR REPLACE FUNCTION public.enforce_max_candidates()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
begin
  if (select count(*) from candidates where plan_id = new.plan_id and field = new.field) >= 5 then
    raise exception 'max 5 candidates per field';
  end if;
  return new;
end $function$;

CREATE OR REPLACE FUNCTION public.touch_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
begin
  new.updated_at := now();
  return new;
end $function$;

-- ---------------------------------------------------------------------------
-- DA SISTEMARE, emerso confrontando questo file con 0003-0007:
--
-- 1. TRE HELPER DUPLICATI. current_actor_id / kimari_actor_id,
--    is_organizer / kimari_is_organizer, is_participant / kimari_is_participant
--    fanno la stessa identica cosa. Le ho scritte non sapendo che c'erano già.
--    Non è un bug — funzionano entrambe — ma è codice di sicurezza in doppia
--    copia: chi un domani cambia una versione e non l'altra fa divergere le
--    policy senza accorgersene. Da consolidare su una sola coppia.
--
-- 2. `plan_field` è un ENUM, non text. Le mie proposals.field usano text con
--    un CHECK: se all'enum si aggiunge un terzo campo, il mio CHECK non lo sa.
--
-- 3. I token: V0 usa 12 byte casuali → 16 caratteri (96 bit) con
--    digest() da pgcrypto; i miei inviti di gruppo usano due UUID → 64
--    caratteri (~244 bit) con sha256() nativa. Sono entrambi robusti, ma sono
--    due strade diverse per la stessa cosa.
-- ---------------------------------------------------------------------------
