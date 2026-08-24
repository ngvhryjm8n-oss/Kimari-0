# Da V0 al prototipo, e da lì agli store

Decisione di Vincenzo, 24 agosto 2026: si costruisce il prototipo per davvero
(`kimari_app_prototipo.html`), poi si pubblica su Play Store e App Store.
Niente scorciatoia con V0 impacchettata.

## Una regola che questa scelta rompe

La **regola 1 di CLAUDE.md** — un solo `index.html`, niente build step — non
sopravvive. Non per la dimensione (il prototipo è già 299 KB, e si reggerebbe),
ma perché:

- le **push** richiedono un plugin nativo e un mittente lato server;
- il **login Google dentro l'app** richiede un plugin nativo (dentro una webview
  Google risponde `disallowed_useragent`);
- i **deep link** `?t=` che devono aprire l'app richiedono configurazione nativa;
- **Capacitor stesso** è un build step.

Il sito web resta un file solo — quello è ciò che rende i link `?t=` apribili da
chiunque senza installare niente, ed è il cuore del prodotto. **L'app diventa un
progetto separato che condivide lo stesso backend.** Confermato da Vincenzo e
già riflesso nella regola 1 di CLAUDE.md.

## Il salto, misurato

Il prototipo non è V0 con più schermate: introduce entità che nel database non
esistono. Ricavato leggendo il suo modello di stato.

### C'è già, va esteso

| Tabella V0 | Cosa manca per il prototipo |
|---|---|
| `actors` | sezioni private, amici, silenziati, posti salvati, `unlimited` |
| `plans` | `emoji`, `group_id`, `kind` (piano \| decisione), `allow_proposals`, `booked`, ricorrenze (`series_id`, `occurrence`) |
| `candidates` | oggi solo `when`/`where`: serve un terzo caso per le domande extra |
| `participants` | `late` (ritardo), `rsvp_at`, `joined_at` |
| `plan_changes` | già compatibile |

### Non esiste (tabelle nuove)

| Area | Tabelle |
|---|---|
| Gruppi | `groups`, `group_members` (con ruolo admin) |
| Organizzazione privata | `sections`, `group_sections` — **sono private per utente**, non le vede il gruppo |
| Relazioni | `friendships`, `mutes` |
| Domande extra / decisioni | `plan_extras` (+ candidati) |
| Proposte di cambio | `proposals`, `proposal_votes` |
| Chat | `comments` (inclusi i messaggi di sistema) |
| Media | `media` + bucket Supabase Storage |
| Spese | `expenses`, `settlements` |
| Posti salvati | `places`, `place_media` |
| Push | `devices`, `notification_prefs` |
| Monetizzazione | `entitlements` |

Sono ~16 tabelle nuove, ognuna con le sue policy RLS e le sue RPC
security-definer. **Non è una patch su V0: è una V1.**

### Due cose del prototipo che sono già giuste

- **I saldi.** `balances()` e `settleSuggestions()` distribuiscono il resto della
  divisione centesimo per centesimo e poi minimizzano il numero di rimborsi.
  L'algoritmo è corretto: va portato in SQL o in una RPC così com'è, **tenendo
  gli importi in centesimi interi**. Mai float per i soldi.
- **La separazione pubblico/privato.** Sezioni e mapping gruppo→sezione sono per
  utente. Va tenuta: è una scelta di prodotto giusta e va riflessa nelle RLS
  (nessuno deve poter leggere le sezioni altrui).

### Una cosa del prototipo che non deve mai arrivare in produzione

```js
const uid = () => Math.random().toString(36).slice(2, 8);   // riga 350
token: uid() + uid()                                        // riga 557
```

I token d'invito del prototipo sono 12 caratteri di `Math.random()`: indovinabili.
In V0 i token sono generati lato server e salvati hashati sha256. **Resta così.**

## Fasi

Ogni fase è utilizzabile da sola. L'ordine è pensato perché il lavoro bloccato
non blocchi il resto.

**Fase 0 — sbloccare**
- Export dello schema Supabase → [supabase/README.md](supabase/README.md). Serve la password del DB. **Ancora da fare.**
- `delete_my_account` — obbligatoria per Apple (5.1.1 v). **SQL scritto**: [0004_account_deletion.sql](supabase/migrations/0004_account_deletion.sql).
- Privacy policy — **bozza scritta**: [PRIVACY.md](PRIVACY.md). Da far rivedere a un avvocato, completare dove segnato, e pubblicare a un URL stabile.
- Termini di servizio — **bozza scritta**: [TERMINI.md](TERMINI.md). Stessa sorte della privacy: avvocato, poi URL pubblico.

**Fase 1 — gruppi** *(sblocca la home del prototipo)* — **SQL scritto**
[0003_groups.sql](supabase/migrations/0003_groups.sql): `groups`,
`group_members`, sezioni private, inviti di gruppo con token hashato.
I piani esistenti restano validi: `plans.group_id` è nullable, i link `?t=`
non cambiano. Da applicare dopo l'export (Fase 0) o su un progetto di prova.

**Fase 2 — il piano diventa ricco** — **SQL scritto**
[0005_extras_comments_proposals.sql](supabase/migrations/0005_extras_comments_proposals.sql):
domande extra e decisioni generiche, commenti, proposte di cambio votate dal
gruppo. Non tocca `candidates`, quindi il client V0 continua a funzionare.

**Fase 3 — media e spese** *(prima voce di costo vera)*
Supabase Storage. Il free tier è 1 GB: con 20 foto per piano si consuma in fretta.
Da valutare prima di aprirlo a tutti.

**Fase 4 — guscio app** *(prima volta che serve codice server)*
Capacitor, push (FCM + APNs, con Edge Function per inviarle), deep link `?t=`,
login Google nativo, Sign in with Apple.

**Fase 5 — store**
Play: test chiuso, 12 tester, 14 giorni. Apple: submission quando la 4.2 regge.

## Build iOS: opzioni e costi

Fisso, su ogni percorso: **Apple Developer Program 99 $/anno**. Google Play: 25 $
una tantum. Verifica i prezzi prima di decidere, cambiano.

| Opzione | Costo | Quando conviene |
|---|---|---|
| **Mac fisico** | Mac mini nuovo da ~700 €, usato M1 ~350–450 €. Una tantum | Se prevedi molte build e vuoi debuggare su simulatore iOS. Nessun costo ricorrente, nessuna configurazione di firme remote |
| **Codemagic** | 500 min/mese gratis su macOS M2, poi 0,095 $/min (M2) o 0,114 $/min (M4) | Pensato per il mobile, supporta Capacitor nativamente, gestisce firme e upload su TestFlight. Le build finiscono in circa metà tempo |
| **GitHub Actions** | 0,062 $/min su runner macOS standard. Repo privati: 2.000 min/mese inclusi, ma macOS conta ×10 → ~200 min reali | Se sei già tutto su GitHub. Più economico al minuto, ma le build sono più lente e firme e TestFlight te li configuri a mano |

Le build iOS consumano 2–5× i minuti di una build web: 500 minuti gratis di
Codemagic sono realisticamente 15–30 build al mese, che per iniziare bastano.

**Consiglio:** parti da **Codemagic sul piano gratuito**. Zero spesa iniziale,
zero hardware, e la parte fastidiosa (certificati, provisioning, upload su
TestFlight) è quella che ti risolve. Se poi le build diventano quotidiane, un
Mac mini usato si ripaga in fretta.

## Cosa blocca cosa

```
export schema ──┬─→ delete_my_account ──→ submission Apple
                └─→ ogni migrazione (fasi 1-3)

account Apple Developer ──→ Sign in with Apple ──→ submission Apple
                        └─→ build firmate iOS

12 tester reali ──→ 14 giorni di test chiuso ──→ produzione Play
```

I 14 giorni di Play e l'attesa di approvazione dell'account Apple scorrono in
parallelo allo sviluppo: vanno avviati **appena c'è qualcosa da caricare**, non
alla fine.
