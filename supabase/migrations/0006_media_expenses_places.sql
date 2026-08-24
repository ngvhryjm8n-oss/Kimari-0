-- 0006_media_expenses_places.sql — Fase 3 del PIANO_V1.
--
--   1. foto e file allegati al piano (Supabase Storage)
--   2. spese, saldi e rimborsi
--   3. posti salvati (privati, per persona)
--
-- Sui SOLDI, due regole che non si toccano:
--   - importi in CENTESIMI INTERI, mai float. 0.1 + 0.2 <> 0.3 e su una
--     divisione fra amici si vede.
--   - il resto della divisione va distribuito, non buttato: 10,00 € fra 3
--     fanno 3,34 + 3,33 + 3,33, e la somma torna esatta. È lo stesso
--     algoritmo di balances() nel prototipo, portato in SQL.
--
-- Sullo STORAGE: il free tier di Supabase è 1 GB. Con 20 foto a piano si
-- consuma in fretta, quindi i limiti sono applicati lato server, non solo
-- nella UI. Si allargano per persona con la tabella entitlements.

begin;

-- ---------------------------------------------------------------- preflight
do $$
begin
  if to_regclass('public.plans') is null or to_regclass('public.actors') is null then
    raise exception 'schema inatteso: mancano plans/actors';
  end if;
  if to_regclass('public.expenses') is not null then
    raise exception 'public.expenses esiste già: 0006 sembra già applicata';
  end if;
  if to_regclass('public.plan_extras') is null then
    raise exception 'applica prima 0005_extras_comments_proposals.sql';
  end if;
  if not exists (
    select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public' and p.proname = 'kimari_is_participant'
  ) then
    raise exception 'kimari_is_participant() non trovata: viene da 0005';
  end if;
  if to_regclass('storage.objects') is null then
    raise exception 'schema storage non trovato: attiva Storage sul progetto prima di applicare';
  end if;
end $$;

-- ---------------------------------------------------------------- limiti
create table public.entitlements (
  actor_id   uuid        primary key references public.actors(id) on delete cascade,
  unlimited  boolean     not null default false,
  source     text,           -- 'stripe', 'regalo', 'beta'…
  granted_at timestamptz not null default now()
);

alter table public.entitlements enable row level security;

create policy entitlements_read on public.entitlements
  for select using (actor_id = public.kimari_actor_id());

-- Tenuti in una funzione sola: la UI e il server devono dire la stessa cosa.
create function public.kimari_limits(p_actor uuid)
returns table (max_photos integer, max_plan_bytes bigint,
               max_file_bytes bigint, max_places integer)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select case when e.unlimited then 100     else 20       end,
         case when e.unlimited then 100000000 else 25000000 end::bigint,
         case when e.unlimited then 25000000  else 10000000 end::bigint,
         case when e.unlimited then 1000000 else 10       end
    from (select coalesce(
            (select unlimited from public.entitlements where actor_id = p_actor),
            false) as unlimited) e;
$$;

-- ---------------------------------------------------------------- media
create table public.media (
  id          uuid        primary key default gen_random_uuid(),
  plan_id     uuid        not null references public.plans(id)  on delete cascade,
  actor_id    uuid        references public.actors(id)          on delete set null,
  kind        text        not null check (kind in ('photo', 'file')),
  -- percorso dentro il bucket 'kimari': plans/<plan_id>/<uuid>
  path        text        not null unique,
  name        text        not null check (length(btrim(name)) between 1 and 200),
  size_bytes  bigint      not null check (size_bytes >= 0),
  created_at  timestamptz not null default now()
);

create index media_plan_idx on public.media (plan_id, created_at);

alter table public.media enable row level security;

create policy media_read on public.media
  for select using (public.kimari_is_participant(plan_id));

-- ---------------------------------------------------------------- spese
create table public.expenses (
  id           uuid        primary key default gen_random_uuid(),
  plan_id      uuid        not null references public.plans(id)  on delete cascade,
  paid_by      uuid        not null references public.actors(id) on delete cascade,
  amount_cents bigint      not null check (amount_cents > 0),
  description  text        not null check (length(btrim(description)) between 1 and 120),
  created_at   timestamptz not null default now(),
  voided_at    timestamptz,
  voided_by    uuid        references public.actors(id) on delete set null
);

create index expenses_plan_idx on public.expenses (plan_id) where voided_at is null;

-- Fra chi si divide. Riga per riga invece che un array: così si può fare join,
-- contare, e la FK protegge da id inventati.
create table public.expense_shares (
  expense_id uuid not null references public.expenses(id) on delete cascade,
  actor_id   uuid not null references public.actors(id)   on delete cascade,
  primary key (expense_id, actor_id)
);

-- Rimborsi: "ti ho ridato i soldi".
create table public.settlements (
  id           uuid        primary key default gen_random_uuid(),
  plan_id      uuid        not null references public.plans(id)  on delete cascade,
  from_actor   uuid        not null references public.actors(id) on delete cascade,
  to_actor     uuid        not null references public.actors(id) on delete cascade,
  amount_cents bigint      not null check (amount_cents > 0),
  created_at   timestamptz not null default now(),
  check (from_actor <> to_actor)
);

create index settlements_plan_idx on public.settlements (plan_id);

alter table public.expenses       enable row level security;
alter table public.expense_shares enable row level security;
alter table public.settlements    enable row level security;

create policy expenses_read on public.expenses
  for select using (public.kimari_is_participant(plan_id));

create policy expense_shares_read on public.expense_shares
  for select using (exists (
    select 1 from public.expenses e
     where e.id = expense_id and public.kimari_is_participant(e.plan_id)
  ));

create policy settlements_read on public.settlements
  for select using (public.kimari_is_participant(plan_id));

-- ------------------------------------------------- saldi
-- Positivo = gli devono dei soldi. Negativo = ne deve.
-- Il resto della divisione va ai primi in ordine di actor_id: arbitrario ma
-- DETERMINISTICO, così il saldo non cambia da una lettura all'altra.
create function public.plan_balances(p_plan uuid)
returns table (actor_id uuid, balance_cents bigint)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  with quote as (
    select es.expense_id,
           es.actor_id,
           e.paid_by,
           e.amount_cents,
           count(*)      over (partition by es.expense_id) as n,
           row_number()  over (partition by es.expense_id order by es.actor_id) as rn
      from public.expense_shares es
      join public.expenses e on e.id = es.expense_id
     where e.plan_id = p_plan
       and e.voided_at is null
  ),
  dovuto as (
    -- quota base + 1 centesimo ai primi (amount % n)
    select actor_id,
           sum(amount_cents / n + case when rn <= amount_cents % n then 1 else 0 end) as cents
      from quote group by actor_id
  ),
  pagato as (
    select paid_by as actor_id, sum(amount_cents) as cents
      from public.expenses
     where plan_id = p_plan and voided_at is null
     group by paid_by
  ),
  reso as (
    select from_actor as actor_id, sum(amount_cents) as cents
      from public.settlements where plan_id = p_plan group by from_actor
  ),
  ricevuto as (
    select to_actor as actor_id, sum(amount_cents) as cents
      from public.settlements where plan_id = p_plan group by to_actor
  ),
  -- NON solo i partecipanti di adesso: chi ha lasciato il piano o ha
  -- cancellato l'account resta nei conti finché il suo saldo non è zero.
  -- Altrimenti i soldi che deve sparirebbero dal riepilogo e la somma dei
  -- saldi non farebbe più zero.
  attori as (
    select actor_id from public.participants where plan_id = p_plan
    union
    select paid_by from public.expenses where plan_id = p_plan and voided_at is null
    union
    select es.actor_id from public.expense_shares es
      join public.expenses e on e.id = es.expense_id
     where e.plan_id = p_plan and e.voided_at is null
    union
    select from_actor from public.settlements where plan_id = p_plan
    union
    select to_actor   from public.settlements where plan_id = p_plan
  )
  select p.actor_id,
         ( coalesce((select cents from pagato   where actor_id = p.actor_id), 0)
         - coalesce((select cents from dovuto   where actor_id = p.actor_id), 0)
         + coalesce((select cents from reso     where actor_id = p.actor_id), 0)
         - coalesce((select cents from ricevuto where actor_id = p.actor_id), 0)
         )::bigint
    from attori p
   where public.kimari_is_participant(p_plan);
$$;

-- ---------------------------------------------------------------- posti
create table public.places (
  id          uuid        primary key default gen_random_uuid(),
  actor_id    uuid        not null references public.actors(id) on delete cascade,
  name        text        not null check (length(btrim(name)) between 1 and 80),
  address     text,
  note        text        check (note is null or length(note) <= 300),
  used_count  integer     not null default 0,
  created_at  timestamptz not null default now(),
  unique (actor_id, name)
);

create index places_actor_idx on public.places (actor_id, used_count desc);

alter table public.places enable row level security;

create policy places_read on public.places
  for select using (actor_id = public.kimari_actor_id());

-- ---------------------------------------------------------------- storage
insert into storage.buckets (id, name, public, file_size_limit)
values ('kimari', 'kimari', false, 26214400)
on conflict (id) do nothing;

-- Il piano è la seconda cartella del percorso: plans/<plan_id>/<file>
create function public.kimari_path_plan(p_name text)
returns uuid
language plpgsql
immutable
as $$
begin
  return (storage.foldername(p_name))[2]::uuid;
exception when others then
  return null;
end;
$$;

create policy kimari_objects_read on storage.objects
  for select to authenticated
  using (bucket_id = 'kimari'
         and public.kimari_is_participant(public.kimari_path_plan(name)));

create policy kimari_objects_insert on storage.objects
  for insert to authenticated
  with check (bucket_id = 'kimari'
              and public.kimari_is_participant(public.kimari_path_plan(name)));

-- Cancella solo chi ha caricato, oppure chi organizza il piano.
create policy kimari_objects_delete on storage.objects
  for delete to authenticated
  using (bucket_id = 'kimari'
         and (owner = auth.uid()
              or public.kimari_is_organizer(public.kimari_path_plan(name))));

-- ---------------------------------------------------------------- RPC
-- Si chiama DOPO aver caricato il file nello Storage: registra la riga e fa
-- rispettare i limiti. Se rifiuta, il file caricato va rimosso dal client.
create function public.register_media(p_plan uuid, p_path text, p_kind text,
                                      p_name text, p_size bigint)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_actor uuid := public.kimari_actor_id();
  v_lim   record;
  v_org   uuid;
  v_n     integer;
  v_bytes bigint;
  v_id    uuid;
begin
  if v_actor is null or not public.kimari_is_participant(p_plan) then
    raise exception 'non partecipi a questo piano';
  end if;
  if p_kind not in ('photo', 'file') then
    raise exception 'tipo non valido';
  end if;
  if p_size is null or p_size < 0 then
    raise exception 'dimensione non valida';
  end if;

  -- I limiti sono quelli di chi ORGANIZZA: è il suo piano che occupa spazio.
  select organizer_id into v_org from public.plans where id = p_plan;
  select * into v_lim from public.kimari_limits(v_org);

  if p_size > v_lim.max_file_bytes then
    raise exception 'file troppo grande: massimo % MB', v_lim.max_file_bytes / 1000000;
  end if;

  select count(*), coalesce(sum(size_bytes), 0) into v_n, v_bytes
    from public.media where plan_id = p_plan;

  if v_bytes + p_size > v_lim.max_plan_bytes then
    raise exception 'il piano ha finito lo spazio: massimo % MB in tutto', v_lim.max_plan_bytes / 1000000;
  end if;

  if p_kind = 'photo' then
    select count(*) into v_n from public.media where plan_id = p_plan and kind = 'photo';
    if v_n >= v_lim.max_photos then
      raise exception 'massimo % foto per piano', v_lim.max_photos;
    end if;
  end if;

  insert into public.media (plan_id, actor_id, kind, path, name, size_bytes)
  values (p_plan, v_actor, p_kind, p_path, btrim(p_name), p_size)
  returning id into v_id;

  return v_id;
end;
$$;

create function public.delete_media(p_media uuid)
returns text
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_actor uuid := public.kimari_actor_id();
  v_row   public.media%rowtype;
begin
  select * into v_row from public.media where id = p_media;
  if v_row.id is null then
    raise exception 'file non trovato';
  end if;
  if v_row.actor_id is distinct from v_actor
     and not public.kimari_is_organizer(v_row.plan_id) then
    raise exception 'puoi togliere solo quello che hai caricato tu';
  end if;

  delete from public.media where id = p_media;
  -- Il file nello Storage lo cancella il client con questo percorso.
  return v_row.path;
end;
$$;

-- p_among vuoto = si divide fra tutti i partecipanti.
create function public.add_expense(p_plan uuid, p_amount_cents bigint,
                                   p_description text, p_among uuid[] default null)
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
  if v_actor is null or not public.kimari_is_participant(p_plan) then
    raise exception 'non partecipi a questo piano';
  end if;
  if p_amount_cents is null or p_amount_cents <= 0 then
    raise exception 'l''importo deve essere maggiore di zero';
  end if;
  if coalesce(btrim(p_description), '') = '' then
    raise exception 'scrivi cos''era la spesa';
  end if;

  insert into public.expenses (plan_id, paid_by, amount_cents, description)
  values (p_plan, v_actor, p_amount_cents, btrim(p_description))
  returning id into v_id;

  -- Solo partecipanti veri: un id estraneo viene semplicemente ignorato.
  insert into public.expense_shares (expense_id, actor_id)
  select v_id, pa.actor_id
    from public.participants pa
   where pa.plan_id = p_plan
     and (p_among is null or array_length(p_among, 1) is null
          or pa.actor_id = any(p_among));

  get diagnostics v_n = row_count;
  if v_n = 0 then
    raise exception 'nessuno con cui dividere: controlla i nomi';
  end if;

  return v_id;
end;
$$;

-- Non si cancella: si annulla. Così resta traccia di chi e quando.
create function public.void_expense(p_expense uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_actor uuid := public.kimari_actor_id();
  v_plan  uuid;
  v_payer uuid;
begin
  select plan_id, paid_by into v_plan, v_payer from public.expenses where id = p_expense;
  if v_plan is null then
    raise exception 'spesa non trovata';
  end if;
  if v_payer is distinct from v_actor and not public.kimari_is_organizer(v_plan) then
    raise exception 'puoi annullare solo le spese che hai messo tu';
  end if;

  update public.expenses
     set voided_at = now(), voided_by = v_actor
   where id = p_expense and voided_at is null;

  if not found then
    raise exception 'questa spesa è già annullata';
  end if;
end;
$$;

create function public.add_settlement(p_plan uuid, p_to uuid, p_amount_cents bigint)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_actor uuid := public.kimari_actor_id();
  v_id    uuid;
begin
  if v_actor is null or not public.kimari_is_participant(p_plan) then
    raise exception 'non partecipi a questo piano';
  end if;
  if p_to = v_actor then
    raise exception 'non puoi rimborsare te stesso';
  end if;
  if p_amount_cents is null or p_amount_cents <= 0 then
    raise exception 'l''importo deve essere maggiore di zero';
  end if;
  if not exists (select 1 from public.participants
                  where plan_id = p_plan and actor_id = p_to) then
    raise exception 'quella persona non partecipa al piano';
  end if;

  -- Lo registra chi PAGA: nessuno può dichiarare di essere stato pagato.
  insert into public.settlements (plan_id, from_actor, to_actor, amount_cents)
  values (p_plan, v_actor, p_to, p_amount_cents)
  returning id into v_id;

  return v_id;
end;
$$;

create function public.save_place(p_name text, p_address text default null,
                                  p_note text default null)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_actor uuid := public.kimari_actor_id();
  v_lim   record;
  v_n     integer;
  v_id    uuid;
begin
  if v_actor is null then
    raise exception 'serve un profilo';
  end if;
  if coalesce(btrim(p_name), '') = '' then
    raise exception 'il posto ha bisogno di un nome';
  end if;

  select * into v_lim from public.kimari_limits(v_actor);
  select count(*) into v_n from public.places where actor_id = v_actor;
  if v_n >= v_lim.max_places then
    raise exception 'hai raggiunto il massimo di % posti salvati', v_lim.max_places;
  end if;

  insert into public.places (actor_id, name, address, note)
  values (v_actor, btrim(p_name), nullif(btrim(p_address), ''), nullif(btrim(p_note), ''))
  on conflict (actor_id, name) do update
    set address = coalesce(excluded.address, public.places.address),
        note    = coalesce(excluded.note,    public.places.note)
  returning id into v_id;

  return v_id;
end;
$$;

create function public.delete_place(p_place uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  delete from public.places where id = p_place and actor_id = public.kimari_actor_id();
  if not found then
    raise exception 'posto non trovato';
  end if;
end;
$$;

-- --------------------------------------------------- cancellazione account
-- Come in 0005: ogni tabella nuova con FK verso actors va gestita qui.
--
--   places, entitlements  -> via: sono solo suoi.
--
--   media, expenses, settlements, expense_shares -> RESTANO, con l'actor
--     anonimizzato. Sulle spese non è una sfumatura: `expense_shares` dice
--     "questa spesa era divisa fra queste persone". Cancellare una riga
--     ridividerebbe il conto fra quelle rimaste, cambiando quanto devono
--     senza che nessuno l'abbia deciso. Il debito resta scritto giusto,
--     intestato a "Account eliminato".
--
-- E la cancellazione NON viene mai rifiutata, nemmeno con conti aperti:
-- Apple pretende che si possa sempre cancellare l'account (5.1.1 v).
-- Se ci sono debiti in sospeso lo si dice nella UI prima di confermare,
-- non lo si impedisce.
do $$
begin
  if not exists (
    select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public' and p.proname = 'delete_my_account'
  ) then
    raise notice 'delete_my_account() non trovata: applica 0004 e ri-applica questo blocco.';
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
      if v_uid is null then
        raise exception 'non sei autenticato';
      end if;

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
        -- expense_shares NON si tocca: vedi il commento sopra.
        delete from public.places          where actor_id = v_actor;
        delete from public.entitlements    where actor_id = v_actor;

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
  public.kimari_limits(uuid),
  public.kimari_path_plan(text),
  public.plan_balances(uuid),
  public.register_media(uuid, text, text, text, bigint),
  public.delete_media(uuid),
  public.add_expense(uuid, bigint, text, uuid[]),
  public.void_expense(uuid),
  public.add_settlement(uuid, uuid, bigint),
  public.save_place(text, text, text),
  public.delete_place(uuid)
from public;

grant execute on function
  public.kimari_limits(uuid),
  public.plan_balances(uuid),
  public.register_media(uuid, text, text, text, bigint),
  public.delete_media(uuid),
  public.add_expense(uuid, bigint, text, uuid[]),
  public.void_expense(uuid),
  public.add_settlement(uuid, uuid, bigint),
  public.save_place(text, text, text),
  public.delete_place(uuid)
to authenticated;

grant select on public.media, public.expenses, public.expense_shares,
                public.settlements, public.places, public.entitlements
to authenticated;

commit;
