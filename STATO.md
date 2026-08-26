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
| database | Supabase `fnafzokgkbhhjircrogy` · migrazioni fino alla **0020 applicate** |
| dominio | kimariapp.com (Porkbun) → GitHub Pages · vecchi link reindirizzati |

**Prima di ogni commit:** `npm test` (209 prove).
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

**Le notifiche non partono ancora.** C'è tutto — coda, quattro momenti scelti,
testi in cinque lingue, funzione che consegna. Manca distribuire le due
funzioni su Supabase e pianificare `pg_cron`. Le istruzioni stanno in fondo a
`supabase/functions/svuota-coda/index.ts`.

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

---

## La prossima cosa da fare

Non è tecnica.

**Organizzare una cena vera con quattro amici usando Kimari.** Il link su
WhatsApp funziona già, oggi, senza installare niente. Ogni difetto serio
trovato finora è venuto da lì, e nessuno da una prova.

Gli store, i pagamenti e Capacitor hanno senso quando c'è qualcuno che vuole
scaricarla. Quel qualcuno non esiste ancora — e non perché l'app sia brutta.
