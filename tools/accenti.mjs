// Cerca gli accenti scritti con l'apostrofo nel testo che si vede a schermo:
// "e'" invece di "è", "puo'" invece di "può".
//
// Nei commenti va benissimo — servono a non litigare con gli escape della
// shell. A schermo no: e' la differenza fra un'app curata e una improvvisata,
// e chi la legge se ne accorge prima di qualsiasi funzione.
//
// L'ho introdotto io scrivendo "chi lo apre vede che e' saltato" con uno
// script, e me ne sono accorto per caso rileggendo la pagina.
//
//   node tools/accenti.mjs
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const FILE = ['index.html', join('app', 'index.html'), join('i18n', 'dizionario.js')];

// parola + apostrofo dove ci vorrebbe un accento
const SOSPETTI = /\b(e|puo|piu|perche|poiche|gia|pero|cosi|ne|se|si|la|da|meta|citta|liberta|verita|qualita|novita|cioe|finche|affinche|benche|nonche|percio|piu)'/g;

let totale = 0;

for (const f of FILE) {
  let src;
  try { src = readFileSync(join(root, f), 'utf8'); } catch { continue; }
  const trovate = [];

  src.split('\n').forEach((riga, i) => {
    const pulita = riga.trim();
    // I commenti sono liberi: e' li' che l'apostrofo serve davvero.
    if (pulita.startsWith('//') || pulita.startsWith('*') || pulita.startsWith('/*')) return;

    // Solo il testo che finisce a schermo.
    const pezzi = [];
    for (const m of riga.matchAll(/>([^<>{}$`]{3,})</g)) pezzi.push(m[1]);
    for (const m of riga.matchAll(/(?:placeholder|title|alt|aria-label)="([^"$`]{3,})"/g)) pezzi.push(m[1]);
    for (const m of riga.matchAll(/\b(?:toast|confirm|prompt|alert)\(\s*'([^']{6,})'/g)) pezzi.push(m[1]);
    for (const m of riga.matchAll(/\b(?:it|en|es|de|ja):\s*'([^']{6,})'/g)) pezzi.push(m[1]);

    for (const p of pezzi) {
      const m = [...p.matchAll(SOSPETTI)];
      if (m.length) trovate.push('  riga ' + String(i + 1).padStart(4) + ': ' +
        m.map(x => x[0]).join(', ') + '  in "' + p.slice(0, 60) + '"');
    }
  });

  if (trovate.length) {
    totale += trovate.length;
    console.log('\n' + f + ':');
    trovate.forEach(t => console.log(t));
  }
}

console.log('\n' + (totale ? totale + ' accenti scritti con l\'apostrofo, a schermo'
                            : 'nessun accento scritto con l\'apostrofo a schermo') + '\n');
process.exit(totale ? 1 : 0);
