-- Fa girare la consegna delle notifiche ogni minuto.
-- Da incollare nel SQL Editor di Supabase, UNA volta sola, DOPO aver
-- distribuito la funzione con tools\attiva-notifiche.ps1.
--
-- Prima di incollare: sostituisci INCOLLA-QUI-LA-SERVICE-ROLE con la chiave
-- che trovi in Supabase → Project Settings → API → service_role.
--
-- QUELLA CHIAVE NON VA IN NESSUNA CHAT E NON VA NEL REPO. Chi ce l'ha può
-- leggere e scrivere qualunque cosa scavalcando ogni permesso: è l'unica
-- credenziale del progetto che vale davvero.

create extension if not exists pg_cron;
create extension if not exists pg_net;

-- La chiave si mette come impostazione del DATABASE, non dentro il comando
-- pianificato. Dentro il comando finirebbe in chiaro nella tabella di cron,
-- leggibile da chiunque abbia accesso al database — compreso chi un domani
-- avesse accesso a un backup.
alter database postgres set app.chiave_servizio = 'INCOLLA-QUI-LA-SERVICE-ROLE';

-- Se c'era già una pianificazione con lo stesso nome la si toglie: due
-- pianificazioni identiche significherebbero notifiche doppie.
select cron.unschedule('kimari-notifiche')
 where exists (select 1 from cron.job where jobname = 'kimari-notifiche');

select cron.schedule('kimari-notifiche', '* * * * *', $$
  select net.http_post(
    url     := 'https://fnafzokgkbhhjircrogy.supabase.co/functions/v1/svuota-coda',
    headers := jsonb_build_object(
                 'Content-Type',  'application/json',
                 'Authorization', 'Bearer ' || current_setting('app.chiave_servizio', true))
  );
$$);

-- ------------------------------------------------------------------ prova
-- Deve stampare la pianificazione appena creata.
select jobid, schedule, jobname, active from cron.job where jobname = 'kimari-notifiche';

-- Fra un minuto, per vedere se sta girando davvero:
--   select status, return_message, start_time
--     from cron.job_run_details
--    where jobid = (select jobid from cron.job where jobname = 'kimari-notifiche')
--    order by start_time desc limit 5;
