// Inserisce nell'AndroidManifest l'intent-filter che fa aprire i link di
// kimariapp.com DENTRO l'app, invece che nel browser (Android App Links).
//
// Serve perché nativa/android/ è generata (`npx cap add android`) e ignorata
// da git: qualunque modifica fatta a mano lì dentro sparirebbe alla prossima
// rigenerazione. Questo script è idempotente e va rilanciato dopo ogni
// `npx cap add android`:
//
//   node tools/android-deeplink.mjs
//
// L'altra metà del meccanismo è /.well-known/assetlinks.json sul dominio:
// senza quello (o con l'impronta del certificato sbagliata) Android 12+ apre
// comunque il browser. L'impronta di DEBUG è già nel file; quando nascerà la
// chiave di firma per il Play Store, la sua impronta va AGGIUNTA all'elenco
// (si ottiene con: keytool -list -v -keystore <chiave> | grep SHA256).
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const manifest = join(dirname(fileURLToPath(import.meta.url)), '..',
  'nativa', 'android', 'app', 'src', 'main', 'AndroidManifest.xml');

let xml;
try { xml = readFileSync(manifest, 'utf8'); }
catch {
  console.error('AndroidManifest non trovato: prima `npx cap add android` in nativa/');
  process.exit(1);
}

if (xml.includes('android:host="kimariapp.com"')) {
  console.log('intent-filter già presente: niente da fare');
  process.exit(0);
}

const FILTRO = `
            <intent-filter android:autoVerify="true">
                <action android:name="android.intent.action.VIEW" />
                <category android:name="android.intent.category.DEFAULT" />
                <category android:name="android.intent.category.BROWSABLE" />
                <data android:scheme="https" android:host="kimariapp.com" />
            </intent-filter>
`;

// Dentro la MainActivity, dopo l'intent-filter del launcher.
const dopo = xml.replace(/(<intent-filter>[\s\S]*?LAUNCHER[\s\S]*?<\/intent-filter>)/,
                         `$1${FILTRO}`);
if (dopo === xml) {
  console.error('non trovo l\'intent-filter del launcher: manifest cambiato di forma?');
  process.exit(1);
}
writeFileSync(manifest, dopo);
console.log('intent-filter per kimariapp.com inserito in', manifest);
