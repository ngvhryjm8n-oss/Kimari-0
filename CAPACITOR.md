# Da app web ad app negli store

Due strade diverse, e conviene saperlo prima di cominciare:

| | Android | iPhone |
|---|---|---|
| si può da questo PC Windows | **sì** | **no** |
| cosa serve | Android Studio (~8 GB) | un Mac, o una macchina macOS in affitto |
| account sviluppatore | 25 € una volta sola | 99 €/anno (già pagato) |
| revisione | poche ore | 1-3 giorni, e può rifiutare |

**Compilare per iOS richiede macOS.** Non è una scelta di Apple aggirabile con
un trucco: gli strumenti esistono solo per Mac. Sotto c'è la strada del cloud,
che funziona davvero, ma è la parte lunga.

---

## Android — si fa oggi, da qui

### 1. Gli strumenti (una volta sola, ~30 minuti di download)

Installa **Android Studio** da developer.android.com/studio. Porta con sé il
JDK: non serve installare Java a parte.

Al primo avvio ti fa scaricare l'SDK: accetta i valori proposti.

### 2. Il progetto

Dalla cartella del repo:

```bash
cd nativa
npm install @capacitor/core@latest @capacitor/cli@latest @capacitor/android@latest
npm run prepara
npx cap add android
```

`npm run prepara` copia i file da `app/` dentro `nativa/www/`. **Non modificare
mai `nativa/www/` a mano**: viene rigenerata ogni volta, e le modifiche
andrebbero perse senza dire niente.

### 2 bis. L'icona e lo splash

Senza questo passo l'APK esce con l'icona di default di Capacitor:

```bash
npx @capacitor/assets generate --android
```

Legge `nativa/assets/` (icon-only, icon-foreground, icon-background, splash —
PNG resi da `store/icona.svg`, il vettoriale dell'icona) e scrive le 61
risorse nelle densità giuste. Da rilanciare se l'icona cambia.

### 2 ter. Compilare senza Android Studio (fatto il 27/8/2026)

Android Studio serve per l'emulatore e il debug visuale, non per compilare.
In `D:\Kimari\strumenti\` ci sono già JDK 21 e l'SDK a riga di comando
(platform-tools, android-35, build-tools 35): sono ~2 GB invece di 8.
`nativa/android/local.properties` punta all'SDK — **con le barre dritte**:
`sdk.dir=D:/Kimari/strumenti/android-sdk`. Con i backslash il formato Java
Properties li mangia (`\K` → `K`) e Gradle muore con un criptico "The
filename, directory name, or volume label syntax is incorrect".

```bash
cd nativa/android
JAVA_HOME=/d/Kimari/strumenti/jdk-21.0.12.1+1 ./gradlew assembleDebug
```

L'APK esce in `app/build/outputs/apk/debug/app-debug.apk`: si installa sul
telefono con `adb install` o copiandolo e aprendolo. Per l'App Bundle firmato
da caricare sul Play Store (`bundleRelease` + chiave di firma) Android Studio
resta la strada più comoda, ma anche quello si può fare da qui.

### 2 quater. I link che aprono l'app (fatto il 27/8/2026, lato Android)

La domanda di Vincenzo: «se ho l'app e mi mandano un link, voglio che si apra
l'app, non il browser». Si chiama **App Links** su Android, **Universal
Links** su iPhone, e ha tre pezzi:

1. **L'intent-filter nel manifest** — lo mette `node tools/android-deeplink.mjs`
   (già nella catena di `npm run android`). Va rilanciato dopo ogni
   `npx cap add android`, perché la cartella è generata.
2. **`/.well-known/assetlinks.json` sul dominio** — è nel repo e va online
   con la prossima pubblicazione (insieme a `.nojekyll`, senza il quale
   GitHub Pages nasconde le cartelle che iniziano col punto). Contiene
   l'impronta SHA-256 del certificato di firma: ora c'è quella di **debug**;
   quando nascerà la chiave del Play Store, la sua impronta va **aggiunta**
   all'elenco, altrimenti l'APK dello store aprirà il browser.
   Senza questo file verificato, Android 12+ ignora l'intent-filter.
3. **Il listener `appUrlOpen`** in `app/live.js` (plugin `@capacitor/app`):
   trasforma l'URL del sito nella rotta interna — `?t=TOKEN` → `#/i/TOKEN`
   (piano), `/app/#/gi/TOKEN` → `#/gi/TOKEN` (gruppo), il resto apre l'app
   e basta.

Per **iPhone** la metà lato sito è `/.well-known/apple-app-site-association`
(serve il TEAM_ID, che sta in `D:\Kimari\segreti`) e la metà lato app è
l'entitlement Associated Domains — si fanno **con la build iOS sul Mac**.

**La PWA (aggiungi a Home) non può intercettare i link**: è un limite della
piattaforma, non un difetto nostro. Chi ha la PWA continuerà ad aprire i
link nel browser; solo l'app nativa li cattura.

Per provare dal PC, col telefono collegato via USB:

```bash
adb shell pm verify-app-links --re-verify it.kimari.app
adb shell am start -a android.intent.action.VIEW -d "https://kimariapp.com/?t=PROVA"
```

### 3. Provarla sul telefono

Attiva le **Opzioni sviluppatore** sul telefono (Impostazioni → Info →
tocca sette volte "Numero build"), poi il **Debug USB**. Collega il cavo e:

```bash
npm run android
```

Si apre Android Studio: premi ▶ e l'app parte sul telefono.

### 4. Pubblicarla

Serve un account **Google Play Console**: 25 € una volta sola, su
play.google.com/console.

In Android Studio: *Build → Generate Signed Bundle* → **Android App Bundle**.
La prima volta ti fa creare una chiave di firma:

> **La chiave di firma va conservata e mai persa.** Senza, non potrai più
> aggiornare l'app: Google la rifiuterà come se fosse di un altro. Mettila in
> `D:\Kimari\segreti\` insieme alla `.p8` di Apple, e fanne una copia altrove.

Il file `.aab` che esce si carica nella Play Console.

---

## iPhone — serve macOS

Tre modi, dal più economico:

**1. Compilazione nel cloud** (~0 €). GitHub Actions offre macchine macOS
gratis per i repository pubblici; Codemagic ha 500 minuti al mese gratuiti.
Funziona, ma va configurato: certificati, profili di firma, segreti nel
repository. È la parte lunga — mezza giornata la prima volta.

**2. Mac in affitto** (~25-30 €/mese). MacinCloud e simili: ti danno un Mac a
cui accedi da remoto. Più semplice da capire, ma è un costo che continua.

**3. Mac usato** (~400 € per un Mac mini M1). Il più caro all'inizio e il più
comodo poi, soprattutto se aggiorni l'app spesso.

Su una qualsiasi delle tre, i comandi sono gli stessi:

```bash
cd nativa
npm install @capacitor/ios@latest
npm run ios
```

### La regola 4.2 di Apple

Apple rifiuta le app che sono «un sito web impacchettato senza funzioni
proprie». Kimari ha le notifiche push, che aiutano, ma spesso da sole non
bastano. Le cose che tipicamente fanno passare la revisione:

- notifiche push *native* (non solo web)
- i link `?t=` che si aprono direttamente nell'app (Universal Links)
- l'accesso con Apple integrato nel sistema
- il calendario del telefono

Sono giorni di lavoro, non ore, e vanno fatti **prima** di sottomettere: un
rifiuto costa un altro giro di revisione.

---

## Cosa NON cambia mai

Il **sito** resta un solo file, senza build step. È ciò che rende i link `?t=`
apribili da chiunque senza installare niente, ed è il cuore del prodotto
(regola 1 di CLAUDE.md).

L'app nativa è la stessa app web in una scatola: si copia da `app/`, sempre.
Duplicare i file a mano garantirebbe che le due copie prima o poi divergano —
ed è successo davvero il 26/8/2026, con `index.html` e `live.js` finiti online
disallineati per quarantacinque minuti.

L'unica cosa che `prepara-nativa.mjs` cambia nella copia: dentro l'app i file
stanno in locale, quindi l'indirizzo del sito calcolato da `location`
punterebbe lì. I link generati sarebbero apribili **solo da chi ha già l'app** —
il difetto peggiore possibile per un'app il cui scopo è far arrivare un link a
chi *non* ce l'ha. Nella copia nativa diventa `kimariapp.com`.
