-- metriche.sql — le domande che contano, da incollare nel SQL Editor.
--
-- La ROADMAP-V1 chiede una metrica numero 1 e una metrica virale. Raccogliere
-- gli eventi non basta: se leggerli richiede di scrivere una query ogni volta,
-- non li guarda nessuno. Sono qui, con dentro il perche' di ogni scelta.
--
-- Si lancia una query per volta (l'editor mostra l'ultimo risultato).

-- ===========================================================================
-- 1. CONFIRMED PLAN RATE — la metrica numero 1
-- ===========================================================================
-- piani confermati / piani creati, ma SOLO fra i piani condivisi davvero.
-- Il perche' e' nella roadmap: "un piano votato solo dal creatore e' un piano
-- morto". Contarlo abbasserebbe il numero senza dire niente su Kimari — dice
-- solo che qualcuno ha aperto l'app e non ha mandato il link.
--
-- "Condiviso" = qualcuno ha aperto l'invito (invite_opened), che e' il primo
-- segno che il link ha lasciato il telefono di chi organizza.
with condivisi as (
  select distinct plan_id
    from public.funnel_events
   where name = 'invite_opened' and plan_id is not null
)
select
  count(*)                                                as piani_condivisi,
  count(*) filter (where p.status = 'confirmed')          as confermati,
  round(100.0 * count(*) filter (where p.status = 'confirmed')
        / nullif(count(*), 0), 1)                         as percentuale
from public.plans p
join condivisi c on c.plan_id = p.id;

-- ===========================================================================
-- 2. IL FUNNEL, passo per passo
-- ===========================================================================
-- Dove si perde la gente. L'ordine e' quello che vive una persona vera:
-- riceve il link → lo apre → entra → vota. Ogni scalino che crolla dice
-- qualcosa di diverso: fra "aperto" ed "entrato" c'e' il nome da scrivere,
-- fra "entrato" e "votato" c'e' la schermata del voto.
select
  count(distinct plan_id) filter (where name = 'plan_created')   as creati,
  count(distinct plan_id) filter (where name = 'invite_opened')  as inviti_aperti,
  count(distinct plan_id) filter (where name = 'guest_joined')   as con_un_ospite_entrato,
  count(distinct plan_id) filter (where name = 'vote_submitted') as con_un_voto,
  count(distinct plan_id) filter (where name = 'plan_confirmed') as confermati
from public.funnel_events;

-- ===========================================================================
-- 3. LA METRICA VIRALE
-- ===========================================================================
-- Per ogni organizzatore: quanti ospiti ha portato, e quanti di quegli ospiti
-- sono diventati organizzatori a loro volta. Il secondo numero e' quello che
-- dice se Kimari si diffonde da solo o se lo sta spingendo Vincenzo a mano.
with organizzatori as (
  select distinct organizer_id from public.plans where organizer_id is not null
),
ospiti_entrati as (
  select p.organizer_id, e.actor_id as ospite
    from public.funnel_events e
    join public.plans p on p.id = e.plan_id
   where e.name = 'guest_joined'
     and e.actor_id is distinct from p.organizer_id
)
select
  (select count(*) from organizzatori)                             as organizzatori,
  (select count(distinct ospite) from ospiti_entrati)              as ospiti_entrati,
  (select count(distinct o.ospite) from ospiti_entrati o
     where exists (select 1 from public.plans p2 where p2.organizer_id = o.ospite))
                                                                   as ospiti_diventati_organizzatori;

-- ===========================================================================
-- 4. IL GATE DEI 10 GRUPPI (CLAUDE.md)
-- ===========================================================================
-- Organizzatori con almeno 2 piani in 30 giorni. E' anche il
-- "second_plan_created" della roadmap: si ricava contando, senza tenere un
-- contatore nel client — che sbaglierebbe appena qualcuno usa due telefoni.
select a.display_name, count(*) as piani, min(p.created_at) as primo, max(p.created_at) as ultimo
  from public.plans p
  join public.actors a on a.id = p.organizer_id
 where p.created_at > now() - interval '30 days'
   and a.display_name not like 'PROVA%'          -- fuori i dati di collaudo
 group by a.display_name
having count(*) >= 2
 order by count(*) desc;

-- ===========================================================================
-- 5. GLI EVENTI GREZZI, ultimi 100
-- ===========================================================================
-- Per quando un numero sopra sembra sbagliato: qui si vede cosa e' successo
-- davvero, e in che ordine.
select e.created_at, e.name, a.display_name, p.title
  from public.funnel_events e
  left join public.actors a on a.id = e.actor_id
  left join public.plans  p on p.id = e.plan_id
 order by e.created_at desc
 limit 100;
