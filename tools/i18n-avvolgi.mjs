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
// Riconoscere dove sta il TESTO dentro un file pieno di template annidati.
//
// La prima versione cercava la fine di un template annidato scorrendo fino al
// backtick successivo, senza saltare le ${} che stanno dentro. Su una cosa
// come `${sug.map(s => `<div>${x}</div>`)}` finiva sul backtick sbagliato e da
// li' in poi leggeva tutto storto: intere schermate restavano fuori, in
// silenzio. Erano una cinquantina di frasi.
//
// Ora sono due funzioni che si richiamano — un template contiene espressioni,
// un'espressione contiene template — che e' la forma vera del problema.

function fineStringa(s, i) {
  const q = s[i];
  let j = i + 1;
  while (j < s.length) {
    if (s[j] === '\\') { j += 2; continue; }
    if (s[j] === q) return j + 1;
    j++;
  }
  return j;
}

// `inizio` punta al backtick di apertura. Rende [posizioneDopoIlTemplate, regioni].
function leggiTemplate(s, inizio) {
  const regioni = [];
  let j = inizio + 1, testoDa = j;
  while (j < s.length) {
    if (s[j] === '\\') { j += 2; continue; }
    if (s[j] === '`') { regioni.push([testoDa, j]); return [j + 1, regioni]; }
    if (s[j] === '$' && s[j + 1] === '{') {
      regioni.push([testoDa, j]);
      const [fine, dentro] = leggiEspressione(s, j + 2);
      regioni.push(...dentro);
      j = fine; testoDa = j; continue;
    }
    j++;
  }
  regioni.push([testoDa, j]);
  return [j, regioni];
}

// `inizio` punta al primo carattere dopo `${`. Rende [posizioneDopoLaGraffa, regioni].
function leggiEspressione(s, inizio) {
  const regioni = [];
  let j = inizio, liv = 1;
  while (j < s.length && liv > 0) {
    const c = s[j];
    if (c === '\\') { j += 2; continue; }
    if (c === '/' && s[j + 1] === '/') { const k = s.indexOf('\n', j); j = k < 0 ? s.length : k; continue; }
    if (c === '/' && s[j + 1] === '*') { const k = s.indexOf('*/', j); j = k < 0 ? s.length : k + 2; continue; }
    if (c === "'" || c === '"') { j = fineStringa(s, j); continue; }
    if (c === '`') { const [fine, dentro] = leggiTemplate(s, j); regioni.push(...dentro); j = fine; continue; }
    if (c === '{') liv++;
    if (c === '}') { liv--; if (liv === 0) return [j + 1, regioni]; }
    j++;
  }
  return [j, regioni];
}

function regioniTemplate(s) {
  const out = [];
  let i = 0;
  while (i < s.length) {
    const c = s[i];
    if (c === '\\') { i += 2; continue; }
    if (c === '/' && s[i + 1] === '/') { const k = s.indexOf('\n', i); i = k < 0 ? s.length : k; continue; }
    if (c === '/' && s[i + 1] === '*') { const k = s.indexOf('*/', i); i = k < 0 ? s.length : k + 2; continue; }
    if (c === "'" || c === '"') { i = fineStringa(s, i); continue; }
    if (c === '`') { const [fine, regioni] = leggiTemplate(s, i); out.push(...regioni); i = fine; continue; }
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

// --copre="testo": dice se quel punto del file sta dentro una regione
// riconosciuta, e con quale. Serve quando una frase non viene avvolta e non si
// capisce se e' il riconoscitore a non arrivarci o pulito() a rifiutarla.
const copre = (args.find(a => a.startsWith('--copre=')) || '').slice(8);
if (copre) {
  const i = src.indexOf(copre);
  if (i < 0) { console.log('quel testo non compare nel file'); process.exit(1); }
  const dentro = regioni.find(([a, b]) => i >= a && i < b);
  console.log('offset ' + i + ' · riga ' + rigaDi(src, i));
  console.log(dentro ? 'DENTRO la regione [' + dentro[0] + ', ' + dentro[1] + ']'
                     : 'FUORI da ogni regione: il riconoscitore non ci arriva');
  if (dentro) console.log('pulito(): ' + pulito(copre));
  process.exit(0);
}

console.log(avvolte.length + ' frasi' + (prova ? ' da avvolgere' : ' avvolte') + ' in ' + file + ':');
avvolte.forEach(x => console.log('  ' + x));

if (!prova) {
  writeFileSync(join(root, file), pezzi.join(''));
  console.log("\nOra: node tools/i18n-mancanti.mjs per l'elenco da tradurre.");
}
