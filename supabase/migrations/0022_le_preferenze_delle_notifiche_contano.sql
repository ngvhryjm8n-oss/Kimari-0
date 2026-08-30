-- 0022 — le preferenze delle notifiche esistono davvero.
--
-- IL DIFETTO (trovato il 28/8/2026 controllando la ROADMAP-V1, punto P0.1).
-- Nel Profilo ci sono dieci interruttori — "Devo votare", "Commenti",
-- "Spese"… — e sotto non c'era niente:
--
--   1. il client li teneva in `state.settings.push`, in memoria e basta.
--      Non finivano nel database ne' in localStorage: bastava ricaricare la
--      pagina e tornavano tutti al valore di partenza.
--   2. la funzione di consegna (supabase/functions/svuota-coda) non li
--      guardava mai: leggeva la coda e mandava tutto a tutti.
--   3. anche silenziare un GRUPPO non fermava le push. Il silenzio era
--      salvato per davvero (tabella `mutes`, dal 0011) e la schermata Novita'
--      lo rispettava, ma `push_accoda` non lo consultava: si silenziava un
--      gruppo e il telefono suonava lo stesso.
--
-- Tre modi diversi di essere lo stesso difetto: un'interfaccia che promette
-- una cosa che sotto non succede — la lezione 1 di STATO.md.
--
-- LA SCELTA. Si salvano solo le DIFFERENZE dal valore di partenza, non tutte
-- e dieci le righe per ogni persona: chi non ha mai toccato niente non occupa
-- niente, e i valori di partenza restano in un posto solo (push_default).
-- Quel posto deve dire le stesse cose del client: se cambia uno, cambia
-- l'altro. Sono elencati identici in app/index.html, riga `settings:{ push:`.

begin;

create table if not exists public.push_prefs (
  actor_id  uuid    not null references public.actors(id) on delete cascade,
  genere    text    not null check (genere in
              ('vote','confirm','change','proposal','late','comment',
               'media','expense','reminder','group')),
  attiva    boolean not null,
  primary key (actor_id, genere)
);

alter table public.push_prefs enable row level security;

-- Sola lettura, e solo le proprie: la scrittura passa dalla RPC, come tutto
-- il resto (CLAUDE.md, architettura DB).
drop policy if exists push_prefs_read on public.push_prefs;
create policy push_prefs_read on public.push_prefs
  for select using (actor_id = public.current_actor_id());

-- I valori di partenza, in un posto solo. Commenti, allegati e "attivita'
-- minori" partono spenti: sono i tre che darebbero fastidio piu' spesso.
create or replace function public.push_default(p_genere text)
returns boolean
language sql
immutable
as $$
  select case p_genere
    when 'comment' then false
    when 'media'   then false
    when 'group'   then false
    else true
  end;
$$;

-- Vuole questa notifica? Tre domande in fila: ha spento la categoria, ha
-- silenziato il gruppo, e (implicito nei chiamanti) ha un dispositivo.
create or replace function public.push_vuole(p_actor uuid, p_genere text, p_plan uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select
    coalesce((select attiva from public.push_prefs
               where actor_id = p_actor and genere = p_genere),
             public.push_default(p_genere))
    and not exists (
      select 1
        from public.plans pl
        join public.mutes m on m.group_id = pl.group_id
       where pl.id = p_plan
         and m.actor_id = p_actor);
$$;

-- Cambiare una preferenza. Come ogni scrittura: security definer, e tocca
-- solo le proprie righe — l'actor lo decide il database, non il client.
create or replace function public.set_push_pref(p_genere text, p_attiva boolean)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare v_actor uuid := public.current_actor_id();
begin
  if v_actor is null then raise exception 'no actor'; end if;
  if p_genere not in ('vote','confirm','change','proposal','late','comment',
                      'media','expense','reminder','group') then
    raise exception 'genere sconosciuto: %', p_genere;
  end if;

  -- Se la scelta coincide col valore di partenza la riga si toglie, invece di
  -- restare a dire la stessa cosa: cosi' cambiare un giorno il valore di
  -- partenza vale per chi non ha mai espresso una preferenza diversa.
  if p_attiva is not distinct from public.push_default(p_genere) then
    delete from public.push_prefs where actor_id = v_actor and genere = p_genere;
  else
    insert into public.push_prefs (actor_id, genere, attiva)
    values (v_actor, p_genere, p_attiva)
    on conflict (actor_id, genere) do update set attiva = excluded.attiva;
  end if;
end;
$$;

-- ---------------------------------------------------------------- la coda
-- Da qui in poi si accoda solo a chi quella notizia la vuole. Il filtro sta
-- nell'ACCODARE e non nel consegnare: una riga che nessuno vuole non deve
-- nemmeno nascere, se no la coda si riempie di lavoro da buttare.
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
     and exists (select 1 from public.push_subscriptions s where s.actor_id = pa.actor_id)
     -- NUOVO: la categoria spenta, o il gruppo silenziato, fermano qui.
     and public.push_vuole(pa.actor_id, p_genere, p_plan);
  get diagnostics v_n = row_count;
  return v_n;
end;
$$;

-- Il voto non passa da push_accoda (va al solo organizzatore): stesso filtro,
-- scritto a mano, se no restava l'unica notifica che ignora le preferenze.
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
     and exists (select 1 from public.push_subscriptions s where s.actor_id = v_org)
     and public.push_vuole(v_org, 'vote', new.plan_id) then
    insert into public.push_coda (actor_id, plan_id, genere, dati)
    values (v_org, new.plan_id, 'vote', jsonb_build_object('chi', new.actor_id));
  end if;
  return new;
end;
$$;

commit;

-- Dopo averla applicata, il controllo che conta:
--   node tools/controlla-colonne.mjs      (il client legge push_prefs)
--   supabase/tests/0022_preferenze.sql    (i corpi plpgsql, qui sotto)
