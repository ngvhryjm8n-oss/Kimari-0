# Comprare il dominio e collegarlo

Da fare in un'ora sola, dall'inizio alla fine. Farlo a metà rompe l'accesso con
Google e Apple: smettono di funzionare senza dire perché, e ci si mette molto a
capire quale dei quattro pezzi manca.

## 1. Comprarlo — 5 minuti

**Dove:** [Porkbun](https://porkbun.com) oppure [Namecheap](https://namecheap.com).
Circa 10-12 €/anno per un `.com`, con la privacy WHOIS **inclusa gratis**.

La privacy WHOIS non è un dettaglio: senza, nome, indirizzo di casa e telefono
del proprietario finiscono in un registro pubblico che chiunque può consultare,
e li raccolgono per spam e truffe mirate.

Da evitare GoDaddy: primo anno a 1 €, rinnovo a 25 €, e la privacy si paga a
parte.

**Cosa comprare:** `kimariapp.com` — risultava libero il 26/8/2026. Niente
trattini: al telefono «kimari trattino app» si sbaglia a scrivere.

Se vuoi anche `kimari.it` per l'Italia, prendilo e fallo puntare allo stesso
posto. Sono altri 10 € e ti toglie il rischio che lo prenda qualcun altro
mentre l'app cresce. Ma il principale resta il `.com`: un `.it` all'estero
comunica «prodotto italiano locale», e l'app deve essere worldwide.

**Al momento dell'acquisto:** rinnovo automatico ACCESO. Un dominio scaduto
non si riprende con un clic — entra in un periodo di riscatto che costa
80-100 €, e nel frattempo l'app è irraggiungibile per tutti.

## 2. Collegarlo a GitHub Pages — 10 minuti

Il sito resta dov'è: cambia solo l'indirizzo da cui si raggiunge.

Nel pannello DNS del registrar, quattro record `A` per la radice:

    A   @   185.199.108.153
    A   @   185.199.109.153
    A   @   185.199.110.153
    A   @   185.199.111.153

e uno per il `www`:

    CNAME   www   ngvhryjm8n-oss.github.io

Poi su GitHub: **Settings → Pages → Custom domain**, scrivi `kimariapp.com`,
salva, e quando compare la spunta attiva **Enforce HTTPS**. Il certificato ci
mette dai dieci minuti alle due ore: finché non c'è, "Enforce HTTPS" resta
grigio. È normale, si aspetta.

**I vecchi link non si rompono:** GitHub reindirizza da solo
`ngvhryjm8n-oss.github.io/Kimari-0/...` al dominio nuovo. Chi ha ricevuto un
invito la settimana scorsa continua a poter votare.

## 3. I tre posti che vanno aggiornati insieme — 20 minuti

Questo è il passaggio in cui si sbaglia. Ognuno dei tre custodisce un elenco di
indirizzi ammessi, e se il nuovo non c'è, l'accesso viene rifiutato.

**Supabase** → Authentication → URL Configuration
- Site URL: `https://kimariapp.com`
- Redirect URLs: aggiungi `https://kimariapp.com/**` e
  `https://kimariapp.com/app/**`
- **Non togliere subito i vecchi**: lasciali finché non hai verificato che il
  nuovo funziona. Toglierli è l'ultima cosa, non la prima.

**Google Cloud** → API e servizi → Credenziali → il tuo ID client OAuth
- Origini JavaScript autorizzate: `https://kimariapp.com`
- URI di reindirizzamento autorizzati: quello di Supabase resta com'è
  (`https://fnafzokgkbhhjircrogy.supabase.co/auth/v1/callback`) — non cambia,
  perché il ritorno passa da Supabase, non dal tuo dominio.

**Apple** → Certificates, Identifiers & Profiles → Identifiers → Services ID
`it.kimari.web` → Configure
- Domains: aggiungi `kimariapp.com`
- Return URLs: `https://fnafzokgkbhhjircrogy.supabase.co/auth/v1/callback`
  (anche qui non cambia)

Apple richiede la verifica del dominio con un file da scaricare e mettere in
`.well-known/apple-developer-domain-association.txt`. Se te lo chiede, mandami
il file e lo metto al posto giusto nel repo.

## 4. Verificare — 10 minuti

Nell'ordine, e senza saltarne uno:

1. `https://kimariapp.com` apre il sito
2. `https://kimariapp.com/app/` apre l'app
3. un vecchio link `ngvhryjm8n-oss.github.io/Kimari-0/?t=...` porta al dominio
   nuovo e il piano si vede ancora
4. entra con **Google**
5. esci ed entra con **Apple**
6. crea un piano e aprine il link da un'altra finestra, in incognito

Il punto 3 è quello che protegge le persone che hanno già un invito in chat.
Il 6 è l'unico che prova la cosa vera: che un estraneo possa votare.

## 5. Solo dopo, e solo se tutto funziona

- Togli i vecchi indirizzi dai Redirect URLs di Supabase
- Rendi privato il repository, se vuoi: a quel punto conviene spostare il sito
  su Netlify o Cloudflare Pages, che servono anche da repo privati sul piano
  gratuito. GitHub Pages no: su repo privato serve un piano a pagamento, e nel
  momento in cui lo rendi privato il sito si spegne.

## Cosa NON va toccato

Il codice. L'app calcola il proprio indirizzo da dove sta girando:

    const SITO = location.origin + location.pathname.replace(...)

quindi i link che genera diventano automaticamente `kimariapp.com`. Niente da
ricompilare, niente da ripubblicare.
