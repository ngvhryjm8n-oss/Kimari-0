# Kimari — Roadmap V1 (da prototipo a prodotto lanciabile)

Questo documento unisce la review esterna e l'analisi successiva. Va usato DOPO
kimari-work-order-fix.md. Lavorare per fasi, un blocco per sessione, commit
separati.

**Principio congelato:** il perimetro funzionale di V1 è quello attuale. Nessuna
feature nuova, nessuna rimossa. Ogni ora di lavoro va in: bug → backend →
sicurezza → UX polish → landing → analytics → lancio.

**Regola di prodotto trasversale:** data e luogo decidono lo stato del piano;
RSVP, domande extra, proposte, commenti, spese, foto vivono dentro il piano e
restano interattivi in ogni stato.

## Cosa esiste già (non ricostruire)

La V0 su Supabase copre già: piani, opzioni candidate, voti, conferma, RSVP,
storico versioni, auth anonima ospiti. Il lavoro P0 è estendere e blindare, non
ripartire da zero.

## P0 — Senza questo non si lancia

**1. Persistenza completa server-side.** Portare su Supabase tutto ciò che oggi
vive solo nel client: utenti, gruppi, membri, amici, decisioni, commenti, spese e
pagamenti registrati, allegati, foto, posti salvati, notifiche in-app (Novità),
stato subscription ed Event Pass, impostazioni. Test di accettazione: chiudo
Kimari → cambio telefono → login → è tutto ancora lì.

**2. Giro del link ospite blindato.** È la spina dorsale del prodotto. Deve
funzionare sempre: crea piano → condividi su WhatsApp → l'ospite apre da Safari
senza app → vede il piano → mette il nome → vota → chiude. Riapre lo stesso link
ore dopo → viene riconosciuto → vede il suo voto. Se poi crea un account, i piani
votati da ospite gli vengono collegati (merge, già nel work order fix 4).

**3. Un solo dominio, link corti.** Standardizzare tutto su kimariapp.com:
`/i/{token}` piano, `/g/{token}` gruppo, `/u/{token}` invito persona. Nessun
dominio o URL vecchio residuo nel codice. Token lunghi e non indovinabili
(random crittografico, mai sequenziali).

**4. Preview WhatsApp dinamiche — richiede lavoro server-side.** Stato attuale:
og:title e descrizione statici, immagine icona 192px, twitter:card "summary".
Vincolo tecnico: la pagina è renderizzata client-side, e il crawler di WhatsApp
NON esegue JavaScript — quindi le preview per-piano sono impossibili senza
servire i meta tag lato server. Serve una edge function (o prerender) che per
ogni `/i/{token}` risponda con meta tag dedicati.

Preview piano in votazione: titolo "🐧 {nome piano} — Kimari", descrizione
"Sabato o domenica? Vota senza scaricare l'app." Preview piano confermato:
"🐧 {nome piano} è deciso — Sabato 20:30 · Sushi Yuki. Dimmi se ci sei."
Immagine og:image 1200×630 dedicata, card summary_large_image. Questo punto ha
impatto diretto sul click-through di ogni condivisione: trattarlo come
interfaccia, non come dettaglio.

**5. Sicurezza — mai fidarsi del client.** Permessi validati da RLS/policy
Supabase su ogni tabella: un membro non può vedere gruppi estranei modificando
l'URL; admin verificato dal backend, non dall'interfaccia; allegati e foto
accessibili solo a chi accede al piano; link gruppo revocabile (rigenerabile
dall'admin), link piano revocabile; rate limiting sulle edge functions.

**6. Login.** Solo "Continua con Apple" e "Continua con Google", identici in app
e pagina ospite (già nel work order fix 4). Niente username/password. Nota: Sign
in with Apple è obbligatorio su iOS se offri login di terzi, quindi è anche
compliance.

## P1 — Farlo sembrare un prodotto vero (nessuna feature nuova, solo rifinitura)

**Home — gerarchia visiva.** Struttura invariata (calendario → agenda → gruppi).
Lavorare solo sulla leggibilità: a colpo d'occhio devo distinguere 🟠 da
decidere, 🟢 confermato, ⚪ futuro, ⚫ passato.

**Il momento Kimari!** È il payoff del prodotto: mascotte che festeggia,
micro-animazione, haptic feedback, schermata "Kimari! — Sabato 20:30, Sushi
Yuki". Riservato ai piani passati da votazione chiusa; i piani fissi nascono
decisi senza fanfara.

**Messaggio di ricondivisione del risultato.** Gli ospiti non hanno push:
WhatsApp è il layer di notifica di V1. Il bottone "condividi il risultato" dopo
la conferma va progettato con la stessa cura del link d'invito — genera un
messaggio pronto ("🐧 {piano} è deciso — {data} · {luogo}. Dimmi se ci sei.")
con la preview confermata del punto P0.4.

**Micro-copy.** "Si chiude" → "Vota entro". Rivedere le etichette dove non
descrivono l'azione.

**Presentazione della monetizzazione** (stesse feature, framing diverso). Non
"paga per avere più MB" ma benefici: Kimari Unlimited — "Per chi organizza
spesso": più foto, più allegati, posti illimitati, calendario sincronizzato,
ricordi conservati (2,99 €/mese · 19,99 €/anno). Event Pass — "Tutto Unlimited
per un solo grande evento": matrimonio, vacanza, festa, laurea (4,99 € una
tantum). Regola chiave da mantenere: paga l'organizzatore, beneficia tutto il
gruppo.

## Pre-lancio

**Landing page.** Deve far capire Kimari in 5 secondi, non sembrare corporate.
Hero: 🐧 Kimari — "Everyone has an opinion. Kimari turns it into a plan." + CTA
"Create a plan" + "Friends can join and vote without installing anything." Poi i
3 passi (Propose → Everyone votes → Kimari!) e il Before/After: "287 messaggi
WhatsApp" contro la card del piano deciso con RSVP, allegato, spese e foto —
tutto in un piano.

**Analytics (obbligatorie al lancio).** Eventi minimi: signup, plan_created,
share_clicked, invite_link_opened, guest_joined, vote_submitted, plan_confirmed,
rsvp_submitted, group_created, second_plan_created, guest_to_account,
unlimited_viewed, subscription_started, event_pass_started.

Metrica numero 1: **Confirmed Plan Rate** = piani confermati / piani creati —
misurata soprattutto sui piani condivisi (almeno un'apertura esterna), perché un
piano votato solo dal creatore è un piano morto. Metrica virale: per ogni
organizzatore, quanti ospiti entrano e quanti ospiti diventano a loro volta
organizzatori.

## Decisioni aperte (spettano a Vincenzo, non a Claude Code)

1. **Acquisti su iOS:** se Unlimited/Event Pass si comprano dentro l'app, Apple
   impone IAP con commissione — decidere IAP vs acquisto web PRIMA dello store,
   perché tocca prezzi e setup RevenueCat.
2. **App Store:** la wrapper Capacitor rischia il rifiuto per "minimum
   functionality" (linea guida 4.2) se è solo il sito impacchettato — push
   native, share nativo e integrazione calendario aiutano a giustificarla.
3. **Lancio a stadi:** Stadio 1 = 10 gruppi veri (famiglia, amici, calcetto,
   vacanza) per trovare bug e punti incomprensibili — può partire appena link e
   persistenza sono solidi, senza aspettare landing/store/analytics complete.
   Stadio 2 = 50 gruppi senza spiegare nulla, solo kimariapp.com, guardando
   quanti creano/condividono/votano/confermano/tornano. Stadio 3 = pubblico
   (TikTok, Reels, community; Product Hunt solo come visibilità secondaria).
   L'ad migliore è la chat: "Quando andiamo?" … 243 messaggi dopo … 🐧 Kimari:
   Sabato 20:30 ✅ Sushi Yuki ✅ 6 persone ✅.

## Ordine di esecuzione suggerito

1. kimari-work-order-fix.md (bug del test, identità in testa)
2. P0.1 persistenza + P0.5 sicurezza (vanno insieme: ogni tabella nuova nasce
   con le sue policy)
3. P0.3 link corti + P0.2 giro ospite
4. P0.4 preview dinamiche (edge function meta tag)
5. P1 (gerarchia home, momento Kimari!, ricondivisione, micro-copy, framing
   prezzi)
6. Landing + analytics
7. Stadio 1 con 10 gruppi veri

A ogni fase: test di regressione sul giro completo crea → condividi → vota da
ospite → conferma → ricondividi. È l'unico flusso che deve essere perfetto;
tutto il resto può permettersi di essere solo buono.

---

## Verifica contro il codice — 28 agosto 2026

Questa parte non è nella roadmap originale: è il confronto fra quello che il
documento chiede e quello che il repo ha davvero, fatto prima di eseguire.
Serve a non rifare il fatto e a non dare per fatto il mancante.
