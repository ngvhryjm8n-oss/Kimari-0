// Trova il testo italiano che finisce a schermo SENZA passare da t().
//
// tools/i18n-mancanti.mjs guarda le stringhe che t() riceve. Ma il difetto
// peggiore è l'opposto: una frase scritta a mano dentro l'HTML, che t() non
// vede mai. Non manca nel dizionario — non è mai stata candidata a esserci.
//
// Il 26/8/2026 il sito online aveva l'intestazione in inglese e la schermata
// dopo il voto tutta in italiano, e nessun controllo se n'era accorto: da
// quella parte non c'era niente da controllare.
//
//   node tools/i18n-non-avvolte.mjs
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

// Parole che in italiano compaiono ovunque e in inglese quasi mai. Servono a
// distinguere una frase da un identificatore o da una classe CSS.
const SPIE = /\b(che|chi|con|come|dove|quando|quando|del|della|delle|dei|degli|dal|dalla|nel|nella|sul|sulla|per|non|una|uno|gli|già|puoi|tuo|tuoi|tua|tue|sono|essere|questa|questo|queste|questi|quello|quella|serve|senza|ancora|adesso|sempre|mai|solo|anche|invece|oppure|nessun|nessuna|nessuno|tutti|tutte|tutto|ogni|primo|prima|dopo|poi|molto|meno|più|voto|voti|piano|piani|gruppo|amici|posto|data|email|salva|salvala|scrivi|segna|manda|invia|conferma|deciso|decidere)\b/i;

const FILE = process.argv.slice(2).length ? process.argv.slice(2) : ['index.html'];

let totale = 0;

for (const f of FILE) {
  const src = readFileSync(join(root, f), 'utf8');

  // Solo la parte JS: fuori dallo <script> c'è il CSS e il markup statico,
  // che qui non interessa.
  const trovate = new Map();   // testo → riga

  const righe = src.split('\n');
  righe.forEach((riga, i) => {
    // Salta i commenti e il dizionario stesso.
    const pulita = riga.trim();
    if (pulita.startsWith('//') || pulita.startsWith('*') || pulita.startsWith('/*')) return;

    // Toglie ogni ${...}: dentro ci sono espressioni, non testo scritto a mano.
    // Toglie anche i t('...') completi: quelli sono già a posto.
    let r = riga
      .replace(/\$\{t\((['"`])(?:\\.|(?!\1)[\s\S])*?\1[^}]*\)\}/g, '§')
      .replace(/\$\{[^{}]*\}/g, '§');

    // Il testo che finisce a schermo sta fra > e <, o dentro placeholder=""
    // e title="". Il resto del sorgente non lo vede nessuno.
    const pezzi = [];
    for (const m of r.matchAll(/>([^<>{}]{4,})</g)) pezzi.push(m[1]);
    for (const m of r.matchAll(/(?:placeholder|title|alt|aria-label)="([^"$]{4,})"/g)) pezzi.push(m[1]);

    for (const p of pezzi) {
      const testo = p.replace(/§/g, ' ').replace(/\s+/g, ' ').trim();
      if (testo.length < 5) continue;
      if (!SPIE.test(testo)) continue;
      if (!trovate.has(testo)) trovate.set(testo, i + 1);
    }
  });

  console.log('\n' + f + ':');
  if (!trovate.size) { console.log('  niente testo italiano fuori da t()'); continue; }
  totale += trovate.size;
  for (const [testo, riga] of trovate) {
    console.log('  riga ' + String(riga).padStart(4) + ': ' + testo.slice(0, 90));
  }
}

console.log('\n' + (totale ? totale + ' frasi che restano italiane in ogni lingua' : 'niente da segnalare') + '\n');
process.exit(totale ? 1 : 0);
