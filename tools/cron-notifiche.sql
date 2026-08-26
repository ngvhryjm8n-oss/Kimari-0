-- Fa girare la consegna delle notifiche ogni minuto.
-- Da incollare nel SQL Editor di Supabase, UNA volta sola, dopo aver
-- distribuito la funzione con tools\attiva-notifiche.ps1.
--
-- PRIMA DI INCOLLARE: sostituisci INCOLLA-QUI-IL-SEGRETO-CRON con il valore
-- che trovi in D:\Kimari\segreti\vapid.txt sulla riga che comincia con CRON.
--
-- Non serve la chiave service_role, e non è un dettaglio: quella apre TUTTO il
-- database, e metterla qui la lascerebbe scritta in chiaro nella tabella di
-- cron — e in ogni backup. Il segreto del cron invece serve a una cosa sola,
-- dire "sono io che chiamo", e se trapelasse il peggio che si può fare è far
-- consegnare le notifiche in anticipo.

create extension if not exists pg_cron;
create extension if not exists pg_net;

-- Il segreto come impostazione del database, non dentro il comando: così non
-- compare nella riga pianificata che chiunque legga cron.job può vedere.
alter database postgres set app.segreto_cron = 'INCOLLA-QUI-IL-SEGRETO-CRON';

-- Se c'era già una pianificazione con questo nome la si toglie: due
-- pianificazioni identiche vorrebbero dire notifiche doppie.
select cron.unschedule('kimari-notifiche')
 where exists (select 1 from cron.job where jobname = 'kimari-notifiche');

select cron.schedule('kimari-notifiche', '* * * * *', $$
  select net.http_post(
    url     := 'https://fnafzokgkbhhjircrogy.supabase.co/functions/v1/svuota-coda',
    headers := jsonb_build_object(
                 'Content-Type',  'application/json',
                 'Authorization', 'Bearer ' || current_setting('app.segreto_cron', true))
  );
$$);

-- ------------------------------------------------------------------ prova
-- Deve stampare una riga con kimari-notifiche e * * * * *
select jobid, schedule, jobname, active
  from cron.job where jobname = 'kimari-notifiche';

-- Fra un paio di minuti, per vedere se sta girando DAVVERO. Una
-- pianificazione che esiste non è una pianificazione che funziona.
--
--   select status, return_message, start_time
--     from cron.job_run_details
--    where jobid = (select jobid from cron.job where jobname = 'kimari-notifiche')
--    order by start_time desc limit 5;
