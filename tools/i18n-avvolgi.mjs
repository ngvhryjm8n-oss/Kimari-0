// Avvolge in t() il testo italiano che finisce a schermo senza passarci.
//
// Perché serve un lexer e non una regex sulle righe: `${t('...')}` funziona
// solo dentro un template letterale. Dentro una stringa normale, come
//   '<div><h1>Kimari non si è caricato</h1>' +
// quella scrittura non interpola niente e rompe il file. Al primo tentativo è
// successo esattamente questo. Quindi si scorre il sorgente sapendo sempre
// dove si è: template, stringa, commento.
//
// Le frasi con ${...} dentro NON si toccano: vanno spezzate a mano coi
// segnaposto, perché ogni lingua mette il nome dove le serve.
//
//   node tools/i18n-avvolgi.mjs index.html --prova
//   node tools/i18n-avvolgi.mjs index.html
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const prova = args.includes('--prova');
const file = args.find(a => !a.startsWith('--')) || 'index.html';

const SPIE = /\b(che|chi|con|come|dove|quando|del|della|delle|dei|degli|dal|dalla|nel|nella|sul|sulla|per|non|una|uno|gli|già|puoi|tuo|tuoi|tua|tue|sono|essere|questa|questo|queste|questi|quello|quella|serve|senza|ancora|adesso|sempre|mai|solo|anche|invece|oppure|nessun|nessuna|nessuno|tutti|tutte|tutto|ogni|primo|prima|dopo|poi|molto|meno|più|voto|voti|piano|piani|gruppo|amici|posto|data|email|salva|salvala|scrivi|segna|manda|invia|conferma|deciso|decidere)\b/i;

const src = readFileSync(join(root, file), 'utf8');

// Trova le regioni che stanno dentro un template letterale al livello più
// esterno, saltando stringhe e commenti. Le ${...} annidate si scavalcano:
// dentro c'è codice, non testo scritto a mano.
function regioniTemplate(s) {
  const out = [];
  let i = 0;
  while (i < s.length) {
    const c = s[i];
    if (c === '\\') { i += 2; continue; }
    if (c === '/' && s[i + 1] === '/') { i = s.indexOf('\n', i); if (i === -1) break; continue; }
    if (c === '/' && s[i + 1] === '*') { i = s.indexOf('*/', i); if (i === -1) break; i += 2; continue; }
    if (c === "'" || c === '"') {
      const q = c; i++;
      while (i < s.length && s[i] !== q) { if (s[i] === '\\') i++; i++; }
      i++; continue;
    }
    if (c === '`') {
      let j = i + 1, inizio = j;
      while (j < s.length) {
        if (s[j] === '\\') { j += 2; continue; }
        if (s[j] === '`') break;
        if (s[j] === '$' && s[j + 1] === '{') {
          out.push([inizio, j]);                       // testo prima della ${
          let liv = 1; j += 2;
          while (j < s.length && liv > 0) {            // scorre l'espressione
            if (s[j] === '\\') { j += 2; continue; }
            if (s[j] === '`') {
              // Template annidato: dentro c'è altro testo da tradurre. È la
              // gran parte del sorgente, perché ogni ramo di un ternario che
              // produce markup è un template dentro un'espressione. Saltarlo
              // lasciava fuori metà pagina.
              let k = j + 1, l = 1;
              while (k < s.length && l > 0) {
                if (s[k] === '\\') { k += 2; continue; }
                if (s[k] === '`') l--;
                k++;
              }
              for (const r of regioniTemplate(s.slice(j, k))) out.push([j + r[0], j + r[1]]);
              j = k; continue;
            }
            if (s[j] === "'" || s[j] === '"') {
              const q = s[j]; j++;
              while (j < s.length && s[j] !== q) { if (s[j] === '\\') j++; j++; }
              j++; continue;
            }
            if (s[j] === '{') liv++;
            if (s[j] === '}') liv--;
            j++;
          }
          inizio = j; continue;
        }
        j++;
      }
      out.push([inizio, j]);
      i = j + 1; continue;
    }
    i++;
  }
  return out;
}

const pulito = t => !/[$`{}<>]/.test(t) && t.trim().length >= 5 && SPIE.test(t);
const dentro = t => "t('" + t.replace(/\\/g, '\\\\').replace(/'/g, "\\'") + "')";
const rigaDi = (s, i) => s.slice(0, i).split('\n').length;

// Il riconoscitore scende nei template annidati e li aggiunge PRIMA di
// chiudere quello che li contiene: l'elenco esce disordinato e con regioni
// che si accavallano. Chi ricompone il file piu' sotto si fida dell'ordine —
// se non lo si mette a posto qui, il risultato puo' perdere pezzi in
// silenzio, con la sintassi ancora valida.
// (tools/i18n-verifica-avvolgi.mjs e' la prova che non succede.)
const regioni = regioniTemplate(src)
  .filter(([a, b]) => b > a)
  .sort((x, y) => x[0] - y[0])
  .reduce((acc, r) => {
    const ultima = acc[acc.length - 1];
    if (ultima && r[0] < ultima[1]) return acc;      // dentro la precedente
    acc.push(r);
    return acc;
  }, []);
const avvolte = [];
const pezzi = [];
let ultimo = 0;

for (const [a, b] of regioni) {
  const testo = src.slice(a, b);
  let mod = testo;

  mod = mod.replace(/>([^<>]{5,})</g, (tutto, t) => {
    if (!pulito(t)) return tutto;
    const m = t.match(/^(\s*)([\s\S]*?)(\s*)$/);
    avvolte.push(rigaDi(src, a) + ': ' + m[2]);
    return '>' + m[1] + '${' + dentro(m[2]) + '}' + m[3] + '<';
  });

  mod = mod.replace(/((?:placeholder|title|alt|aria-label)=")([^"]{5,})(")/g, (tutto, p, t, q) => {
    if (!pulito(t)) return tutto;
    avvolte.push(rigaDi(src, a) + ': ' + t);
    return p + '${' + dentro(t) + '}' + q;
  });

  if (mod !== testo) { pezzi.push(src.slice(ultimo, a), mod); ultimo = b; }
}
pezzi.push(src.slice(ultimo));

console.log(avvolte.length + ' frasi' + (prova ? ' da avvolgere' : ' avvolte') + ' in ' + file + ':');
avvolte.forEach(x => console.log('  ' + x));

if (!prova) {
  writeFileSync(join(root, file), pezzi.join(''));
  console.log("\nOra: node tools/i18n-mancanti.mjs per l'elenco da tradurre.");
}
