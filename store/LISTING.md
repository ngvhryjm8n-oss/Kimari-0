# Testi e asset per gli store — 27 agosto 2026

Tutto quello che serve per compilare le schede di Google Play e App Store.
I testi riusano le frasi del dizionario (`i18n/dizionario.js`) dove esistono,
per restare coerenti con quello che l'app dice davvero.

## Cosa c'è in questa cartella

| file | a cosa serve | vincolo |
|---|---|---|
| `icona-512.png` | Google Play, icona | 512×512, quadrato pieno, senza trasparenza ✓ |
| `icona-1024.png` | App Store, icona | 1024×1024, quadrato pieno, senza alfa ✓ |
| `feature-graphic.png` | Google Play, grafica in evidenza | 1024×500 ✓ |
| `screenshot/01-vota-*.png` | il cuore del prodotto: votare da un link | 1374×2919 |
| `screenshot/02-benvenuto-*.png` | primo avvio | 1374×2919 |
| `screenshot/03-sito-it.png` | pagina pubblica | 1374×2919 |
| `lavorazione/` | sorgenti e passaggi intermedi | non si carica |

**L'icona è vettoriale.** `icona.svg` è ricostruita dalla 192px con
`lavorazione/vettorizza.mjs` (quantizza i sei colori piatti, traccia i
contorni, semplifica, smussa): le 512 e 1024 sono rese da lì e restano
nitide a qualunque dimensione. Se l'icona dell'app cambia, si rilancia
lo script e si riesportano.

**Screenshot:** presi dalla produzione con il piano di prova PROVA-CLAUDE.
Prima di caricarli negli store andranno rifatti con un piano dal nome
presentabile ("Cena da Gino 🍕") — il flusso è identico, cambia solo il titolo.
Comando usato (Edge headless, tema chiaro, 448 CSS ×3):
`msedge --headless --screenshot=out.png --window-size=468,973
--force-device-scale-factor=3 --hide-scrollbars
--blink-settings=preferredColorScheme=1 --virtual-time-budget=15000 --lang=it URL`
poi ritaglio simmetrico dei margini.

---

## Google Play

**Titolo** (max 30): `Kimari — decidete insieme` (25)

**Descrizione breve** (max 80):

| | |
|---|---|
| it | Il gruppo vota dal link, tu confermi. Date, posti e spese decisi insieme. |
| en | The group votes from a link, you confirm. Dates, places and costs, together. |
| es | El grupo vota desde el enlace, tú confirmas. Fechas, sitios y gastos juntos. |
| de | Die Gruppe stimmt per Link ab, du bestätigst. Termine, Orte, Kosten gemeinsam. |
| ja | みんながリンクから投票し、あなたが決めます。日程も場所も割り勘も一緒に。 |
| fr | Le groupe vote depuis un lien, tu confirmes. Dates, lieux et frais, ensemble. |

**Descrizione completa** (max 4000 — versione italiana; le altre si traducono
da questa quando serve):

> Tutti hanno un'opinione. Kimari la trasforma in un piano.
>
> Organizzare una cena, un weekend o un calcetto su WhatsApp significa
> cinquanta messaggi e nessuna decisione. Con Kimari proponi due o tre date e
> posti, mandi un link sul gruppo, e ognuno vota — dal browser, senza
> installare niente e senza registrarsi. Quando hanno risposto tutti, confermi:
> Kimari! ✅
>
> • Chi riceve il link vota così com'è: niente app, niente account
> • Date e posti a voto multiplo: ognuno segna tutte le opzioni che gli vanno
> • Gruppi per gli amici di sempre: famiglia, colleghi, la compagnia del mare
> • Spese e conti: chi ha pagato cosa, chi deve quanto, senza fogli di calcolo
> • Proposte di modifica: se il piano cambia, il gruppo lo vede e approva
> • Notifiche quando qualcuno vota o il piano si conferma
> • In sei lingue, messaggi WhatsApp compresi
>
> Kimari (決まり, "deciso") fa una cosa sola: trasforma le opinioni del gruppo
> in una decisione. Il resto — le chiacchiere — resta su WhatsApp, dov'è giusto
> che stia.

**Grafica in evidenza:** `feature-graphic.png` (1024×500)

**Categoria:** Social / Lifestyle · **Contenuti:** per tutti, ma i Termini
richiedono 16+ (dichiararlo nel questionario contenuti)

## App Store

**Nome** (max 30): `Kimari — decidete insieme` (25)
**Sottotitolo** (max 30):

| | |
|---|---|
| it | Il gruppo vota, tu confermi (27) |
| en | The group votes, you confirm (28) |
| es | El grupo vota, tú confirmas (27) |
| de | Die Gruppe wählt, du bestätigst (30) |
| ja | みんなで投票、あなたが決定 (14) |
| fr | Le groupe vote, tu confirmes (28) |

**Parole chiave** (max 100, separate da virgola, senza spazi dopo la virgola):

`it`: `piani,gruppo,votare,cena,weekend,amici,date,sondaggio,doodle,organizzare,spese,conti,calcetto`

**Testo promozionale** (max 170): riusare la descrizione breve di Play.

**Descrizione:** la stessa di Google Play.

**Nota revisione (regola 4.2):** vedi CAPACITOR.md — prima di sottomettere
servono le funzioni native (push native, Universal Links, Sign in with Apple
nativo), altrimenti il rischio di rifiuto come "sito impacchettato" è concreto.

---

## Cosa resta da fare a mano

1. Account Google Play Console (25 € una tantum) — play.google.com/console
2. Questionari di Play: privacy (già scritta: kimariapp.com/privacy), data
   safety, contenuti
3. Rifare gli screenshot con un piano dal titolo presentabile
4. (App Store) preparare gli screenshot 6.7" e 5.5" — si fanno con lo
   stesso comando cambiando window-size
