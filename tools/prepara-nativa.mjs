// Prepara nativa/www: i file che Capacitor impacchetta dentro l'app.
//
// L'app nativa NON è un progetto diverso: è la stessa app web, messa in una
// scatola. Duplicare i file a mano garantirebbe che prima o poi le due copie
// divergano — ed è esattamente il difetto che oggi mi è costato ore quando
// index.html e live.js sono finiti online disallineati.
//
// Quindi si copia, sempre, da un solo posto: app/.
//
//   node tools/prepara-nativa.mjs
import { readFileSync, writeFileSync, mkdirSync, copyFileSync, rmSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const da = join(root, 'app');
const a  = join(root, 'nativa', 'www');

// Si svuota prima: un file rimasto da una versione precedente verrebbe
// impacchettato senza che nessuno lo noti.
if (existsSync(a)) rmSync(a, { recursive: true, force: true });
mkdirSync(a, { recursive: true });

const FILE = ['index.html', 'live.js', 'data.js', 'map.js', 'sw.js',
              'manifest.json', 'icona-192.png'];

for (const f of FILE) {
  const sorgente = join(da, f);
  if (!existsSync(sorgente)) {
    console.error('manca ' + f + ': l\'app nativa sarebbe incompleta');
    process.exit(1);
  }
  copyFileSync(sorgente, join(a, f));
}

// Dentro l'app i file stanno in locale, ma il BACKEND resta lo stesso — e i
// link che l'app genera devono puntare al sito vero, non a capacitor://.
// Senza questo, un piano creato dall'app produrrebbe un link che non si apre
// da nessuna parte: il difetto peggiore possibile per un'app il cui scopo è
// far arrivare un link su WhatsApp.
// La riga si cerca per l'INIZIO, non per intero: la parte dopo contiene una
// espressione regolare con parentesi, e cercarla tutta significa riscrivere
// due volte lo stesso pezzo e sbagliarne uno. Al primo tentativo è successo.
const html = readFileSync(join(a, 'index.html'), 'utf8');
const righe = html.split('\n');
const i = righe.findIndex(r => r.startsWith('const SITO = location.origin'));
if (i < 0) {
  console.error('la riga di SITO non c\'è più: i link generati sarebbero rotti,\n' +
                'e il difetto si vedrebbe solo aprendo un invito da WhatsApp');
  process.exit(1);
}
righe[i] =
  "// Dentro l'app i file stanno in locale (capacitor:// o file://), ma i link\n" +
  "// che si mandano su WhatsApp devono puntare al sito vero: un invito che si\n" +
  "// apre solo su chi ce l'ha già installata non serve a niente.\n" +
  "const SITO = /^(capacitor|file):$/.test(location.protocol)\n" +
  "  ? 'https://kimariapp.com/'\n" +
  "  : " + righe[i].replace('const SITO = ', '');
writeFileSync(join(a, 'index.html'), righe.join('\n'));

const versione = (readFileSync(join(da, 'live.js'), 'utf8')
  .match(/VERSIONE = '([^']*)'/) || [])[1] || '?';

console.log('nativa/www pronta · versione ' + versione);
console.log(FILE.map(f => '  ' + f).join('\n'));
console.log('\nDa qui, su un Mac o su un runner macOS:');
console.log('  npx cap sync ios && npx cap open ios');
