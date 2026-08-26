# Kimari — dove siamo, 27 agosto 2026

Scritto per chi riprende in mano il progetto: Vincenzo dopo una pausa, o
chiunque altro. Dice cosa funziona, cosa no, e **perché** — le decisioni
contano più del codice, perché il codice si rilegge e le ragioni no.

---

## In una riga

L'app funziona, gira su **kimariapp.com**, parla cinque lingue, e **nessuno
l'ha ancora usata per organizzare qualcosa di vero**. Quest'ultima è la cosa
che manca di più.

---

## Cosa c'è, e dove

| | |
|---|---|
| sito (chi riceve un link) | `index.html`, un file solo — **non si tocca la regola 1** |
| app | `app/index.html` + `live.js` + `data.js` + `map.js` |
| traduzioni | `i18n/dizionario.js`, 540 voci · si modifica il .js, **mai** l'HTML |
| database | Supabase `fnafzokgkbhhjircrogy` · migrazioni fino alla **0021 applicate** |
| dominio | kimariapp.com (Porkbun) → GitHub Pages · vecchi link reindirizzati |

**Prima di ogni commit:** `npm test` (216 prove).
**Per pubblicare:** `npm run pubblica-main "messaggio"` — mai a mano.

---

## Cosa funziona davvero

Provato **contro la produzione**, non solo con le prove:

creare un piano · invitare con link · votare da ospite senza installare ·
confermare · annullare · gruppi e inviti · uscire · eliminare · spese e conti ·
proposte di modifica · immagine del profilo · foto dei posti · esportare i
propri dati · cinque lingue ovunque, messaggi WhatsApp compresi.

**40 azioni su 43** salvano sul database. Le tre che restano:
- `newPlace` — falso allarme, è una bozza che poi viene salvata davvero
- `toggleUnlimited` — interruttore finto, i pagamenti non esistono
- `doMerge` — **non scritto di proposito**: fondere l'account web con quello
  dell'app senza un codice via email significa che chi conosce la tua email si
  prende i tuoi piani

---

## Cosa manca

**I pagamenti.** Vincenzo ha scelto gli acquisti in-app di Apple. Conseguenza
che va ricordata: funzionano **solo dentro un'app nativa**, quindi vengono dopo
Capacitor, che viene dopo un Mac. Commissione 15% col Small Business Program
(da richiedere, non è automatico), 30% senza.

**Le notifiche funzionano** (27/8/2026). Catena verificata dall'inizio alla
fine: qualcuno vota → il database mette in coda → `pg_cron` chiama ogni minuto
→ la funzione consegna, nella lingua del dispositivo di chi riceve. Il cron
gira: `succeeded` a ogni minuto in `cron.job_run_details`.

Quello che NON è stato verificato: una notifica arrivata su un telefono vero.
La prova è stata fatta con un dispositivo finto, che ha fallito come doveva
(tre tentativi e poi basta).

**Come si attivano, e i due telefoni non fanno la stessa cosa.**

| | iPhone | Android |
|---|---|---|
| serve installare l'app? | **sì, obbligatorio** | no, bastano dal browser |
| come | Safari → Condividi → Aggiungi a Home | Chrome → ⋮ → Installa app |
| poi | aprire dall'icona → Profilo → Notifiche → permesso | Profilo → Notifiche → permesso |

Su iPhone non è una preferenza: Apple consegna le notifiche web **solo** a un
sito aggiunto alla schermata Home (da iOS 16.4). Finché resta una scheda di
Safari, l'interruttore nel Profilo non compare proprio — e sembra un difetto
dell'app mentre è una regola del telefono.

Su Android funzionano anche da scheda del browser. Installare conviene lo
stesso: l'icona resta, la sessione non si perde, e si apre a schermo pieno.

Chi è entrato **col solo nome** ha più bisogno di installarla degli altri: non
avendo Google né Apple, senza icona non ha un modo comodo per tornare. Per
questo il consiglio "aggiungi a Home" glielo mostra l'app da sola, con il testo
giusto per il suo telefono.

**L'app negli store.** `nativa/` è pronta e `CAPACITOR.md` spiega tutto.
Android si fa da Windows; **iOS richiede macOS**, e non è aggirabile.

---

## Le cose che ho imparato a mie spese, in un giorno

Sono qui perché costano ore ogni volta che si riscoprono.

**1. Uno schermo che mente è peggio di uno che si scusa.**
Il prototipo nasce per fingere: dati finti, barra di sviluppo, pulsanti che
promettono. Collegandolo al database quella finzione è diventata pericolosa —
piani inventati da cui si poteva votare e condividere. Trovati e chiusi tre
punti diversi. Se ne compare un quarto, è la stessa radice.

**2. Misurare il codice non è misurare il risultato.**
Tre volte i miei controlli hanno detto "tutto a posto" mentre l'app era mezza
italiana: guardavano quali stringhe passavano dal traduttore, non cosa
finiva sullo schermo. Lo strumento che conta è `tools/i18n-resa.mjs`, che rende
l'app e cerca l'italiano **nel DOM**. Alla prima esecuzione ha trovato quello
che tutti gli altri avevano mancato.

**3. Un controllo che grida al lupo viene ignorato.**
Ho dovuto correggere tre miei strumenti che segnalavano problemi inesistenti.
Uno strumento che sbaglia è peggio di nessuno strumento, perché lo si crede
ancora.

**4. Le prove girano contro un finto, e un finto risponde a tutto.**
Ho pubblicato un client che leggeva una colonna non ancora creata: l'app è
caduta per tutti. Ora `tools/controlla-colonne.mjs` chiede **al database vero**,
dentro lo script di pubblicazione.

**5. Due passi che dovrebbero essere uno.**
Un piano è rimasto a metà in produzione perché la creazione erano due
transazioni. Stessa forma trovata nelle proposte (0016). Se si scrivono due
chiamate di seguito, chiedersi cosa succede se la seconda non arriva.

**6. I difetti veri li ha trovati l'uso, non la lettura.**
Il link `?t=null` pronto da mandare su WhatsApp, i soldi che cambiavano quando
qualcuno cancellava l'account, l'accesso da un secondo dispositivo, l'invito al
gruppo che si perdeva: **tutti trovati usando l'app**, nessuno leggendo il
codice. E le due domande più utili della giornata le ha fatte Vincenzo
guardando lo schermo — «a che serve questo colore?», «perché è in italiano?».

**7. Un sintomo può non assomigliare per niente alla sua causa.**
Tre casi nello stesso giorno. "Non riesco a cliccare Novità" non era il tocco:
era la schermata che moriva, perché le voci "è entrato nel gruppo" non hanno un
piano e il codice leggeva `it.p.title` su tutto. Il database che rispondeva
`42501: permission denied to set parameter` non voleva più permessi: voleva la
cassaforte. E PowerShell che si lamentava di un simbolo dentro un commento
aveva in realtà un file salvato con la codifica sbagliata. In tutti e tre i
casi la prima ipotesi, quella ovvia, era quella sbagliata.

**8. Le codifiche di Windows fanno perdere più tempo dei bug.**
Blocco note salva in UTF-16, PowerShell 5.1 legge male le accentate senza
marcatore in testa, il SQL Editor riceve caratteri separati da byte nulli. Tre
volte in due ore. La difesa non è stare attenti: è non far modificare file a
mano. Lo script genera il SQL già pronto, lo legge in UTF-8 esplicito, e si
ferma se il segnaposto non è stato sostituito invece di produrre un file che
sembra giusto.

---

## La prossima cosa da fare

Non è tecnica.

**Organizzare una cena vera con quattro amici usando Kimari.** Il link su
WhatsApp funziona già, oggi, senza installare niente. Ogni difetto serio
trovato finora è venuto da lì, e nessuno da una prova.

Gli store, i pagamenti e Capacitor hanno senso quando c'è qualcuno che vuole
scaricarla. Quel qualcuno non esiste ancora — e non perché l'app sia brutta.
