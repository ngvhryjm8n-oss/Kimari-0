// Trova il testo italiano scritto come STRINGA nel codice, non come markup.
//
// tools/i18n-non-avvolte.mjs guarda il testo fra > e <: è lì che sta quasi
// tutta l'interfaccia. Ma una parte viaggia come argomento di funzione —
//
//     nav(isOrg ? 'Il tuo piano' : 'Piano', back)
//     const nav = (title, back, right = '', backLabel = 'Indietro') => ...
//
// — e finisce a schermo identica, restando invisibile a entrambi gli
// strumenti. Il trasformatore non le tocca apposta: dentro un'espressione c'è
// codice, e avvolgere alla cieca romperebbe il file. Vanno fatte a mano, ma
// prima bisogna sapere quali sono.
//
//   node tools/i18n-argomenti.mjs app/index.html
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const { DIZIONARIO } = await import('../i18n/dizionario.js');

const NORM = s => String(s).replace(/[‘’ʼ]/g, "'").replace(/[“”]/g, '"')
                           .replace(/\s+/g, ' ').trim();
const INDICE = new Set(Object.keys(DIZIONARIO).map(NORM));

// Parole che in italiano compaiono ovunque, o accenti: bastano a distinguere
// una frase da un identificatore, una classe CSS o una chiave.
const ITALIANO = /[àèéìòù]|\b(che|chi|con|come|dove|quando|del|della|dei|per|non|una|uno|gli|tuo|tua|sono|questo|questa|senza|ancora|solo|anche|oppure|nessun|nessuna|tutti|tutto|ogni|prima|dopo|piano|piani|gruppo|gruppi|posto|posti|voto|voti|amici|spesa|spese|data|nome|link|indietro|annulla|avanti|salva|invia|scegli|conferma|elimina|modifica|aggiungi|rimuovi|chiudi|apri)\b/i;

// Roba che non è testo per una persona.
const NON_TESTO = /^(https?:|data:|[a-z-]+\/[a-z+-]+$|#|\.|\/|[a-z]+([A-Z][a-z]*)+$)/;
const CSS_O_CODICE = /[{}<>;=]|^[a-z-]+$|^\d/;

const file = process.argv[2] || 'app/index.html';
const src = readFileSync(join(root, file), 'utf8');

// Solo dentro <script>: fuori c'è il CSS, dove "per" compare in mille regole.
let script = [...src.matchAll(/<script(?![^>]*src)[^>]*>([\s\S]*?)<\/script>/g)]
  .map(m => m[1]).join('\n');

// Via il dizionario, che è iniettato dentro la pagina: dentro ci sono TUTTE le
// traduzioni, e senza questo lo strumento le segnalava come testo da tradurre.
// Si sostituisce con spazi invece di tagliarlo, così i numeri di riga restano
// quelli veri del file.
const da = script.indexOf('/* ==== i18n:');
const a  = script.indexOf('/* ==== fine i18n ==== */');
if (da >= 0 && a > da) {
  const dentro = script.slice(da, a);
  script = script.slice(0, da) + dentro.replace(/[^\n]/g, ' ') + script.slice(a);
}

const trovate = new Map();
// Stringhe fra apici singoli o doppi, con l'escape rispettato.
for (const m of script.matchAll(/(?<![\w)\]])(['"])((?:\\.|(?!\1)[^\\\n])*)\1/g)) {
  const t = m[2].replace(/\\'/g, "'").replace(/\\"/g, '"');
  if (t.length < 3 || t.length > 200) continue;
  if (!ITALIANO.test(t)) continue;
  if (NON_TESTO.test(t) || CSS_O_CODICE.test(t)) continue;
  if (INDICE.has(NORM(t))) continue;                 // già una chiave: ok
  // Già dentro t('...')? Si guarda cosa c'è appena prima.
  const prima = script.slice(Math.max(0, m.index - 3), m.index);
  if (/\bt\($/.test(prima)) continue;
  const riga = script.slice(0, m.index).split('\n').length;
  if (!trovate.has(t)) trovate.set(t, riga);
}

console.log('\n' + file + ': testo italiano passato come stringa nel codice');
if (!trovate.size) { console.log('  niente\n'); process.exit(0); }
for (const [t, r] of [...trovate].sort((a, b) => a[1] - b[1])) {
  console.log('  riga ' + String(r).padStart(4) + ': ' + t.slice(0, 80));
}
console.log('\n' + trovate.size + ' da guardare a mano\n');
