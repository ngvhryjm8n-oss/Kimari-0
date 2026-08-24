-- 0003_groups.sql — Fase 1 del PIANO_V1: gruppi, membri, sezioni private.
--
-- SCRITTA SENZA AVER VISTO 0001/0002. È deliberatamente ADDITIVA: crea oggetti
-- nuovi, non tocca nessuna tabella, policy o funzione esistente. L'unica
-- eccezione è una colonna nullable aggiunta a `plans`.
--
-- Assunzioni, tutte ricavate leggendo index.html:
--   actors(id uuid, auth_user_id uuid, display_name text)
--   plans(id uuid, status text in 'deciding'|'confirmed'|'cancelled')
--   participants(plan_id uuid, actor_id uuid, role text)
--   ensure_actor(p_display_name text)
-- Il blocco di preflight qui sotto le verifica e fa fallire tutto se non reggono.
--
-- PRIMA DI APPLICARLA IN PRODUZIONE: fai girare 0001/0002 + questa su un
-- progetto Supabase di prova, oppure applicala dopo aver esportato lo schema
-- (vedi ../README.md). Gira in una transazione: o passa tutta o non passa niente.
--
-- NON INCLUSO, di proposito: i membri "segnaposto" (un admin che aggiunge
-- "Mamma" prima che Mamma abbia un account) e il claim "Sei uno di questi?".
-- Servono a inserire righe in `actors` senza auth_user_id, e i vincoli di
-- quella tabella non li conosco. Da fare dopo l'export.

begin;

-- ---------------------------------------------------------------- preflight
do $$
begin
  if to_regclass('public.actors') is null then
    raise exception 'manca public.actors: schema inatteso, non applicare';
  end if;
  if to_regclass('public.plans') is null then
    raise exception 'manca public.plans: schema inatteso, non applicare';
  end if;
  if to_regclass('public.participants') is null then
    raise exception 'manca public.participants: schema inatteso, non applicare';
  end if;
  if to_regclass('public.groups') is not null then
    raise exception 'public.groups esiste già: 0003 sembra già applicata';
  end if;
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'actors' and column_name = 'auth_user_id'
  ) then
    raise exception 'actors.auth_user_id non trovata: questa migrazione ci si appoggia';
  end if;
  if not exists (
    select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = 'ensure_actor'
  ) then
    raise exception 'ensure_actor() non trovata: join_group la usa per creare l''actor';
  end if;

  -- join_group inserisce in participants solo (plan_id, actor_id, role). Se la
  -- tabella ha altre colonne obbligatorie senza default l'insert fallirebbe a
  -- runtime, col gruppo già creato: meglio saperlo adesso che a metà strada.
  if exists (
    select 1 from information_schema.columns
     where table_schema = 'public' and table_name = 'participants'
       and is_nullable = 'NO' and column_default is null
       and column_name not in ('plan_id', 'actor_id', 'role')
  ) then
    raise exception 'participants ha colonne obbligatorie che join_group non valorizza: %',
      (select string_agg(column_name, ', ')
         from information_schema.columns
        where table_schema = 'public' and table_name = 'participants'
          and is_nullable = 'NO' and column_default is null
          and column_name not in ('plan_id', 'actor_id', 'role'));
  end if;
end $$;

-- ---------------------------------------------------------------- tabelle
create table public.groups (
  id          uuid primary key default gen_random_uuid(),
  name        text        not null check (length(btrim(name)) between 1 and 60),
  emoji       text        not null default '👥' check (length(emoji) <= 8),
  color       text        not null default '#007AFF' check (color ~ '^#[0-9A-Fa-f]{6}$'),
  created_by  uuid        not null references public.actors(id),
  created_at  timestamptz not null default now()
);

create table public.group_members (
  group_id   uuid        not null references public.groups(id) on delete cascade,
  actor_id   uuid        not null references public.actors(id) on delete cascade,
  role       text        not null default 'member' check (role in ('admin', 'member')),
  joined_at  timestamptz not null default now(),
  primary key (group_id, actor_id)
);

create index group_members_actor_idx on public.group_members (actor_id);

-- Sezioni: sono di chi le crea e NON le vede nessun altro. Servono a ordinare
-- le proprie cerchie (Roma, Bari…), non sono una proprietà del gruppo.
create table public.sections (
  id          uuid primary key default gen_random_uuid(),
  actor_id    uuid        not null references public.actors(id) on delete cascade,
  name        text        not null check (length(btrim(name)) between 1 and 40),
  position    integer     not null default 0,
  created_at  timestamptz not null default now()
);

create index sections_actor_idx on public.sections (actor_id, position);

create table public.group_sections (
  actor_id    uuid not null references public.actors(id)  on delete cascade,
  group_id    uuid not null references public.groups(id)  on delete cascade,
  section_id  uuid not null references public.sections(id) on delete cascade,
  primary key (actor_id, group_id)
);

-- Inviti di gruppo. Stesso schema di sicurezza degli inviti ai piani: in
-- tabella ci sta solo lo sha256, il token in chiaro esiste una volta sola nella
-- risposta di create_group_invite.
-- NOTA: se dopo l'export si scopre che invite_links è già generica, questa
-- tabella va fusa con quella invece di restare separata.
create table public.group_invite_links (
  id          uuid primary key default gen_random_uuid(),
  group_id    uuid        not null references public.groups(id) on delete cascade,
  token_hash  text        not null unique,
  created_by  uuid        not null references public.actors(id),
  created_at  timestamptz not null default now(),
  revoked_at  timestamptz
);

create index group_invite_links_group_idx on public.group_invite_links (group_id);

-- I piani possono appartenere a un gruppo. Nullable: i piani esistenti restano
-- validi e i link ?t= continuano a funzionare identici (regola 2).
alter table public.plans add column group_id uuid references public.groups(id) on delete set null;
create index plans_group_idx on public.plans (group_id);

-- ---------------------------------------------------------------- helper
-- security definer: leggono saltando la RLS. Senza questo le policy su
-- group_members si richiamerebbero da sole e Postgres andrebbe in ricorsione.

create function public.kimari_actor_id()
returns uuid
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select a.id from public.actors a where a.auth_user_id = auth.uid();
$$;

create function public.kimari_is_group_member(p_group uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from public.group_members gm
    where gm.group_id = p_group
      and gm.actor_id = public.kimari_actor_id()
  );
$$;

create function public.kimari_is_group_admin(p_group uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from public.group_members gm
    where gm.group_id = p_group
      and gm.actor_id = public.kimari_actor_id()
      and gm.role = 'admin'
  );
$$;

-- ---------------------------------------------------------------- RLS
-- Come in 0001: SOLA LETTURA. Nessuna policy di insert/update/delete, mai.
-- Si scrive solo attraverso le RPC security definer più sotto.

alter table public.groups             enable row level security;
alter table public.group_members      enable row level security;
alter table public.sections           enable row level security;
alter table public.group_sections     enable row level security;
alter table public.group_invite_links enable row level security;

create policy groups_read on public.groups
  for select using (public.kimari_is_group_member(id));

create policy group_members_read on public.group_members
  for select using (public.kimari_is_group_member(group_id));

-- Le sezioni sono private: nemmeno gli altri membri del gruppo le vedono.
create policy sections_read on public.sections
  for select using (actor_id = public.kimari_actor_id());

create policy group_sections_read on public.group_sections
  for select using (actor_id = public.kimari_actor_id());

-- Nessuna policy su group_invite_links: i token non si leggono mai da client,
-- si toccano solo dentro le RPC.

-- ---------------------------------------------------------------- RPC
-- Tutte security definer con search_path fissato.

create function public.create_group(p_name text, p_emoji text default null, p_color text default null)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_actor uuid := public.kimari_actor_id();
  v_group uuid;
begin
  if v_actor is null then
    raise exception 'serve un profilo: chiama prima ensure_actor';
  end if;
  if coalesce(btrim(p_name), '') = '' then
    raise exception 'il gruppo ha bisogno di un nome';
  end if;

  insert into public.groups (name, emoji, color, created_by)
  values (btrim(p_name), coalesce(nullif(btrim(p_emoji), ''), '👥'),
          coalesce(nullif(btrim(p_color), ''), '#007AFF'), v_actor)
  returning id into v_group;

  insert into public.group_members (group_id, actor_id, role)
  values (v_group, v_actor, 'admin');

  return v_group;
end;
$$;

create function public.update_group(p_group uuid, p_name text default null,
                                    p_emoji text default null, p_color text default null)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if not public.kimari_is_group_admin(p_group) then
    raise exception 'solo un admin del gruppo può modificarlo';
  end if;

  update public.groups
     set name  = coalesce(nullif(btrim(p_name), ''),  name),
         emoji = coalesce(nullif(btrim(p_emoji), ''), emoji),
         color = coalesce(nullif(btrim(p_color), ''), color)
   where id = p_group;
end;
$$;

-- Restituisce il token in chiaro. È l'unico momento in cui esiste: in tabella
-- ci va solo lo sha256.
create function public.create_group_invite(p_group uuid)
returns text
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_actor uuid := public.kimari_actor_id();
  v_token text;
begin
  if not public.kimari_is_group_admin(p_group) then
    raise exception 'solo un admin del gruppo può creare un invito';
  end if;

  -- 64 caratteri esadecimali da due UUID v4: ~244 bit di casualità.
  v_token := replace(gen_random_uuid()::text, '-', '') ||
             replace(gen_random_uuid()::text, '-', '');

  insert into public.group_invite_links (group_id, token_hash, created_by)
  values (p_group, encode(sha256(v_token::bytea), 'hex'), v_actor);

  return v_token;
end;
$$;

create function public.revoke_group_invites(p_group uuid)
returns integer
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_n integer;
begin
  if not public.kimari_is_group_admin(p_group) then
    raise exception 'solo un admin del gruppo può revocare gli inviti';
  end if;

  update public.group_invite_links
     set revoked_at = now()
   where group_id = p_group and revoked_at is null;

  get diagnostics v_n = row_count;
  return v_n;
end;
$$;

-- Chiamabile anche da anonimo: è la pagina che si apre col link, prima di entrare.
-- Espone i nomi dei membri, come già fa preview_invite per i piani.
create function public.preview_group_invite(p_token text)
returns json
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_group uuid;
  v_row   public.groups%rowtype;
begin
  select l.group_id into v_group
    from public.group_invite_links l
   where l.token_hash = encode(sha256(p_token::bytea), 'hex')
     and l.revoked_at is null;

  if v_group is null then
    return json_build_object('ok', false);
  end if;

  select * into v_row from public.groups where id = v_group;

  return json_build_object(
    'ok', true,
    'group_id', v_row.id,
    'name',  v_row.name,
    'emoji', v_row.emoji,
    'color', v_row.color,
    'members', (
      select coalesce(json_agg(json_build_object('actor_id', a.id, 'name', a.display_name)
                               order by gm.joined_at), '[]'::json)
        from public.group_members gm
        join public.actors a on a.id = gm.actor_id
       where gm.group_id = v_group
    )
  );
end;
$$;

create function public.join_group(p_token text, p_display_name text default null)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_group uuid;
  v_actor uuid;
begin
  select l.group_id into v_group
    from public.group_invite_links l
   where l.token_hash = encode(sha256(p_token::bytea), 'hex')
     and l.revoked_at is null;

  if v_group is null then
    raise exception 'invito non valido o revocato';
  end if;

  v_actor := public.kimari_actor_id();
  if v_actor is null then
    -- ensure_actor conosce i vincoli di actors: meglio delegare che indovinare.
    perform public.ensure_actor(
      p_display_name := coalesce(nullif(btrim(p_display_name), ''), 'Ospite'));
    v_actor := public.kimari_actor_id();
  end if;
  if v_actor is null then
    raise exception 'non sono riuscito a creare il profilo';
  end if;

  insert into public.group_members (group_id, actor_id, role)
  values (v_group, v_actor, 'member')
  on conflict (group_id, actor_id) do nothing;

  -- Chi entra nel gruppo entra anche nei piani ancora ai voti, come nel
  -- prototipo (addMemberToGroup). Solo 'deciding': un piano già confermato non
  -- si tocca, cambiargli i partecipanti a posteriori falserebbe i conteggi.
  insert into public.participants (plan_id, actor_id, role)
  select p.id, v_actor, 'member'
    from public.plans p
   where p.group_id = v_group
     and p.status = 'deciding'
     and not exists (
       select 1 from public.participants pa
        where pa.plan_id = p.id and pa.actor_id = v_actor
     );

  return v_group;
end;
$$;

create function public.set_group_admin(p_group uuid, p_actor uuid, p_admin boolean)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_admins integer;
begin
  if not public.kimari_is_group_admin(p_group) then
    raise exception 'solo un admin del gruppo può cambiare i ruoli';
  end if;

  if not p_admin then
    select count(*) into v_admins
      from public.group_members
     where group_id = p_group and role = 'admin';
    if v_admins <= 1 then
      raise exception 'il gruppo resterebbe senza admin: nominane un altro prima';
    end if;
  end if;

  update public.group_members
     set role = case when p_admin then 'admin' else 'member' end
   where group_id = p_group and actor_id = p_actor;
end;
$$;

create function public.remove_group_member(p_group uuid, p_actor uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_admins integer;
begin
  if not public.kimari_is_group_admin(p_group) then
    raise exception 'solo un admin del gruppo può togliere qualcuno';
  end if;
  if p_actor = public.kimari_actor_id() then
    raise exception 'per uscire tu usa leave_group';
  end if;

  select count(*) into v_admins
    from public.group_members
   where group_id = p_group and role = 'admin';

  if v_admins <= 1 and exists (
    select 1 from public.group_members
     where group_id = p_group and actor_id = p_actor and role = 'admin'
  ) then
    raise exception 'è l''ultimo admin: nominane un altro prima';
  end if;

  delete from public.group_members where group_id = p_group and actor_id = p_actor;
  delete from public.group_sections where group_id = p_group and actor_id = p_actor;
end;
$$;

create function public.leave_group(p_group uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_actor  uuid := public.kimari_actor_id();
  v_admins integer;
begin
  if v_actor is null or not public.kimari_is_group_member(p_group) then
    raise exception 'non sei in questo gruppo';
  end if;

  select count(*) into v_admins
    from public.group_members
   where group_id = p_group and role = 'admin';

  if v_admins <= 1 and public.kimari_is_group_admin(p_group) then
    raise exception 'sei l''ultimo admin: nominane un altro prima di uscire';
  end if;

  delete from public.group_members where group_id = p_group and actor_id = v_actor;
  delete from public.group_sections where group_id = p_group and actor_id = v_actor;
end;
$$;

-- ------------------------------------------------- sezioni (private)
create function public.create_section(p_name text)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_actor uuid := public.kimari_actor_id();
  v_id    uuid;
begin
  if v_actor is null then
    raise exception 'serve un profilo';
  end if;
  if coalesce(btrim(p_name), '') = '' then
    raise exception 'la sezione ha bisogno di un nome';
  end if;

  insert into public.sections (actor_id, name, position)
  values (v_actor, btrim(p_name),
          coalesce((select max(position) + 1 from public.sections where actor_id = v_actor), 0))
  returning id into v_id;

  return v_id;
end;
$$;

create function public.rename_section(p_section uuid, p_name text)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if coalesce(btrim(p_name), '') = '' then
    raise exception 'la sezione ha bisogno di un nome';
  end if;

  update public.sections
     set name = btrim(p_name)
   where id = p_section and actor_id = public.kimari_actor_id();

  if not found then
    raise exception 'sezione non trovata';
  end if;
end;
$$;

create function public.delete_section(p_section uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  delete from public.sections
   where id = p_section and actor_id = public.kimari_actor_id();

  if not found then
    raise exception 'sezione non trovata';
  end if;
end;
$$;

-- p_section null = togli il gruppo da ogni sezione.
create function public.set_group_section(p_group uuid, p_section uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_actor uuid := public.kimari_actor_id();
begin
  if v_actor is null or not public.kimari_is_group_member(p_group) then
    raise exception 'non sei in questo gruppo';
  end if;

  if p_section is null then
    delete from public.group_sections where actor_id = v_actor and group_id = p_group;
    return;
  end if;

  if not exists (select 1 from public.sections
                  where id = p_section and actor_id = v_actor) then
    raise exception 'sezione non tua';
  end if;

  insert into public.group_sections (actor_id, group_id, section_id)
  values (v_actor, p_group, p_section)
  on conflict (actor_id, group_id) do update set section_id = excluded.section_id;
end;
$$;

-- ---------------------------------------------------------------- permessi
-- Di default Postgres dà EXECUTE a public su ogni funzione nuova: si toglie e
-- si concede solo a chi serve. Gli helper restano interni alle policy.

revoke execute on function
  public.kimari_actor_id(),
  public.kimari_is_group_member(uuid),
  public.kimari_is_group_admin(uuid),
  public.create_group(text, text, text),
  public.update_group(uuid, text, text, text),
  public.create_group_invite(uuid),
  public.revoke_group_invites(uuid),
  public.preview_group_invite(text),
  public.join_group(text, text),
  public.set_group_admin(uuid, uuid, boolean),
  public.remove_group_member(uuid, uuid),
  public.leave_group(uuid),
  public.create_section(text),
  public.rename_section(uuid, text),
  public.delete_section(uuid),
  public.set_group_section(uuid, uuid)
from public;

grant execute on function
  public.create_group(text, text, text),
  public.update_group(uuid, text, text, text),
  public.create_group_invite(uuid),
  public.revoke_group_invites(uuid),
  public.join_group(text, text),
  public.set_group_admin(uuid, uuid, boolean),
  public.remove_group_member(uuid, uuid),
  public.leave_group(uuid),
  public.create_section(text),
  public.rename_section(uuid, text),
  public.delete_section(uuid),
  public.set_group_section(uuid, uuid)
to authenticated;

-- Aprire il link d'invito deve funzionare prima di autenticarsi, come per i piani.
grant execute on function public.preview_group_invite(text) to anon, authenticated;

grant select on public.groups, public.group_members,
                public.sections, public.group_sections
to anon, authenticated;

commit;
