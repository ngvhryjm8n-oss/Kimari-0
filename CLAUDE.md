# CLAUDE.md — Kimari V0

## Cos'è
Kimari (決まり, "deciso") è il decision layer per gruppi di amici sopra WhatsApp:
l'organizzatore propone date/posti, il gruppo vota da un link web senza installare
niente, l'organizzatore conferma → "Kimari! ✅". Sviluppatore solo (Vincenzo),
budget ~0, prodotto in italiano.

## Da leggere per primo

**[STATO.md](STATO.md)** — dove siamo davvero al 27/8/2026: cosa funziona, cosa
manca, e le otto cose imparate a caro prezzo. Questo file qui sotto descrive V0
ed e' in parte superato: il dominio adesso e' **kimariapp.com**, le migrazioni
sono applicate fino alla **0021**, e l'app parla cinque lingue.

Per pubblicare: `npm run pubblica-main "messaggio"`. Mai a mano — copiare i
file a mano ha gia' mandato online un index.html nuovo con un live.js vecchio.

## Stato attuale — FUNZIONA IN PRODUZIONE
- Sito: GitHub Pages da questo repo (branch main), file UNICO `index.html`.
  URL: https://ngvhryjm8n-oss.github.io/Kimari-0/
- Backend: Supabase (Frankfurt), progetto fnafzokgkbhhjircrogy.
  - URL: https://fnafzokgkbhhjircrogy.supabase.co
  - chiave publishable (pubblica, ok nel client):
    sb_publishable_f-CLx2j5Ht-ydkoh7iC-qQ_iacbBYW_
- Migrazioni 0001 e 0002 GIÀ applicate. Architettura DB:
  - RLS = SOLA LETTURA (participant-scoped); TUTTE le scritture via RPC
    security definer. MAI policy di scrittura, MAI service_role nel client.
  - Tabelle: actors, plans, candidates, participants, ballots, approvals,
    invite_links (token hashati sha256), invite_uses, plan_changes, funnel_events.
  - RPC esistenti: ensure_actor, set_my_email, create_plan, preview_invite (anche
    anon), join_plan (con claim "Sei uno di questi?"), submit_ballot (approval
    voting, none_ok), add_candidates, confirm_plan, update_plan_field,
    cancel_plan, set_rsvp, remove_participant, revoke_invite_links,
    create_invite_link, log_event. Viste: v_candidate_results, v_missing_voters.
  - Le FUNZIONI sono nel repo, ESTRATTE dal database il 24/8/2026 e da NON
    riapplicare: [supabase/schema/](supabase/schema/). Se le cambi dalla dashboard,
    riesporta con [supabase/tools/dump_schema.sql](supabase/tools/dump_schema.sql),
    altrimenti divergono e `npm run test:rpc` mente.
    Mancano ancora tabelle, policy, vincoli e indici (query 2-5 dello stesso file).
    Cosa il client usa davvero: [supabase/CONTRATTO.md](supabase/CONTRATTO.md).
  - Vincolo che sta SOLO nel database: massimo 5 opzioni per campo
    (trigger `enforce_max_candidates`). `plan_field` è un enum, non text.
- Ospiti = utenti Supabase ANONIMI (signInAnonymously) → upgrade con
  auth.linkIdentity senza perdere dati. Serve "Manual linking" attivo su
  Supabase, altrimenti chi vota da ospite e poi entra con Google perde i piani.
- Accesso: Google e Apple ATTIVI (25/8/2026), più gli utenti anonimi.
  ⚠️ Il client secret di Apple SCADE OGNI 6 MESI: si rigenera con
  `node tools/apple-secret.mjs ..\segreti\AuthKey_*.p8 TEAM_ID KEY_ID it.kimari.web`
  e si reincolla in Supabase. Quando scade l'accesso con Apple smette senza
  dire perché. Chiave e identificativi stanno in D:\Kimari\segreti (fuori dal
  repo).
  Identificativi Apple: App ID it.kimari.app · Services ID it.kimari.web.
  Nella lista "Client IDs" di Supabase il Services ID va PRIMA del Bundle ID,
  altrimenti Apple rifiuta il login dal browser.
- Routing client: ?t=<token> pagina piano via invito · ?p=<id> via RLS ·
  ?new creazione · nessun parametro = home/benvenuto.
  Token salvati in localStorage (chiave kimari_tokens) per riaprire i propri piani.

## Regole non negoziabili
1. IL SITO resta UN SOLO FILE index.html: niente build step, niente framework,
   vanilla JS + supabase-js via CDN, trascinabile su qualsiasi hosting statico.
   È ciò che rende i link `?t=` apribili da chiunque senza installare niente,
   ed è il cuore del prodotto: non si tocca.
   (`package.json` e `test/` esistono solo per i test: non entrano nel sito.)
   L'APP nativa (Capacitor, push, login Google nativo, deep link) è un progetto
   separato sullo stesso backend, e lì il build step c'è. Vedi PIANO_V1.md.
2. I link esistenti (?t=...) NON devono mai rompersi.
3. UI in CINQUE LINGUE — italiano, inglese, spagnolo, tedesco, giapponese —
   scelte da navigator.language, senza selettore: dentro Capacitor è la lingua
   del telefono. Le stringhe stanno in i18n/dizionario.js, con l'ITALIANO come
   chiave: t('Crea un piano'). Se una traduzione manca esce l'italiano, mai una
   chiave a video. Il sito è un file solo, quindi il dizionario ci viene
   iniettato da `node tools/genera-i18n.mjs` — si modifica il .js, non l'HTML.
   Stile iOS (palette e componenti già nel CSS), mascotte pinguino nei momenti
   emotivi (attesa/festa/vuoto), non sulle azioni.
4. Date formattate con toLocaleString del dispositivo (mai stringhe a mano).
5. Errori sempre "parlanti": mostrare il dettaglio vero di Supabase, mai
   messaggi generici.
6. Niente nuove feature fuori backlog senza chiedere: il progetto è gated
   (10 gruppi veri prima di espandere). In dubbio: meno, non di più.
7. Asset (icona/mascotte) sono base64 inline nel file: non toccarli, non
   sostituirli con URL esterni.
8. supabase-js va caricato da una versione ESATTA con `integrity` (SRI).
   Mai tornare al tag flottante `@2`: cambia sotto i piedi senza avviso e
   diversi utenti finiscono su build diverse. Per aggiornarlo: cambia il
   numero, riscarica il file, ricalcola l'hash, provalo.

## Test
Prima di ogni commit:

```bash
npm test
```

Quattro gruppi: `test:site` (node --check sullo script estratto da index.html
+ smoke jsdom con client Supabase mockato), `test:map` (traduzione database →
forme del prototipo, funzioni pure), `test:rpc` (i nomi dei parametri che il
client passa, confrontati con le firme vere in supabase/), `test:live`
(l'aggancio del prototipo, con data.js sostituito da un finto).
`npm install` una volta sola per avere jsdom.

Sul database ci sono anche `supabase/tests/*.sql`, da incollare nel SQL Editor:
provano i corpi plpgsql, che nessun parser può vedere.

Chiedi a Vincenzo il via prima di push su main (main = produzione).

## Backlog (in ordine, solo su richiesta)
1. Realtime sui risultati (supabase channel su ballots) per il cruscotto organizer
2. Pagina piano: meta tag OG per l'anteprima WhatsApp (richiede edge function
   o prerender — discutere approccio; attenzione: farebbe passare i token
   d'invito per un terzo, e rompe la regola 1)
3. Reminder "sollecita chi manca" via WhatsApp share precompilato
4. Bottone Apple Sign-In (solo quando l'account Apple Developer è attivo)
5. Capacitor + TestFlight (seguire GUIDA_RILASCIO_APP.md, in possesso di Vincenzo)

## Metriche (SQL Editor Supabase)
Gate dei 10 gruppi: organizer con ≥2 piani entro 30 giorni; funnel
invite_opened → vote_submitted → plan_confirmed in funnel_events.
