-- pulizia_prove.sql — toglie i dati che ho creato provando l'app in produzione
-- il 25 e il 26 agosto 2026.
--
-- AGGIUNTO IL 26/8. Provando il giro completo (gruppo, piano, condivisione,
-- voto da ospite, conferma, annullamento) ho creato anche:
--   1 gruppo   "PROVA-CLAUDE Cena", con il suo link d'invito poi revocato
--   2 piani    "PROVA-CLAUDE Pizza" (confermato) e "PROVA-CLAUDE Ospite"
--              (annullato), con voti, un commento e una spesa
--   3 profili  PROVA-CLAUDE Vincenzo, PROVA-CLAUDE Luca, PROVA-CLAUDE Marta
--              — tutti utenti ANONIMI: nessuno e' collegato a un Google o a un
--              Apple vero. L'ho verificato prima di scrivere questo file.
--
-- La cancellazione degli utenti auth ora tocca SOLO gli anonimi. Se un giorno
-- un account vero finisse per chiamarsi "PROVA...", questo file non deve
-- poterlo distruggere: un nome non e' una prova di niente.
--
-- AGGIUNTO ANCORA IL 26/8, provando il dominio kimariapp.com e le migrazioni
-- 0014 e 0015. Una ventina di profili in più, tutti col prefisso PROVA-CLAUDE
-- e tutti anonimi: Misura, Cronometro, Capo, Membro, Uscite, Amici, Link,
-- English, Finale, Dominio, Conti, Sparisce, Vittima, Estraneo, Intruso,
-- Migrazioni, Allegati, Sezioni. Con i loro gruppi, piani, spese e link.
--
-- Due di quei profili li ho cancellati durante le prove stesse (servivano a
-- verificare che delete_my_account non facesse pagare di più agli altri):
-- di quelli restano le quote nelle spese, intestate a "Membro eliminato".
-- Spariscono con i piani.
--
-- Cosa ho creato, e perché:
--   2 profili  PROVA-CLAUDE-cancellami e PROVA2-CLAUDE-cancellami
--              → per verificare che il primo accesso funzioni
--   1 piano    "PROVA-CLAUDE cancellami" con 2 date e un invito
--              → per verificare creazione e flusso ospite
--   3 utenti anonimi (uno per ogni sessione aperta e chiusa)
--
-- Servivano: erano i due percorsi che nessuno aveva mai eseguito davvero. Il
-- piano è rimasto senza emoji e senza domande perché finalize_plan non esisteva
-- ancora — ed è così che è saltata fuori la creazione non atomica, corretta
-- poi in 0010.
--
-- NIENTE tabelle temporanee. La prima versione ne usava una e l'editor SQL di
-- Supabase ha risposto 'relation "_prove" does not exist': non tiene lo stato
-- di sessione come ci si aspetterebbe. Il perché esatto non l'ho verificato —
-- le migrazioni con BEGIN/COMMIT invece funzionano — ma evitare del tutto lo
-- stato di sessione rende la domanda inutile.
-- Ogni riga qui sotto sta in piedi da sola ed è ripetibile: rilanciarla due
-- volte non fa danni.
--
-- Si lancia tutto insieme, DALL'ALTO IN BASSO. L'ordine conta: gli utenti auth
-- vanno tolti prima dei profili, dopo non si saprebbe più quali erano.

delete from public.approvals
 where candidate_id in (
   select c.id from public.candidates c
     join public.plans p on p.id = c.plan_id
    where p.title like 'PROVA-CLAUDE%');

delete from public.ballots
 where plan_id in (select id from public.plans where title like 'PROVA-CLAUDE%');

delete from public.candidates
 where plan_id in (select id from public.plans where title like 'PROVA-CLAUDE%');

delete from public.participants
 where plan_id in (select id from public.plans where title like 'PROVA-CLAUDE%');

delete from public.invite_uses
 where invite_link_id in (
   select l.id from public.invite_links l
     join public.plans p on p.id = l.plan_id
    where p.title like 'PROVA-CLAUDE%');

delete from public.invite_links
 where plan_id in (select id from public.plans where title like 'PROVA-CLAUDE%');

delete from public.plan_changes
 where plan_id in (select id from public.plans where title like 'PROVA-CLAUDE%');

delete from public.funnel_events
 where plan_id in (select id from public.plans where title like 'PROVA-CLAUDE%');

-- AGGIUNTO IL 28/8. Provando che log_event risponda anche a un ospite senza
-- profilo (serve per guest_joined) ho lasciato una riga con actor_id E plan_id
-- a null. Un ospite VERO non puo' produrla: quando entra in un piano ha gia'
-- un profilo, perche' glielo crea join_plan. La condizione e' stretta apposta
-- — senza il doppio null cancellerebbe eventi buoni.
delete from public.funnel_events
 where actor_id is null and plan_id is null;

delete from public.plans where title like 'PROVA-CLAUDE%';
delete from public.groups where name like 'PROVA-CLAUDE%';

-- Gruppi, commenti e spese: creati il 26/8, non c'erano nella prima versione.
delete from public.expense_shares
 where expense_id in (select e.id from public.expenses e
                        join public.plans p on p.id = e.plan_id
                       where p.title like 'PROVA-CLAUDE%');
delete from public.expenses
 where plan_id in (select id from public.plans where title like 'PROVA-CLAUDE%');
delete from public.comments
 where plan_id in (select id from public.plans where title like 'PROVA-CLAUDE%');
-- group_invite_links, non group_invites: il nome l'avevo scritto a memoria e la
-- tabella non esiste. Postgres si ferma alla prima istruzione sbagliata, quindi
-- tutto quello che viene dopo non veniva eseguito.
-- (Cade comunque da sola quando sparisce il gruppo, che e' gia' stato
-- cancellato piu' sopra: questa riga e' una cintura in piu', non la difesa.)
delete from public.group_invite_links
 where group_id in (select id from public.groups where name like 'PROVA-CLAUDE%');
delete from public.group_members
 where group_id in (select id from public.groups where name like 'PROVA-CLAUDE%');

-- Prima gli utenti auth…
-- SOLO gli anonimi: un account vero rinominato non deve poter sparire da qui.
delete from auth.users
 where id in (select a.auth_user_id from public.actors a
                join auth.users u on u.id = a.auth_user_id
               where a.display_name like 'PROVA%CLAUDE%'
                 and a.auth_user_id is not null
                 and coalesce(u.is_anonymous, false) = true);

-- …e solo dopo i profili.
delete from public.actors where display_name like 'PROVA%CLAUDE%';

-- Controllo finale: deve tornare tutti zeri.
--
-- Contava tre cose su tre tabelle. Ma il 26/8, provando il dominio nuovo, ho
-- creato righe anche in sections, places, media (i link nei piani) e
-- friendships: se una restasse indietro il controllo direbbe comunque "a
-- posto". Un controllo che guarda meno di quello che il file cancella e' un
-- controllo che rassicura e basta.
--
-- Sections, places e friendships non si cancellano da qui: se ne va la riga
-- del profilo e loro seguono. Il conteggio serve proprio a verificare che sia
-- vero, invece di darlo per scontato.
select (select count(*) from public.plans  where title like 'PROVA-CLAUDE%')        as piani_rimasti,
       (select count(*) from public.groups where name like 'PROVA-CLAUDE%')         as gruppi_rimasti,
       (select count(*) from public.actors where display_name like 'PROVA%CLAUDE%') as profili_rimasti,
       (select count(*) from public.sections s
          join public.actors a on a.id = s.actor_id
         where a.display_name like 'PROVA%CLAUDE%')                                 as sezioni_rimaste,
       (select count(*) from public.places p
          join public.actors a on a.id = p.actor_id
         where a.display_name like 'PROVA%CLAUDE%')                                 as posti_rimasti,
       (select count(*) from public.media m
          join public.plans p on p.id = m.plan_id
         where p.title like 'PROVA-CLAUDE%')                                        as allegati_rimasti;

-- Resta un utente anonimo senza profilo, dell'ultima sessione da ospite.
-- È indistinguibile da un visitatore vero che non ha ancora scritto il nome,
-- quindi non lo tocco: cancellarne uno sbagliato non si ripara.
