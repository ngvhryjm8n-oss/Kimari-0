// I messaggi che l'app risponde stanno in live.js come toast: 'Fatto'.
// Il dispatcher li traduce tutti in un punto solo — ma se qualcuno ne scrive
// uno nuovo e non lo mette nel dizionario, esce l'italiano a un tedesco senza
// che nessun controllo se ne accorga: t() ricade sulla chiave apposta.
//
// Questo li elenca e fallisce se ne manca uno.
//
//   node tools/i18n-messaggi.mjs
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const { DIZIONARIO } = await import('../i18n/dizionario.js');

const NORM = s => String(s).replace(/[‘’ʼ]/g, "'").replace(/[“”]/g, '"')
                           .replace(/\s+/g, ' ').trim();
const INDICE = new Set(Object.keys(DIZIONARIO).map(NORM));

const src = readFileSync(join(root, 'app', 'live.js'), 'utf8');
const senza = new Set();
let quanti = 0;

// toast: '...' e K.t('...') — con l'apostrofo protetto.
// `\\.` prende la coppia backslash+carattere come una cosa sola, e il gruppo
// negato esclude anche il backslash: se [^'] se lo mangiasse da solo, in
// "Annullato: l\'account" la stringa sembrerebbe finire sull'apostrofo e il
// messaggio uscirebbe troncato — cosa che è successa, e sembrava una
// traduzione mancante invece che uno strumento rotto.
for (const re of [/toast: '((?:\\.|[^'\\])*)'/g, /K\.t\('((?:\\.|[^'\\])*)'/g]) {
  for (const m of src.matchAll(re)) {
    const testo = m[1].replace(/\\'/g, "'");
    quanti++;
    if (!INDICE.has(NORM(testo))) senza.add(testo);
  }
}

console.log('\nmessaggi di live.js: ' + quanti + ' trovati');
if (!senza.size) { console.log('  tutti tradotti\n'); process.exit(0); }
console.log('  senza traduzione (' + senza.size + '):');
[...senza].sort().forEach(x => console.log('    · ' + x));
console.log('\nAggiungili a i18n/dizionario.js\n');
process.exit(1);
