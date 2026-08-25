// genera-i18n.mjs — mette il dizionario dentro il sito.
//
//   node tools/genera-i18n.mjs
//
// Il sito deve restare UN FILE SOLO (regola 1): niente import, niente fetch,
// nessuna richiesta in più. Quindi il dizionario — che è un modulo, e come
// modulo lo usa l'app — viene iniettato dentro index.html fra due marcatori.
// La sorgente resta i18n/dizionario.js: si modifica quello e si rigenera.
//
// Sul peso: cinque lingue aggiungono testo, ma è testo. GitHub Pages serve
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

const file = join(root, 'index.html');
let html = readFileSync(file, 'utf8');

const i = html.indexOf(INIZIO);
const j = html.indexOf(FINE);

if (i !== -1 && j !== -1) {
  html = html.slice(0, i) + blocco + html.slice(j + FINE.length);
} else {
  // Prima volta: si mette in cima allo script inline, prima di tutto il resto,
  // perché t() serve già alle prime funzioni.
  const ancora = "'use strict';";
  const k = html.indexOf(ancora);
  if (k === -1) throw new Error("non trovo 'use strict' nello script inline");
  html = html.slice(0, k + ancora.length) + '\n\n' + blocco + '\n' + html.slice(k + ancora.length);
}

writeFileSync(file, html);

const lingue = (dizionario.match(/^\s{2}[a-z]{2}: '/gm) || []).length;
console.log(`  index.html · dizionario iniettato (${(blocco.length / 1024).toFixed(1)} kB di testo)`);
console.log(`  ${(readFileSync(file, 'utf8').length / 1024).toFixed(1)} kB in totale`);
