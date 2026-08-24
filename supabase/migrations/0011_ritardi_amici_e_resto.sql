-- 0011_ritardi_amici_e_resto.sql — le cose che il prototipo promette e il
-- database non sapeva ancora fare.
--
--   1. ritardi e assenze   — "arrivo alle 21:15", "non ce la faccio più"
--   2. amici               — per invitare senza riscrivere i nomi
--   3. gruppi silenziati   — privato, non lo vede il gruppo
--   4. "ho prenotato"      — chi prenota decide sulle proposte
--   5. cancellare un commento
--   6. sciogliere un gruppo, e passare le chiavi a qualcun altro
--   7. foto e link sui posti salvati
--
-- Il ritardo è la più usata di tutte in un piano vero: qualcuno arriva tardi
-- praticamente sempre, ed è il momento in cui serve dirlo a tutti in fretta.

begin;

do $$
begin
  if to_regclass('public.places') is null then
    raise exception 'applica prima 0006_media_expenses_places.sql';
  end if;
  if exists (
    select 1 from information_schema.columns
     where table_schema = 'public' and table_name = 'participants'
       and column_name = 'late_minutes'
  ) then
    raise exception '0011 è già applicata: participants.late_minutes esiste.';
  end if;
end $$;

-- ------------------------------------------------- 1. ritardi e assenze
-- Minuti, non un orario: "20 minuti di ritardo" resta vero anche se il piano
-- viene spostato, un orario fisso no.
alter table public.participants add column late_minutes integer
  check (late_minutes is null or (late_minutes > 0 and late_minutes <= 600));
alter table public.participants add column late_note text
  check (late_note is null or length(late_note) <= 140);
alter table public.participants add column late_at timestamptz;
-- set_rsvp di 0001 non registra QUANDO si è risposto: da qui in poi sì.
alter table public.participants add column rsvp_at timestamptz;

-- ------------------------------------------------- 4. prenotato
alter table public.plans add column booked boolean not null default false;

-- ------------------------------------------------- 2. amici
-- Non simmetrica di proposito: è una rubrica personale, non una richiesta di
-- amicizia da accettare. Nessuno riceve notifiche perché l'hai aggiunto.
create table public.friendships (
  actor_id   uuid        not null references public.actors(id) on delete cascade,
  friend_id  uuid        not null references public.actors(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (actor_id, friend_id),
  check (actor_id <> friend_id)
);

-- ------------------------------------------------- 3. silenziati
create table public.mutes (
  actor_id  uuid not null references public.actors(id) on delete cascade,
  group_id  uuid not null references public.groups(id) on delete cascade,
  muted_at  timestamptz not null default now(),
  primary key (actor_id, group_id)
);

-- ------------------------------------------------- 7. media dei posti
create table public.place_media (
  id          uuid        primary key default gen_random_uuid(),
  place_id    uuid        not null references public.places(id) on delete cascade,
  kind        text        not null check (kind in ('photo', 'link')),
  path        text,                       -- foto: percorso nel bucket
  url         text,                       -- link: l'indirizzo
  name        text        not null check (length(btrim(name)) between 1 and 200),
  size_bytes  bigint      not null default 0,
  is_cover    boolean     not null default false,
  created_at  timestamptz not null default now(),
  check ((kind = 'photo' and path is not null) or (kind = 'link' and url is not null))
);

create index place_media_place_idx on public.place_media (place_id);

-- ---------------------------------------------------------------- RLS
alter table public.friendships enable row level security;
alter table public.mutes       enable row level security;
alter table public.place_media enable row level security;

-- Amici e silenziati sono affari propri: non li vede nemmeno l'interessato.
create policy friendships_read on public.friendships
  for select using (actor_id = public.kimari_actor_id());

create policy mutes_read on public.mutes
  for select using (actor_id = public.kimari_actor_id());

create policy place_media_read on public.place_media
  for select using (exists (
    select 1 from public.places pl
     where pl.id = place_id and pl.actor_id = public.kimari_actor_id()
  ));

-- ---------------------------------------------------------------- RPC

-- Dire "arrivo tardi" implica che vieni: se avevi risposto forse, diventa sì.
create function public.set_my_late(p_plan uuid, p_minutes integer, p_note text default null)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_actor uuid := public.kimari_actor_id();
begin
  if v_actor is null or not public.kimari_is_participant(p_plan) then
    raise exception 'non partecipi a questo piano';
  end if;
  if p_minutes is null or p_minutes <= 0 or p_minutes > 600 then
    raise exception 'il ritardo va da 1 a 600 minuti';
  end if;

  update public.participants
     set late_minutes = p_minutes,
         late_note    = nullif(btrim(p_note), ''),
         late_at      = now(),
         rsvp         = case when rsvp is distinct from 'yes' then 'yes'::rsvp_status else rsvp end,
         rsvp_at      = case when rsvp is distinct from 'yes' then now() else rsvp_at end
   where plan_id = p_plan and actor_id = v_actor;
end;
$$;

create function public.clear_my_late(p_plan uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  update public.participants
     set late_minutes = null, late_note = null, late_at = null
   where plan_id = p_plan and actor_id = public.kimari_actor_id();
  if not found then
    raise exception 'non partecipi a questo piano';
  end if;
end;
$$;

-- Non venire più cancella il ritardo: le due cose insieme non stanno.
create function public.set_my_absence(p_plan uuid, p_note text default null)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_actor uuid := public.kimari_actor_id();
begin
  if v_actor is null or not public.kimari_is_participant(p_plan) then
    raise exception 'non partecipi a questo piano';
  end if;

  update public.participants
     set rsvp = 'no'::rsvp_status, rsvp_at = now(),
         late_minutes = null, late_note = null, late_at = null
   where plan_id = p_plan and actor_id = v_actor;

  if coalesce(btrim(p_note), '') <> '' then
    insert into public.comments (plan_id, actor_id, body, is_system, kind)
    values (p_plan, v_actor, btrim(p_note), true, 'absent');
  end if;
end;
$$;

create function public.set_plan_booked(p_plan uuid, p_booked boolean)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if not public.kimari_is_participant(p_plan) then
    raise exception 'non partecipi a questo piano';
  end if;
  update public.plans set booked = coalesce(p_booked, false) where id = p_plan;
end;
$$;

-- ------------------------------------------------- amici e silenziati
create function public.add_friend(p_actor uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_actor uuid := public.kimari_actor_id();
begin
  if v_actor is null then raise exception 'serve un profilo'; end if;
  if p_actor = v_actor then raise exception 'non puoi aggiungere te stesso'; end if;
  -- Solo gente con cui hai davvero condiviso qualcosa: la rubrica non è un
  -- modo per rastrellare nomi dal database.
  if not exists (
    select 1 from public.participants a
      join public.participants b on b.plan_id = a.plan_id
     where a.actor_id = v_actor and b.actor_id = p_actor
  ) and not exists (
    select 1 from public.group_members a
      join public.group_members b on b.group_id = a.group_id
     where a.actor_id = v_actor and b.actor_id = p_actor
  ) then
    raise exception 'potete diventare amici solo dopo aver condiviso un piano o un gruppo';
  end if;

  insert into public.friendships (actor_id, friend_id)
  values (v_actor, p_actor) on conflict do nothing;
end;
$$;

create function public.remove_friend(p_actor uuid)
returns void
language sql
security definer
set search_path = public, pg_temp
as $$
  delete from public.friendships
   where actor_id = public.kimari_actor_id() and friend_id = p_actor;
$$;

-- Torna il nuovo stato, così il client non deve indovinarlo.
create function public.toggle_group_mute(p_group uuid)
returns boolean
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

  if exists (select 1 from public.mutes where actor_id = v_actor and group_id = p_group) then
    delete from public.mutes where actor_id = v_actor and group_id = p_group;
    return false;
  end if;
  insert into public.mutes (actor_id, group_id) values (v_actor, p_group);
  return true;
end;
$$;

-- ------------------------------------------------- commenti e gruppi
create function public.delete_comment(p_comment uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_actor uuid := public.kimari_actor_id();
  v_plan  uuid;
  v_by    uuid;
  v_sys   boolean;
begin
  select plan_id, actor_id, is_system into v_plan, v_by, v_sys
    from public.comments where id = p_comment;
  if v_plan is null then raise exception 'commento non trovato'; end if;
  if v_sys then
    raise exception 'i messaggi di sistema raccontano la storia del piano: non si tolgono';
  end if;
  if v_by is distinct from v_actor and not public.kimari_is_organizer(v_plan) then
    raise exception 'puoi togliere solo i tuoi commenti';
  end if;

  delete from public.comments where id = p_comment;
end;
$$;

-- DIVERSO DAL PROTOTIPO, di proposito. Lì sciogliere un gruppo cancella anche
-- i suoi piani. Ma quei piani contengono i voti, i commenti e le spese di
-- altre persone: un admin non deve poter far sparire la storia di tutti con un
-- bottone. Qui i piani restano — quelli ancora ai voti vengono annullati,
-- quelli confermati restano leggibili — e perdono solo il legame col gruppo.
create function public.delete_group(p_group uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if not public.kimari_is_group_admin(p_group) then
    raise exception 'solo un admin può sciogliere il gruppo';
  end if;

  update public.plans set status = 'cancelled'
   where group_id = p_group and status = 'deciding';
  update public.plans set group_id = null where group_id = p_group;

  delete from public.groups where id = p_group;   -- membri, inviti e sezioni a cascata
end;
$$;

create function public.transfer_group_owner(p_group uuid, p_actor uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if not public.kimari_is_group_admin(p_group) then
    raise exception 'solo un admin può passare le chiavi';
  end if;
  if not exists (select 1 from public.group_members
                  where group_id = p_group and actor_id = p_actor) then
    raise exception 'quella persona non è nel gruppo';
  end if;

  update public.group_members set role = 'admin'
   where group_id = p_group and actor_id = p_actor;
  update public.groups set created_by = p_actor where id = p_group;
end;
$$;

-- ------------------------------------------------- media dei posti
create function public.add_place_media(p_place uuid, p_kind text, p_name text,
                                       p_path text default null, p_url text default null,
                                       p_size bigint default 0)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_actor uuid := public.kimari_actor_id();
  v_id    uuid;
  v_n     integer;
begin
  if not exists (select 1 from public.places
                  where id = p_place and actor_id = v_actor) then
    raise exception 'posto non tuo';
  end if;
  if p_kind not in ('photo', 'link') then raise exception 'tipo non valido'; end if;

  select count(*) into v_n from public.place_media
   where place_id = p_place and kind = 'photo';
  if p_kind = 'photo' and v_n >= 5 then
    raise exception 'massimo 5 foto per posto';
  end if;

  insert into public.place_media (place_id, kind, path, url, name, size_bytes)
  values (p_place, p_kind, p_path, p_url, btrim(p_name), coalesce(p_size, 0))
  returning id into v_id;

  return v_id;
end;
$$;

create function public.delete_place_media(p_media uuid)
returns text
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare v_row public.place_media%rowtype;
begin
  select pm.* into v_row from public.place_media pm
    join public.places pl on pl.id = pm.place_id
   where pm.id = p_media and pl.actor_id = public.kimari_actor_id();
  if v_row.id is null then raise exception 'non trovato'; end if;

  delete from public.place_media where id = p_media;
  return v_row.path;
end;
$$;

create function public.set_place_cover(p_media uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare v_place uuid;
begin
  select pm.place_id into v_place from public.place_media pm
    join public.places pl on pl.id = pm.place_id
   where pm.id = p_media and pl.actor_id = public.kimari_actor_id();
  if v_place is null then raise exception 'non trovato'; end if;

  update public.place_media set is_cover = (id = p_media) where place_id = v_place;
end;
$$;

-- --------------------------------------------------- cancellazione account
-- La regola di 0005: ogni tabella nuova con FK verso actors va gestita qui.
do $$
begin
  if not exists (
    select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public' and p.proname = 'delete_my_account'
  ) then
    raise notice 'delete_my_account() non trovata: applica 0004.';
    return;
  end if;

  execute $fn$
    create or replace function public.delete_my_account()
    returns void
    language plpgsql
    security definer
    set search_path = public, pg_temp
    as $body$
    declare
      v_uid   uuid := auth.uid();
      v_actor uuid;
    begin
      if v_uid is null then raise exception 'non sei autenticato'; end if;
      select a.id into v_actor from public.actors a where a.auth_user_id = v_uid;

      if v_actor is not null then
        update public.plans set status = 'cancelled'
         where organizer_id = v_actor and status = 'deciding';

        delete from public.group_sections  where actor_id = v_actor;
        delete from public.sections        where actor_id = v_actor;
        delete from public.group_members   where actor_id = v_actor;
        delete from public.approvals       where actor_id = v_actor;
        delete from public.ballots         where actor_id = v_actor;
        delete from public.participants    where actor_id = v_actor;
        delete from public.extra_approvals where actor_id = v_actor;
        delete from public.proposal_votes  where actor_id = v_actor;
        delete from public.comments        where actor_id = v_actor and not is_system;
        delete from public.places          where actor_id = v_actor;   -- media a cascata
        delete from public.entitlements    where actor_id = v_actor;
        -- aggiunte da 0011: la rubrica e i silenziati sono solo suoi, e va
        -- tolto anche da quelle altrui — è dato personale in entrambi i versi.
        delete from public.friendships     where actor_id = v_actor or friend_id = v_actor;
        delete from public.mutes           where actor_id = v_actor;
        -- expense_shares NON si tocca: ridividerebbe i conti degli altri.

        update public.actors
           set display_name = 'Account eliminato', auth_user_id = null
         where id = v_actor;

        if exists (
          select 1 from information_schema.columns
           where table_schema = 'public' and table_name = 'actors'
             and column_name = 'email'
        ) then
          execute 'update public.actors set email = null where id = $1' using v_actor;
        end if;
      end if;

      delete from auth.users where id = v_uid;
    end;
    $body$;
  $fn$;

  revoke execute on function public.delete_my_account() from public;
  grant  execute on function public.delete_my_account() to authenticated;
end $$;

-- ---------------------------------------------------------------- permessi
revoke execute on function
  public.set_my_late(uuid, integer, text),
  public.clear_my_late(uuid),
  public.set_my_absence(uuid, text),
  public.set_plan_booked(uuid, boolean),
  public.add_friend(uuid),
  public.remove_friend(uuid),
  public.toggle_group_mute(uuid),
  public.delete_comment(uuid),
  public.delete_group(uuid),
  public.transfer_group_owner(uuid, uuid),
  public.add_place_media(uuid, text, text, text, text, bigint),
  public.delete_place_media(uuid),
  public.set_place_cover(uuid)
from public;

grant execute on function
  public.set_my_late(uuid, integer, text),
  public.clear_my_late(uuid),
  public.set_my_absence(uuid, text),
  public.set_plan_booked(uuid, boolean),
  public.add_friend(uuid),
  public.remove_friend(uuid),
  public.toggle_group_mute(uuid),
  public.delete_comment(uuid),
  public.delete_group(uuid),
  public.transfer_group_owner(uuid, uuid),
  public.add_place_media(uuid, text, text, text, text, bigint),
  public.delete_place_media(uuid),
  public.set_place_cover(uuid)
to authenticated;

grant select on public.friendships, public.mutes, public.place_media to authenticated;

commit;
