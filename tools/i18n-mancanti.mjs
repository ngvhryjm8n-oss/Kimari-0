// Dice quali stringhe passano da t() ma non hanno una voce nel dizionario, e
// quali voci hanno una lingua vuota.
//
// Serve perché la traduzione si rompe in silenzio: se una chiave non combacia
// esce l'italiano, senza errori. Il 26/8/2026 il sito online mostrava metà
// pagina in italiano sotto un'interfaccia inglese, e nessuna prova se ne era
// accorta — perché le stringhe non tradotte non passavano proprio da t().
//
//   node tools/i18n-mancanti.mjs
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const { DIZIONARIO, LINGUE } = await import('../i18n/dizionario.js');

const FILE = ['index.html', join('app', 'index.html')];
const LINGUE_TRADOTTE = Object.keys(LINGUE).filter(l => l !== 'it');

// Stessa normalizzazione del sito: nel codice si scrive "un'opinione" con
// l'apostrofo dritto, nel dizionario "un’opinione" con quello tipografico.
// Senza questo il confronto darebbe falsi allarmi proprio sulle voci curate.
const NORM = s => String(s)
  .replace(/[‘’ʼ]/g, "'")
  .replace(/[“”]/g, '"')
  .replace(/\s+/g, ' ')
  .trim();

const INDICE = new Set(Object.keys(DIZIONARIO).map(NORM));

let problemi = 0;

for (const f of FILE) {
  let src;
  try { src = readFileSync(join(root, f), 'utf8'); } catch { continue; }

  // t('...'), t("..."), t(`...`) — con l'apostrofo protetto.
  const usate = new Set();
  const re = /[^a-zA-Z_$]t\(\s*(['"`])((?:\\.|(?!\1)[\s\S])*?)\1/g;
  for (const m of src.matchAll(re)) {
    usate.add(m[2].replace(/\\'/g, "'").replace(/\\"/g, '"').replace(/\\`/g, '`'));
  }

  const senza = [...usate].filter(s => !INDICE.has(NORM(s))).sort();
  console.log('\n' + f + ': ' + usate.size + ' stringhe passano da t()');
  if (senza.length) {
    problemi += senza.length;
    console.log('  senza voce nel dizionario (' + senza.length + '):');
    senza.forEach(s => console.log('    · ' + s));
  } else {
    console.log('  tutte hanno una voce');
  }
}

console.log('\nvoci del dizionario con una lingua vuota:');
let vuote = 0;
for (const [chiave, v] of Object.entries(DIZIONARIO)) {
  const mancanti = LINGUE_TRADOTTE.filter(l => !v[l]);
  if (mancanti.length) {
    vuote++;
    console.log('  · ' + chiave.slice(0, 60) + ' → manca ' + mancanti.join(', '));
  }
}
if (!vuote) console.log('  nessuna');
problemi += vuote;

console.log('\n' + (problemi ? problemi + ' cose da sistemare' : 'dizionario completo') + '\n');
process.exit(problemi ? 1 : 0);
