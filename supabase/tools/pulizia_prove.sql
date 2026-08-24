-- pulizia_prove.sql — toglie i dati che ho creato provando l'app in produzione
-- il 25 agosto 2026.
--
-- Cosa ho creato, e perché:
--   2 profili  PROVA-CLAUDE-cancellami e PROVA2-CLAUDE-cancellami
--              → per verificare che il primo accesso funzioni
--   1 piano    "PROVA-CLAUDE cancellami" con 2 date e un invito
--              → per verificare creazione e flusso ospite
--   3 utenti anonimi (uno per ogni sessione aperta e chiusa)
--
-- Serviva: erano i due percorsi che nessuno aveva mai eseguito davvero.
-- Il piano è rimasto senza emoji e senza domande perché finalize_plan non
-- esisteva ancora — ed è così che è saltata fuori la creazione non atomica,
-- corretta poi in 0010.
--
-- Lancia tutto nel SQL Editor. Non tocca niente che non abbia quel nome.

begin;

create temp table _prove on commit drop as
  select id from public.plans where title like 'PROVA-CLAUDE%';

delete from public.approvals
 where candidate_id in (select id from public.candidates
                         where plan_id in (select id from _prove));
delete from public.ballots      where plan_id in (select id from _prove);
delete from public.candidates   where plan_id in (select id from _prove);
delete from public.participants where plan_id in (select id from _prove);
delete from public.invite_uses
 where invite_link_id in (select id from public.invite_links
                           where plan_id in (select id from _prove));
delete from public.invite_links  where plan_id in (select id from _prove);
delete from public.plan_changes  where plan_id in (select id from _prove);
delete from public.funnel_events where plan_id in (select id from _prove);
delete from public.plans         where id in (select id from _prove);

-- Prima gli utenti auth, poi i profili: dopo non si saprebbe più quali erano.
delete from auth.users
 where id in (select auth_user_id from public.actors
               where display_name like 'PROVA%CLAUDE%' and auth_user_id is not null);
delete from public.actors where display_name like 'PROVA%CLAUDE%';

commit;

-- Resta un utente anonimo senza profilo, dell'ultima sessione da ospite.
-- È indistinguibile da un visitatore vero che non ha ancora scritto il nome,
-- quindi non lo tocco: cancellarne uno sbagliato non si ripara.
