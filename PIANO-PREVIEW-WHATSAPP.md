# Le preview di WhatsApp — cosa costa, cosa rende, cosa rischia

Piano richiesto il 30/8/2026. **Non è stato implementato niente**: questo
documento serve a decidere, non descrive lavoro fatto.

Riguarda il punto **P0.4 della ROADMAP-V1**, che il documento stesso chiama
il punto con più impatto sul click-through di ogni condivisione.

---

## Il problema, in una riga

Quando mandi un link Kimari su WhatsApp, l'anteprima dice sempre la stessa
cosa — «Kimari», l'icona, la descrizione generica — invece di dire *«🐧 Cena
sabato — vota senza scaricare l'app»*.

**Perché:** il crawler di WhatsApp scarica la pagina e legge i meta tag **senza
eseguire JavaScript**. Il nostro `index.html` è un file statico che si riempie
nel browser: quando il crawler lo guarda, il piano non c'è ancora. Non è
sistemabile lato client — nessun trucco, nessuna libreria.

Serve che **qualcuno risponda al posto nostro** quando è un crawler a bussare.

---

## Perché non basta GitHub Pages

GitHub Pages serve file e basta: non sa distinguere un crawler da una persona,
e non sa costruire una pagina diversa per ogni token. Non ha alcuna forma di
codice lato server.

Da qui le tre strade.

---

## Le tre strade

### A. Cloudflare Pages + un Worker — **la strada che consiglio**

Il sito resta identico: gli stessi file, lo stesso `index.html` unico. Davanti
ci si mette un pezzetto di codice che gira sul bordo della rete (un *Worker*) e
fa una cosa sola: **se chi bussa è un crawler, gli risponde con i meta tag di
quel piano; se è una persona, lo lascia passare al file di sempre.**

```
persona  →  index.html (identico a oggi)
crawler  →  meta tag del piano, presi da preview_invite
```

**Cosa costa**
| | |
|---|---|
| soldi | **0 €**: il piano gratuito di Cloudflare Pages copre largamente il traffico di Kimari (100.000 richieste al giorno) |
| lavoro | mezza giornata la prima volta, poi zero |
| rischio di rottura | il DNS cambia: c'è una finestra in cui il sito può essere irraggiungibile per qualche minuto |

**Cosa NON cambia, e conta**
- La **regola 1** resta in piedi: `index.html` continua a essere un file solo,
  senza build step, trascinabile su qualsiasi hosting statico. Il Worker è un
  pezzo *davanti*, non dentro: se lo si spegne, il sito torna esattamente com'è
  oggi.
- La **regola 2** resta in piedi: i link `?t=` esistenti continuano a
  funzionare identici. Nessun link mandato su WhatsApp si rompe.
- L'app in `app/` non viene toccata.

**Cosa cambia davvero**
- Il dominio smette di puntare a GitHub Pages e punta a Cloudflare. Il repo
  resta su GitHub e la pubblicazione resta `npm run pubblica-main`.
- Va rifatta la verifica del dominio per l'accesso con Apple (il `.well-known`
  deve continuare a rispondere: **è la cosa che si rompe più facilmente**, ed è
  scritta in DOMINIO.md — «farlo a metà rompe l'accesso con Google e Apple»).
- `assetlinks.json` deve continuare a rispondere 200, o i deep link Android
  smettono di aprire l'app.

### B. Restare su GitHub Pages

Zero lavoro, zero rischio. Le anteprime restano generiche per sempre.

Da non sottovalutare: **l'anteprima generica non è rotta**, mostra il logo e il
nome. Chi riceve il messaggio legge comunque il testo che l'organizzatore ha
scritto («🍕 Cena sabato — ai voti. Vota qui 👉»), che è già scritto bene e già
tradotto in sei lingue. Il guadagno di A è reale ma è un **miglioramento**, non
una riparazione.

### C. Una edge function Supabase con un dominio diverso

Si potrebbe far servire i link da un secondo indirizzo che punta a una funzione
Supabase. **Sconsigliata**: due domini vogliono dire due verifiche Apple, due
`assetlinks`, e link vecchi e nuovi di forma diversa — cioè la regola 2 messa a
rischio per risparmiare mezza giornata.

---

## La domanda che va risolta prima: i token

CLAUDE.md, nel backlog, lascia una nota che vale più della feature:

> *attenzione: farebbe passare i token d'invito per un terzo*

L'ho verificata, e la conclusione è meno drammatica di come suona — ma va detta
per intero.

**Il token esce già oggi.** Quando mandi `kimariapp.com/?t=abc` su WhatsApp,
quel token è nel messaggio: sta sui server di Meta, viene scansionato dal loro
crawler, e finisce nei backup dei telefoni di tutti quelli in chat. Non è la
preview a farlo uscire.

**Cosa cambierebbe con A.** Il token passerebbe anche per Cloudflare, che
diventerebbe un terzo capace di vederlo. Contro: uno in più. A favore:
Cloudflare è già davanti a una fetta enorme del web, e il token da solo dà
esattamente quello che dà a chiunque riceva il messaggio — la possibilità di
votare in un piano fra amici.

**Cosa NON deve fare il Worker**, e va scritto prima di scriverlo:
- non registrare i token nei log (Cloudflare logga gli URL: va disattivato o
  filtrato)
- non mettere il token nel titolo o nella descrizione dell'anteprima
- non rispondere ai crawler con nulla che non sia già visibile a chi apre il
  link: titolo, data, luogo. **Mai i nomi dei partecipanti** — è la stessa
  fuga che la 0023 ha appena chiuso togliendo l'elenco dall'anteprima.

---

## Cosa vedrebbe chi riceve il messaggio

**Piano ai voti**
> 🐧 **Cena sabato — Kimari**
> Sabato o domenica? Vota senza scaricare l'app.

**Piano confermato**
> 🐧 **Cena sabato è deciso — Kimari**
> Sabato 20:30 · Sushi Yuki. Dimmi se ci sei.

Serve anche un'immagine 1200×630 (oggi è l'icona 192px, che WhatsApp mostra
minuscola in un angolo). Si genera con lo stesso metodo della feature graphic
già fatta per gli store — `store/feature-graphic.png` è nata così.

---

## La mia raccomandazione

**Non adesso.** Farei A, ma dopo lo Stadio 1 della roadmap — i 10 gruppi veri.

Il motivo: la preview migliora il click-through di link che *qualcuno deve
ancora mandare*. Finché nessuno ha organizzato una cena vera con Kimari, si
starebbe ottimizzando la conversione di un traffico che non esiste. È la stessa
frase con cui si chiude STATO.md, e vale anche qui.

E c'è un rischio asimmetrico: il cambio di DNS può rompere l'accesso con Apple
e i deep link appena messi in piedi. Rompere qualcosa che funziona per
migliorare qualcosa che nessuno sta ancora usando è il verso sbagliato.

**Quando rifarei il conto:** appena un piano viene condiviso e i numeri di
`invite_opened` diventano interessanti. A quel punto `supabase/tools/metriche.sql`
dice già quanti aprono il link, e si potrà misurare se la preview li aumenta —
invece di sperarlo.
