-- 0019_quando_notificare.sql — chi riceve una notifica, e quando.
--
-- La 0017 ha messo DOVE consegnare. Questa decide QUANDO, ed è la parte che
-- fa la differenza fra un'app che avvisa e una che disturba.
--
-- Le notifiche NON si mandano dal trigger. Un trigger che chiama un servizio
-- esterno tiene aperta la transazione di chi ha appena votato finché Google
-- non risponde: se il servizio è lento, votare diventa lento; se è giù,
-- votare fallisce. Il voto è importante, la notifica no.
--
-- Quindi si scrive in una coda, dentro la stessa transazione, e qualcun altro
-- la svuota. Se la consegna fallisce si riprova; se il voto fallisce, la
-- notifica non c'è mai stata — che è esattamente il comportamento voluto.

create table if not exists public.push_coda (
  id          bigserial   primary key,
  actor_id    uuid        not null references public.actors(id) on delete cascade,
  plan_id     uuid        references public.plans(id) on delete cascade,
  -- La CATEGORIA, non il testo: il testo si compone al momento della consegna,
  -- nella lingua di chi legge. Metterlo qui vorrebbe dire congelare l'italiano
  -- nel database per sempre.
  genere      text        not null check (genere in
                ('vote','confirm','change','proposal','late','comment','reminder','group')),
  dati        jsonb       not null default '{}'::jsonb,
  creata      timestamptz not null default now(),
  mandata     timestamptz,
  tentativi   integer     not null default 0
);

create index if not exists push_coda_da_mandare_idx
  on public.push_coda (creata) where mandata is null;

alter table public.push_coda enable row level security;
-- Nessuno la legge dal client: la svuota solo la funzione, con la chiave di
-- servizio. Senza policy di select, la RLS nega tutto — che è ciò che serve.

-- ------------------------------------------------------ chi va avvisato
-- Mai chi ha causato l'evento: ricevere la notifica del proprio voto è il
-- modo più veloce per far spegnere le notifiche a qualcuno.
create or replace function public.push_accoda(
  p_plan uuid, p_genere text, p_tranne uuid, p_dati jsonb default '{}'::jsonb)
returns integer
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare v_n integer;
begin
  insert into public.push_coda (actor_id, plan_id, genere, dati)
  select pa.actor_id, p_plan, p_genere, coalesce(p_dati, '{}'::jsonb)
    from public.participants pa
   where pa.plan_id = p_plan
     and pa.actor_id is distinct from p_tranne
     -- Solo chi ha almeno un dispositivo iscritto: accodare per gli altri
     -- riempirebbe la coda di righe che nessuno consegnerà mai.
     and exists (select 1 from public.push_subscriptions s where s.actor_id = pa.actor_id);
  get diagnostics v_n = row_count;
  return v_n;
end;
$$;

-- ---------------------------------------------------------- i momenti
-- Quattro, scelti perché sono quelli in cui non sapere costa qualcosa.

-- 1. Qualcuno ha votato → lo sa CHI ORGANIZZA, che è l'unico che deve agire.
create or replace function public.push_su_voto()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare v_org uuid;
begin
  select organizer_id into v_org from public.plans where id = new.plan_id;
  if v_org is not null and v_org is distinct from new.actor_id
     and exists (select 1 from public.push_subscriptions s where s.actor_id = v_org) then
    insert into public.push_coda (actor_id, plan_id, genere, dati)
    values (v_org, new.plan_id, 'vote', jsonb_build_object('chi', new.actor_id));
  end if;
  return new;
end;
$$;

drop trigger if exists push_voto on public.ballots;
create trigger push_voto after insert on public.ballots
  for each row execute function public.push_su_voto();

-- 2. Il piano è confermato, o annullato → lo sanno TUTTI. Sono le due notizie
--    che cambiano i piani della serata di qualcun altro.
create or replace function public.push_su_stato()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if new.status is distinct from old.status then
    if new.status = 'confirmed' then
      perform public.push_accoda(new.id, 'confirm', new.organizer_id);
    elsif new.status = 'cancelled' then
      perform public.push_accoda(new.id, 'change', new.organizer_id,
                                 jsonb_build_object('annullato', true));
    end if;
  -- 3. Data o posto cambiati dopo la conferma: chi si era organizzato per
  --    quell'ora deve saperlo, e non guarda l'app apposta.
  elsif new.status = 'confirmed' and new.version is distinct from old.version then
    perform public.push_accoda(new.id, 'change', new.organizer_id);
  end if;
  return new;
end;
$$;

drop trigger if exists push_stato on public.plans;
create trigger push_stato after update on public.plans
  for each row execute function public.push_su_stato();

-- 4. Qualcuno arriva tardi o non viene più → lo sanno gli altri, ed è la
--    notizia più urgente di tutte: arriva quando si sta uscendo di casa.
create or replace function public.push_su_ritardo()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if new.late_minutes is distinct from old.late_minutes
     or (new.rsvp = 'no' and old.rsvp is distinct from 'no') then
    perform public.push_accoda(new.plan_id, 'late', new.actor_id,
                               jsonb_build_object('chi', new.actor_id));
  end if;
  return new;
end;
$$;

-- ------------------------------------------------------------------ prova
do $prova$
declare v_ok boolean; v_col text;
begin
  -- La colonna del ritardo: se si chiama diversamente il trigger non si crea,
  -- e l'errore uscirebbe solo quando qualcuno segnala un ritardo vero.
  select column_name into v_col from information_schema.columns
   where table_schema = 'public' and table_name = 'participants'
     and column_name in ('late_minutes', 'late_min', 'ritardo_minuti')
   limit 1;

  if v_col = 'late_minutes' then
    drop trigger if exists push_ritardo on public.participants;
    create trigger push_ritardo after update on public.participants
      for each row execute function public.push_su_ritardo();
    raise notice '0019: trigger sui ritardi attivo';
  else
    raise notice '0019: participants non ha late_minutes (ha %) — trigger sui ritardi NON creato', coalesce(v_col, 'nessuna colonna simile');
  end if;

  select count(*) = 1 into v_ok from information_schema.tables
   where table_schema = 'public' and table_name = 'push_coda';
  if not v_ok then raise exception '0019: manca push_coda'; end if;

  select relrowsecurity into v_ok from pg_class where oid = 'public.push_coda'::regclass;
  if not v_ok then raise exception '0019: RLS spenta su push_coda'; end if;

  raise notice '0019: ok — la coda delle notifiche e i momenti in cui riempirla';
end $prova$;
