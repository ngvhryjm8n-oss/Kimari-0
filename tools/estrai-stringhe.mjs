// estrai-stringhe.mjs — trova le stringhe da tradurre.
//
//   node tools/estrai-stringhe.mjs index.html
//   node tools/estrai-stringhe.mjs app/index.html
//
// Non traduce niente: elenca soltanto, per sapere quanto è grande il lavoro e
// per non dimenticarne nessuna. Cerca il testo italiano dentro i letterali e
// dentro i tag dei template.
import { readFileSync } from 'node:fs';

const file = process.argv[2];
if (!file) { console.error('serve un file'); process.exit(1); }

const src = readFileSync(file, 'utf8');
const script = src.slice(src.indexOf('<script>', src.indexOf('</style>')));

const trovate = new Set();

// 1. letterali fra apici singoli
for (const m of script.matchAll(/'([^'\\\n]{2,120})'/g)) trovate.add(m[1]);
// 2. testo fra due tag, dentro i template — niente interpolazioni in mezzo
for (const m of script.matchAll(/>([^<>`${}\n]{3,120})</g)) trovate.add(m[1].trim());
// 3. attributi che si vedono: placeholder, aria-label, title
for (const m of script.matchAll(/(?:placeholder|aria-label|title)="([^"${}\n]{3,120})"/g)) {
  trovate.add(m[1].trim());
}

const ACCENTATE = /[àèéìòùÀÈÉÌÒÙ]/;
const PAROLE = /\b(il|lo|la|i|gli|le|un|una|di|da|in|con|per|tra|fra|che|chi|non|più|già|sei|sono|hai|ha|puoi|vuoi|questo|questa|quando|dove|come|tuo|tua|tuoi|se|ma|e|o|al|del|nel|sul|alla|della|nella|ti|si|ci|mi)\b/i;

const daTradurre = [...trovate]
  .map(t => t.trim())
  .filter(t => t.length >= 3)
  .filter(t => /[a-zà-ù]/i.test(t))
  // via codice, selettori, unità, url, nomi di funzione
  .filter(t => !/^[#.]|^\/|https?:|^[a-z-]+$|^[A-Za-z_$]+$|px$|%$|rgba|^\d|^[A-Z_]+$/.test(t))
  .filter(t => !/[<>{}$`\\]/.test(t))
  // deve sembrare italiano: un accento, o una parolina italiana, o più parole
  .filter(t => ACCENTATE.test(t) || PAROLE.test(t) || t.split(/\s+/).length >= 2)
  .sort((a, b) => a.localeCompare(b, 'it'));

console.log(`\n${file} — ${daTradurre.length} stringhe da tradurre\n`);
for (const t of daTradurre) console.log('  ' + JSON.stringify(t));
