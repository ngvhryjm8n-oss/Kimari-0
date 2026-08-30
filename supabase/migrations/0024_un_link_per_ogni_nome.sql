-- 0024 — un link personale per ogni nome dell'elenco.
--
-- La 0023 ha chiuso l'impersonificazione togliendo "Sei uno di questi?": adesso
-- il nome crea sempre un'identita' nuova. Il prezzo era un doppione — il
-- segnaposto "Liviana" e la vera Liviana come due partecipanti diversi.
--
-- Questa lo toglie, ma dalla parte giusta. Il problema della lista di bottoni
-- non era il claim in se': era che la PROVA di essere Liviana fosse un bottone
-- visibile a chiunque avesse il link del piano. Qui la prova diventa un link
-- suo, che l'organizzatore manda a lei e a nessun altro.
--
--   link del piano   → chiunque lo apra entra come persona NUOVA
--   link di Liviana  → chi lo apre entra come Liviana, e come nessun altro
--
-- COSA SI ACCETTA, detto chiaro: se Liviana inoltra il suo link, chi lo riceve
-- diventa Liviana. E' inevitabile — vale per ogni credenziale — ma e' molto
-- diverso da prima: prima bastava il link del PIANO, che gira apposta in un
-- gruppo WhatsApp, e i nomi erano esposti a tutti.
--
-- IL LEGAME E' AL PRIMO USO. Chi apre per primo il link diventa Liviana; da
-- quel momento quel link funziona solo per lui. Un secondo dispositivo diverso
-- viene rifiutato con un messaggio leggibile, e l'organizzatore puo'
-- rigenerare. Meglio bloccare e far rigenerare che lasciare un nome
-- rivendicabile a ripetizione.
--
-- I token restano HASHATI come tutti gli altri: il server sa che un link
-- esiste, non sa qual e'. Il "Copia" nell'app funziona sul dispositivo che
-- l'ha generato, dove il token e' rimasto in locale; altrove il bottone dice
-- "Rigenera". Salvare i token in chiaro per comodita' indebolirebbe ogni
-- invito, non solo questi.

begin;

alter table public.invite_links
  add column if not exists for_actor uuid references public.actors(id) on delete cascade;

-- Un solo link vivo per persona: rigenerare revoca il precedente, se no un
-- link vecchio girato mesi fa resterebbe buono per sempre.
create unique index if not exists invite_links_una_per_persona
  on public.invite_links (plan_id, for_actor)
  where for_actor is not null and revoked_at is null;

-- ------------------------------------------------------ generare il link
create or replace function public.create_person_invite(p_plan uuid, p_actor uuid)
returns text
language plpgsql
security definer
set search_path to 'public', 'extensions'
as $function$
declare
  v_token text;
  v_ha_account boolean;
begin
  if not is_organizer(p_plan) then raise exception 'not organizer'; end if;

  if not exists (select 1 from participants where plan_id = p_plan and actor_id = p_actor) then
    raise exception 'quella persona non e'' in questo piano';
  end if;

  -- Solo per i SEGNAPOSTO. Chi ha gia' un account entra col suo: dargli un
  -- link che lo fa diventare qualcun altro sarebbe il buco di prima con un
  -- altro nome.
  select (u.id is not null and coalesce(u.is_anonymous, false) = false)
    into v_ha_account
    from actors a left join auth.users u on u.id = a.auth_user_id
   where a.id = p_actor;
  if coalesce(v_ha_account, false) then
    raise exception 'quella persona ha gia'' un account: entra da sola';
  end if;

  update invite_links set revoked_at = now()
   where plan_id = p_plan and for_actor = p_actor and revoked_at is null;

  v_token := translate(encode(gen_random_bytes(12), 'base64'), '+/', '-_');
  insert into invite_links (plan_id, token_hash, created_by, for_actor)
  values (p_plan, encode(digest(v_token, 'sha256'), 'hex'), current_actor_id(), p_actor);
  return v_token;
end $function$;

-- Quali nomi hanno gia' un link vivo. Serve all'app per scrivere "generato"
-- accanto al nome: il TOKEN non si puo' ridare (e' hashato), ma sapere che
-- esiste si'.
create or replace function public.person_invites(p_plan uuid)
returns table (actor_id uuid, creato timestamptz)
language plpgsql
security definer
set search_path to 'public'
as $function$
begin
  if not is_organizer(p_plan) then raise exception 'not organizer'; end if;
  return query
    select l.for_actor, l.created_at
      from invite_links l
     where l.plan_id = p_plan and l.for_actor is not null and l.revoked_at is null;
end $function$;

-- ------------------------------------------------------------- entrare
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
  v_legato  uuid;
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

  -- Il claim per nome non esiste piu' (0023): la prova di essere qualcuno e'
  -- il link personale qui sotto, non un bottone visibile a chiunque.
  if p_claim_actor is not null then
    raise exception 'Entra col tuo nome: non si puo'' piu'' entrare con quello di un altro';
  end if;

  if v_link.for_actor is not null then
    select auth_user_id into v_legato from actors where id = v_link.for_actor;
    if v_legato is null then
      -- Primo uso: da qui in poi questo nome e' di chi ha in mano il link.
      update actors set auth_user_id = auth.uid() where id = v_link.for_actor;
    elsif v_legato is distinct from auth.uid() then
      raise exception 'Questo link personale e'' gia'' stato usato da un altro dispositivo. Chiedi a chi organizza di rigenerarlo.';
    end if;
    v_actor := v_link.for_actor;
    -- Il nome scritto dall'organizzatore vince: chi entra da un link personale
    -- non si rinomina da solo.
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

-- ---------------------------------------------------------- l'anteprima
-- Con un link personale la pagina deve poter dire "stai entrando come
-- Liviana" e non chiedere il nome. Si manda SOLO quel nome, non l'elenco: e'
-- il nome di chi ha in mano il link, e lo sa gia'.
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
  v_come   text;
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

  if v_link.for_actor is not null then
    select display_name into v_come from actors where id = v_link.for_actor;
  end if;

  return jsonb_build_object(
    'ok', true, 'plan_id', v_plan.id, 'title', v_plan.title, 'status', v_plan.status,
    'version', v_plan.version, 'organizer', v_org, 'voters', v_voters,
    'when_mode', v_plan.when_mode, 'where_mode', v_plan.where_mode,
    'starts_at', v_plan.starts_at, 'ends_at', v_plan.ends_at, 'all_day', v_plan.all_day,
    'timezone', v_plan.timezone,
    'place_name', v_plan.place_name, 'place_address', v_plan.place_address,
    'deadline_at', v_plan.deadline_at, 'candidates', v_cands,
    -- Vuota dalla 0023: i nomi di chi partecipa non si dicono a chi ha il
    -- link del piano. Il campo resta per non far cadere i client vecchi.
    'people', '[]'::jsonb,
    -- Valorizzato solo dai link personali.
    'come', v_come
  );
end $function$;

commit;
