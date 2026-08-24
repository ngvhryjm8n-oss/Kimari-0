-- 0005_extras_comments_proposals.sql — Fase 2 del PIANO_V1.
--
-- Tre cose del prototipo che oggi non esistono:
--   1. domande extra e decisioni generiche ("Cosa regaliamo a papà?")
--   2. commenti, compresi i messaggi di sistema della storia del piano
--   3. proposte di cambio data/posto, votate dal gruppo
--
-- ADDITIVA come la 0003. In particolare NON tocca `candidates`: le domande
-- extra hanno le loro tabelle, così il client V0 — che filtra su
-- `c.field === 'when' | 'where'` — continua a funzionare identico.
--
-- SCELTA: applicare una proposta approvata NON avviene qui. La funzione
-- close_proposal si limita a marcarla; è il client che poi chiama
-- `update_plan_field`, che sa già fare (index.html:724 e :731) e che tiene
-- aggiornati version e plan_changes. Duplicare quella logica qui dentro
-- significherebbe riscrivere alla cieca il pezzo più delicato di 0002.

begin;

-- ---------------------------------------------------------------- preflight
do $$
begin
  if to_regclass('public.plans') is null
     or to_regclass('public.participants') is null
     or to_regclass('public.actors') is null then
    raise exception 'schema inatteso: mancano plans/participants/actors';
  end if;
  if to_regclass('public.comments') is not null then
    raise exception 'public.comments esiste già: 0005 sembra già applicata';
  end if;
  if to_regclass('public.groups') is null then
    raise exception 'applica prima 0003_groups.sql';
  end if;
  if not exists (
    select 1 from information_schema.columns
     where table_schema = 'public' and table_name = 'plans' and column_name = 'organizer_id'
  ) then
    raise exception 'plans.organizer_id non trovata: i controlli "solo l''organizzatore" ci si appoggiano';
  end if;
end $$;

-- ---------------------------------------------------------------- plans
alter table public.plans add column emoji           text    not null default '📌';
alter table public.plans add column kind            text    not null default 'plan'
  check (kind in ('plan', 'decision'));
alter table public.plans add column allow_proposals boolean not null default true;

-- ---------------------------------------------------------------- helper
create function public.kimari_is_participant(p_plan uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from public.participants pa
    where pa.plan_id = p_plan
      and pa.actor_id = public.kimari_actor_id()
  );
$$;

create function public.kimari_is_organizer(p_plan uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from public.plans p
    where p.id = p_plan
      and p.organizer_id = public.kimari_actor_id()
  );
$$;

-- ------------------------------------------------- domande extra
create table public.plan_extras (
  id           uuid primary key default gen_random_uuid(),
  plan_id      uuid        not null references public.plans(id) on delete cascade,
  question     text        not null check (length(btrim(question)) between 1 and 120),
  is_binary    boolean     not null default false,
  status       text        not null default 'deciding' check (status in ('deciding', 'confirmed')),
  chosen_id    uuid,
  position     integer     not null default 0,
  created_at   timestamptz not null default now()
);

create index plan_extras_plan_idx on public.plan_extras (plan_id, position);

create table public.extra_candidates (
  id        uuid    primary key default gen_random_uuid(),
  extra_id  uuid    not null references public.plan_extras(id) on delete cascade,
  label     text    not null check (length(btrim(label)) between 1 and 80),
  position  integer not null default 0
);

create index extra_candidates_extra_idx on public.extra_candidates (extra_id, position);

alter table public.plan_extras
  add constraint plan_extras_chosen_fk
  foreign key (chosen_id) references public.extra_candidates(id) on delete set null;

-- Approval voting, come per when/where: si segnano tutte le opzioni che vanno bene.
create table public.extra_approvals (
  extra_id      uuid        not null references public.plan_extras(id)      on delete cascade,
  candidate_id  uuid        not null references public.extra_candidates(id) on delete cascade,
  actor_id      uuid        not null references public.actors(id)           on delete cascade,
  created_at    timestamptz not null default now(),
  primary key (candidate_id, actor_id)
);

create index extra_approvals_extra_idx on public.extra_approvals (extra_id);

-- security_invoker: senza questo la vista girerebbe coi diritti del proprietario
-- e scavalcherebbe la RLS, mostrando i conteggi di OGNI piano a chiunque.
-- (Da verificare che v_candidate_results in 0001 non abbia lo stesso problema.)
create view public.v_extra_results with (security_invoker = true) as
  select ec.extra_id,
         ec.id as candidate_id,
         ec.label,
         ec.position,
         count(ea.actor_id) as approvals
    from public.extra_candidates ec
    left join public.extra_approvals ea on ea.candidate_id = ec.id
   group by ec.extra_id, ec.id, ec.label, ec.position;

-- ------------------------------------------------- commenti
create table public.comments (
  id          uuid        primary key default gen_random_uuid(),
  plan_id     uuid        not null references public.plans(id)  on delete cascade,
  actor_id    uuid        references public.actors(id)          on delete set null,
  body        text        not null check (length(btrim(body)) between 1 and 1000),
  is_system   boolean     not null default false,
  kind        text,
  created_at  timestamptz not null default now()
);

create index comments_plan_idx on public.comments (plan_id, created_at);

-- ------------------------------------------------- proposte di cambio
create table public.proposals (
  id          uuid        primary key default gen_random_uuid(),
  plan_id     uuid        not null references public.plans(id)  on delete cascade,
  field       text        not null check (field in ('when', 'where')),
  -- Stessa forma che si passa a update_plan_field:
  --   when  -> { "starts_at": "...", "timezone": "..." }
  --   where -> { "place_name": "...", "place_address": "..." }
  new_value   jsonb       not null,
  reason      text        check (reason is null or length(reason) <= 200),
  created_by  uuid        not null references public.actors(id) on delete cascade,
  status      text        not null default 'open'
              check (status in ('open', 'approved', 'applied', 'rejected', 'expired')),
  created_at  timestamptz not null default now(),
  closed_at   timestamptz,
  closed_by   uuid        references public.actors(id) on delete set null
);

create index proposals_plan_idx on public.proposals (plan_id, status);

-- Una proposta aperta per campo, altrimenti si vota su bersagli in movimento.
create unique index proposals_one_open_per_field
  on public.proposals (plan_id, field)
  where status in ('open', 'approved');

create table public.proposal_votes (
  proposal_id uuid        not null references public.proposals(id) on delete cascade,
  actor_id    uuid        not null references public.actors(id)    on delete cascade,
  vote        text        not null check (vote in ('yes', 'no')),
  voted_at    timestamptz not null default now(),
  primary key (proposal_id, actor_id)
);

-- ---------------------------------------------------------------- RLS
-- Sola lettura, come sempre. Tutto participant-scoped.

alter table public.plan_extras      enable row level security;
alter table public.extra_candidates enable row level security;
alter table public.extra_approvals  enable row level security;
alter table public.comments         enable row level security;
alter table public.proposals        enable row level security;
alter table public.proposal_votes   enable row level security;

create policy plan_extras_read on public.plan_extras
  for select using (public.kimari_is_participant(plan_id));

create policy extra_candidates_read on public.extra_candidates
  for select using (exists (
    select 1 from public.plan_extras e
     where e.id = extra_id and public.kimari_is_participant(e.plan_id)
  ));

create policy extra_approvals_read on public.extra_approvals
  for select using (exists (
    select 1 from public.plan_extras e
     where e.id = extra_id and public.kimari_is_participant(e.plan_id)
  ));

create policy comments_read on public.comments
  for select using (public.kimari_is_participant(plan_id));

create policy proposals_read on public.proposals
  for select using (public.kimari_is_participant(plan_id));

create policy proposal_votes_read on public.proposal_votes
  for select using (exists (
    select 1 from public.proposals pr
     where pr.id = proposal_id and public.kimari_is_participant(pr.plan_id)
  ));

-- ---------------------------------------------------------------- RPC
create function public.add_plan_extra(p_plan uuid, p_question text,
                                      p_options text[], p_binary boolean default false)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_extra   uuid;
  v_options text[];
  v_label   text;
  v_i       integer := 0;
begin
  if not public.kimari_is_organizer(p_plan) then
    raise exception 'solo chi organizza può aggiungere una domanda';
  end if;
  if coalesce(btrim(p_question), '') = '' then
    raise exception 'la domanda non può essere vuota';
  end if;

  v_options := case when p_binary then array['Sì', 'No'] else coalesce(p_options, '{}') end;
  if array_length(v_options, 1) is null or array_length(v_options, 1) < 2 then
    raise exception 'servono almeno due opzioni';
  end if;

  insert into public.plan_extras (plan_id, question, is_binary, position)
  values (p_plan, btrim(p_question), coalesce(p_binary, false),
          coalesce((select max(position) + 1 from public.plan_extras where plan_id = p_plan), 0))
  returning id into v_extra;

  foreach v_label in array v_options loop
    if btrim(v_label) <> '' then
      insert into public.extra_candidates (extra_id, label, position)
      values (v_extra, btrim(v_label), v_i);
      v_i := v_i + 1;
    end if;
  end loop;

  return v_extra;
end;
$$;

-- Sostituisce in blocco le preferenze di chi chiama su questa domanda:
-- rivotare aggiorna, non accumula.
create function public.submit_extra_ballot(p_extra uuid, p_candidates uuid[])
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_actor uuid := public.kimari_actor_id();
  v_plan  uuid;
begin
  select plan_id into v_plan from public.plan_extras where id = p_extra;
  if v_plan is null then
    raise exception 'domanda non trovata';
  end if;
  if v_actor is null or not public.kimari_is_participant(v_plan) then
    raise exception 'non partecipi a questo piano';
  end if;
  if exists (select 1 from public.plan_extras where id = p_extra and status <> 'deciding') then
    raise exception 'questa domanda è già stata decisa';
  end if;

  delete from public.extra_approvals where extra_id = p_extra and actor_id = v_actor;

  insert into public.extra_approvals (extra_id, candidate_id, actor_id)
  select p_extra, c.id, v_actor
    from public.extra_candidates c
   where c.extra_id = p_extra
     and c.id = any(coalesce(p_candidates, '{}'));
end;
$$;

create function public.confirm_extra(p_extra uuid, p_candidate uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_plan uuid;
begin
  select plan_id into v_plan from public.plan_extras where id = p_extra;
  if v_plan is null then
    raise exception 'domanda non trovata';
  end if;
  if not public.kimari_is_organizer(v_plan) then
    raise exception 'solo chi organizza può decidere';
  end if;
  if not exists (select 1 from public.extra_candidates
                  where id = p_candidate and extra_id = p_extra) then
    raise exception 'quell''opzione non appartiene a questa domanda';
  end if;

  update public.plan_extras
     set status = 'confirmed', chosen_id = p_candidate
   where id = p_extra;
end;
$$;

create function public.add_comment(p_plan uuid, p_body text)
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
  if coalesce(btrim(p_body), '') = '' then
    raise exception 'il commento è vuoto';
  end if;

  -- is_system resta false: i messaggi di sistema li scrivono le funzioni,
  -- mai il client.
  insert into public.comments (plan_id, actor_id, body)
  values (p_plan, v_actor, btrim(p_body))
  returning id into v_id;

  return v_id;
end;
$$;

create function public.open_proposal(p_plan uuid, p_field text,
                                     p_value jsonb, p_reason text default null)
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
  if p_field not in ('when', 'where') then
    raise exception 'si può proporre solo when o where';
  end if;
  if not exists (select 1 from public.plans
                  where id = p_plan and status = 'confirmed' and allow_proposals) then
    raise exception 'su questo piano non si possono fare proposte';
  end if;
  if exists (select 1 from public.proposals
              where plan_id = p_plan and field = p_field
                and status in ('open', 'approved')) then
    raise exception 'c''è già una proposta aperta su questo campo';
  end if;

  insert into public.proposals (plan_id, field, new_value, reason, created_by)
  values (p_plan, p_field, p_value, nullif(btrim(p_reason), ''), v_actor)
  returning id into v_id;

  -- Chi propone vota sì: non ha senso chiederglielo.
  insert into public.proposal_votes (proposal_id, actor_id, vote)
  values (v_id, v_actor, 'yes');

  return v_id;
end;
$$;

-- Restituisce lo stato aggiornato della proposta.
create function public.vote_proposal(p_proposal uuid, p_vote text)
returns text
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_actor    uuid := public.kimari_actor_id();
  v_plan     uuid;
  v_status   text;
  v_yes      integer;
  v_no       integer;
  v_eligible integer;
begin
  select plan_id, status into v_plan, v_status from public.proposals where id = p_proposal;
  if v_plan is null then
    raise exception 'proposta non trovata';
  end if;
  if v_actor is null or not public.kimari_is_participant(v_plan) then
    raise exception 'non partecipi a questo piano';
  end if;
  if v_status <> 'open' then
    raise exception 'questa proposta non è più aperta';
  end if;
  if p_vote not in ('yes', 'no') then
    raise exception 'si vota yes o no';
  end if;

  insert into public.proposal_votes (proposal_id, actor_id, vote)
  values (p_proposal, v_actor, p_vote)
  on conflict (proposal_id, actor_id) do update set vote = excluded.vote, voted_at = now();

  select count(*) filter (where vote = 'yes'),
         count(*) filter (where vote = 'no')
    into v_yes, v_no
    from public.proposal_votes where proposal_id = p_proposal;

  select count(*) into v_eligible from public.participants where plan_id = v_plan;

  -- Maggioranza assoluta degli aventi diritto, non di chi ha votato: così una
  -- proposta non passa perché hanno risposto in tre.
  if v_yes * 2 > v_eligible then
    update public.proposals set status = 'approved' where id = p_proposal;
    return 'approved';
  elsif v_no * 2 > v_eligible then
    update public.proposals
       set status = 'rejected', closed_at = now(), closed_by = v_actor
     where id = p_proposal;
    return 'rejected';
  end if;

  return 'open';
end;
$$;

-- Il client chiama questa DOPO aver chiamato update_plan_field, per registrare
-- che la proposta è stata messa in pratica. 'rejected' la chiude e basta.
create function public.close_proposal(p_proposal uuid, p_status text)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_actor uuid := public.kimari_actor_id();
  v_plan  uuid;
begin
  select plan_id into v_plan from public.proposals where id = p_proposal;
  if v_plan is null then
    raise exception 'proposta non trovata';
  end if;
  if not public.kimari_is_organizer(v_plan) then
    raise exception 'solo chi organizza può chiudere una proposta';
  end if;
  if p_status not in ('applied', 'rejected', 'expired') then
    raise exception 'stato non valido';
  end if;

  update public.proposals
     set status = p_status, closed_at = now(), closed_by = v_actor
   where id = p_proposal and status in ('open', 'approved');

  if not found then
    raise exception 'la proposta è già chiusa';
  end if;
end;
$$;

-- ---------------------------------------------------------------- permessi
revoke execute on function
  public.kimari_is_participant(uuid),
  public.kimari_is_organizer(uuid),
  public.add_plan_extra(uuid, text, text[], boolean),
  public.submit_extra_ballot(uuid, uuid[]),
  public.confirm_extra(uuid, uuid),
  public.add_comment(uuid, text),
  public.open_proposal(uuid, text, jsonb, text),
  public.vote_proposal(uuid, text),
  public.close_proposal(uuid, text)
from public;

grant execute on function
  public.add_plan_extra(uuid, text, text[], boolean),
  public.submit_extra_ballot(uuid, uuid[]),
  public.confirm_extra(uuid, uuid),
  public.add_comment(uuid, text),
  public.open_proposal(uuid, text, jsonb, text),
  public.vote_proposal(uuid, text),
  public.close_proposal(uuid, text)
to authenticated;

grant select on public.plan_extras, public.extra_candidates, public.extra_approvals,
                public.v_extra_results, public.comments,
                public.proposals, public.proposal_votes
to anon, authenticated;

commit;
