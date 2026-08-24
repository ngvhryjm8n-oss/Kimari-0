# CLAUDE.md — Kimari V0

## Cos'è
Kimari (決まり, "deciso") è il decision layer per gruppi di amici sopra WhatsApp:
l'organizzatore propone date/posti, il gruppo vota da un link web senza installare
niente, l'organizzatore conferma → "Kimari! ✅". Sviluppatore solo (Vincenzo),
budget ~0, prodotto in italiano.

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
  - ⚠️ Il SORGENTE di tutto questo non è ancora nel repo: vedi
    [supabase/README.md](supabase/README.md). Cosa il client usa davvero:
    [supabase/CONTRATTO.md](supabase/CONTRATTO.md).
- Ospiti = utenti Supabase ANONIMI (signInAnonymously) → upgrade con
  auth.linkIdentity Google senza perdere dati. Google OAuth: codice pronto nel
  client; provider da attivare su Supabase (potrebbe non esserlo ancora).
- Routing client: ?t=<token> pagina piano via invito · ?p=<id> via RLS ·
  ?new creazione · nessun parametro = home/benvenuto.
  Token salvati in localStorage (chiave kimari_tokens) per riaprire i propri piani.

## Regole non negoziabili
1. UN SOLO FILE index.html: niente build step, niente framework, vanilla JS +
   supabase-js via CDN. Deve restare trascinabile su qualsiasi hosting statico.
   (`package.json` e `test/` esistono solo per i test: non entrano nel sito.)
2. I link esistenti (?t=...) NON devono mai rompersi.
3. UI in italiano, stile iOS (palette e componenti già nel CSS del file),
   mascotte pinguino nei momenti emotivi (attesa/festa/vuoto), non sulle azioni.
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

Fa `node --check` sullo script estratto da `index.html` + smoke test jsdom con
client Supabase mockato (`window.supabase.createClient` mockato, fixture per
tabella, verifiche sulle chiamate rpc e sul DOM). `npm install` una volta sola
per avere jsdom.

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
