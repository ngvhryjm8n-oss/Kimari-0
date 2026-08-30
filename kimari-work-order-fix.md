# Kimari — Work order: fix dal primo test reale

Contesto: test con utenti reali su kimariapp.com/app ha fatto emergere 4 problemi. Perimetro funzionale congelato: nessuna feature nuova oltre a quanto descritto qui. Prima di modificare, leggi il codice coinvolto e verifica le root cause ipotizzate: se la causa reale è diversa, spiegala prima di implementare.

## Regola di prodotto (guida tutti i fix)

Data e luogo decidono lo STATO del piano. Tutto il resto — RSVP, domande extra, proposte, commenti — vive DENTRO il piano e resta interattivo indipendentemente dallo stato.

## Fix 1 — Piano con data e luogo fissi

Sintomo: piano dove tutto è già deciso → nessuna opzione da spuntare → impossibile confermare.

Comportamento voluto:
- Se data E luogo sono entrambi fissi alla creazione, il piano nasce direttamente "In programma": entra subito in calendario, nessun bottone Conferma per l'organizzatore.
- Il bottone Conferma esiste solo se almeno uno tra data/luogo è ai voti.
- Piani misti (es. data fissa + luogo ai voti): la conferma copre SOLO il campo aperto. Probabile root cause del bug: il codice si aspetta entrambi i campi come candidati da spuntare.
- Dentro un piano fisso restano attivi: RSVP (sempre), domande extra tipo "portiamo il regalo?" (ognuna con la sua chiusura: deadline oppure chiusura manuale dell'organizzatore), proposte di modifica se abilitate dall'organizzatore, con il flag "ho prenotato" che blocca il cambio automatico.
- La schermata/animazione "Kimari!" con festeggiamento è riservata ai piani passati da una votazione chiusa. I piani fissi nascono decisi, senza fanfara.

## Fix 2 — Conferma non aggiorna calendario né pagina

Sintomo: dopo la conferma appare il popup Kimari! ma il piano non compare in calendario e la pagina non passa alla vista riepilogo del piano confermato.

Root cause probabile: data/luogo vincenti restano solo nelle opzioni candidate e non vengono scritti nei campi canonici del piano che il calendario legge.

Comportamento voluto:
- Alla conferma: scrivere data/luogo vincenti nei campi canonici del piano e aggiornare lo stato a confermato, nella stessa operazione (niente stati intermedi incoerenti).
- Dopo il popup/animazione: navigare automaticamente alla vista piano confermato (riepilogo), senza ricarica manuale.
- Il calendario deve mostrare il piano subito dopo la conferma.

## Fix 3 — Notifiche (SOLO documentare, non implementare ora)

Su iOS le push web funzionano solo con PWA installata in schermata Home (iOS 16.4+), mai da tab Safari: non è un bug nostro. Per la V1 web "Novità" resta il centro notifiche in-app. Non spendere tempo sulle push ora: aggiungi solo una nota nel codice o nel README perché non ci si torni per sbaglio.

## Fix 4 — Identità ospite e login (PRIORITÀ MASSIMA)

Sintomi dal test: utente già loggato con Apple apre un link invito da Safari → non viene riconosciuto; la pagina ospite offre solo Google mentre l'app offre anche Apple; l'ospite può scegliere dalla lista il nome di un membro esistente (es. "Liviana") e impersonarlo; l'utente ha dovuto votare come anonimo.

Comportamento voluto:
1. La pagina ospite controlla PRIMA di tutto se esiste una sessione attiva: se sì, mostra "Stai votando come [nome]" con azione secondaria "Non sei tu? Cambia".
2. Opzioni di accesso identiche ovunque: Apple + Google sia nell'app che nella pagina ospite, più "continua solo col nome".
3. Il campo nome crea SEMPRE una nuova identità ospite legata al dispositivo (auth anonima Supabase). MAI mostrare o permettere la scelta di membri esistenti dalla lista: rimuovere qualsiasi UI di "claim" via nome.
4. Collegarsi a un membro esistente è possibile SOLO facendo login con l'account di quel membro.
5. Merge: se un ospite anonimo con voti/RSVP fa login sullo stesso dispositivo, proporre "Vuoi collegare i tuoi voti a questo account?" → migrare voti e RSVP all'utente loggato.
6. Tutto validato lato server (RLS/policy Supabase), mai solo nell'interfaccia.

## Test di verifica (da eseguire a fine lavoro)

1. Crea piano con data+luogo fissi → nasce In programma, compare in calendario, niente bottone Conferma; RSVP e domanda extra funzionano.
2. Crea piano con data fissa + 2 luoghi ai voti → vota → conferma → campi canonici aggiornati, redirect alla vista confermata, piano in calendario.
3. Apri un link invito da un browser dove sei già loggato → vieni riconosciuto senza re-login.
4. Apri il link da un browser pulito → le uniche opzioni sono: Apple / Google / nome nuovo. Nessuna lista di membri esistenti.
5. Vota come anonimo, poi fai login sullo stesso dispositivo → proposta di merge → voti collegati all'account.
6. Prova a impersonare un membro esistente scrivendone il nome → deve risultare impossibile (nasce comunque un'identità nuova).

## Ordine di lavoro

Fix 4 → Fix 1 e 2 insieme (rompono il giro crea→conferma) → Fix 3 (solo nota). Un commit separato per ogni fix. Se una root cause ipotizzata risulta sbagliata, spiega quella reale prima di implementare.
