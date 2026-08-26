// genera-i18n.mjs — mette il dizionario dentro il sito.
//
//   node tools/genera-i18n.mjs
//
// Il sito deve restare UN FILE SOLO (regola 1): niente import, niente fetch,
// nessuna richiesta in più. Quindi il dizionario — che è un modulo, e come
// modulo lo usa l'app — viene iniettato dentro index.html fra due marcatori.
// La sorgente resta i18n/dizionario.js: si modifica quello e si rigenera.
//
// Sul peso: sei lingue aggiungono testo, ma è testo. GitHub Pages serve
// compresso e il testo si comprime di brutto — quello che a schermo sono
// decine di kB, in rete sono pochi.
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const INIZIO = '/* ==== i18n: generato da tools/genera-i18n.mjs — non modificare a mano ==== */';
const FINE   = '/* ==== fine i18n ==== */';

// Il modulo diventa codice normale: via gli export, che dentro uno <script>
// classico sono un errore di sintassi.
const dizionario = readFileSync(join(root, 'i18n', 'dizionario.js'), 'utf8')
  .replace(/^export const /gm, 'const ')
  .replace(/^export function /gm, 'function ')
  .replace(/^export /gm, '');

const blocco = [
  INIZIO,
  dizionario.trimEnd(),
  '',
  '// La lingua è quella del dispositivo: nessun selettore da cercare, e chi',
  '// riceve il link da un amico all\'estero legge nella sua lingua senza fare niente.',
  'const LINGUA = scegliLingua(navigator.languages || [navigator.language]);',
  'const t = traduttore(LINGUA);',
  'document.documentElement.lang = LINGUA;',
  FINE
].join('\n');

// Due file, stessa iniezione: il sito e l'app. Tutti e due hanno uno <script>
// classico, che non può importare moduli — da qui l'iniezione invece
// dell'import.
const FILE = [
  { path: 'index.html',     dopo: "'use strict';" },
  // Nell'app il blocco va PRIMA dello script degli asset: t() serve già alle
  // prime funzioni definite più sotto.
  { path: 'app/index.html', prima: 'window.KIMARI_ASSETS = {' }
];

for (const f of FILE) {
  const file = join(root, f.path);
  let html = readFileSync(file, 'utf8');

  const i = html.indexOf(INIZIO);
  const j = html.indexOf(FINE);

  if (i !== -1 && j !== -1) {
    html = html.slice(0, i) + blocco + html.slice(j + FINE.length);
  } else if (f.dopo) {
    const k = html.indexOf(f.dopo);
    if (k === -1) throw new Error(`non trovo l'ancora in ${f.path}`);
    html = html.slice(0, k + f.dopo.length) + '\n\n' + blocco + '\n' + html.slice(k + f.dopo.length);
  } else {
    const k = html.indexOf(f.prima);
    if (k === -1) throw new Error(`non trovo l'ancora in ${f.path}`);
    html = html.slice(0, k) + blocco + '\n\n' + html.slice(k);
  }

  writeFileSync(file, html);
  console.log(`  ${f.path.padEnd(16)} ${(readFileSync(file, 'utf8').length / 1024).toFixed(1)} kB`);
}
console.log(`  dizionario: ${(blocco.length / 1024).toFixed(1)} kB di testo, che in rete si comprime`);
