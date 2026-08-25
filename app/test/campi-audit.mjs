// Cerca la famiglia di difetti che il 26/8/2026 ha rotto la conferma.
//
// map.js traduce le righe del database nelle forme che il prototipo legge. Se
// dimentica un campo non succede niente di rumoroso: il prototipo legge
// undefined e tira dritto — finché non ci chiama sopra un metodo. È così che
// c.text.replace() ha ucciso render() alla prima conferma di un piano, dopo
// settimane in cui tutto sembrava a posto.
//
// Qui si guarda il prototipo, si raccolgono i campi che legge su ogni voce
// tradotta, e si confrontano con quelli che map.js produce davvero.
//
// È un setaccio, non una prova: dice dove guardare. Che un campo esca da qui
// non vuol dire che sia rotto — vuol dire che va guardato a mano.
//
//   node app/test/campi-audit.mjs
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const proto = readFileSync(join(root, 'app', 'index.html'), 'utf8');
const map = readFileSync(join(root, 'app', 'map.js'), 'utf8');

// (nome leggibile, raccolta dentro il piano, variabile con cui il prototipo la scorre)
const RACCOLTE = [
  ['storia del piano', 'changes', 'c'],
  ['commenti', 'comments', 'c'],
  ['partecipanti', 'participants', 'x'],
  ['proposte', 'proposals', 'x'],
  ['spese', 'expenses', 'e'],
  ['foto', 'photos', 'x'],
  ['file', 'files', 'x']
];

const ident = ch => /[A-Za-z0-9_$]/.test(ch);

// Tutte le posizioni in cui il prototipo comincia a scorrere una raccolta.
function puntiDiScorrimento(racc, varName) {
  const punti = [];
  const ago = '.' + racc + '.';
  let i = 0;
  while ((i = proto.indexOf(ago, i)) !== -1) {
    const resto = proto.slice(i + ago.length, i + ago.length + 60);
    // ...forEach(c => ... / .map(c => ... / .map((c, n) => ...
    if (/^(map|forEach|filter|some|find|reduce)\s*\(\s*\(?\s*/.test(resto)) {
      const dopo = resto.replace(/^(map|forEach|filter|some|find|reduce)\s*\(\s*\(?\s*/, '');
      if (dopo.startsWith(varName) && !ident(dopo[varName.length] || '')) punti.push(i);
    }
    i += ago.length;
  }
  return punti;
}

// I campi letti su quella variabile, nel pezzo di codice che segue.
function campiLetti(punti, varName) {
  const campi = new Set();
  const ago = varName + '.';
  for (const p of punti) {
    const pezzo = proto.slice(p, p + 1400);
    let i = 0;
    while ((i = pezzo.indexOf(ago, i)) !== -1) {
      const prima = pezzo[i - 1] || ' ';
      if (!ident(prima) && prima !== '.') {
        let j = i + ago.length, nome = '';
        while (j < pezzo.length && ident(pezzo[j])) nome += pezzo[j++];
        // esclude le chiamate: c.text.replace(...) interessa come 'text'
        if (nome && pezzo[j] !== '(') campi.add(nome);
      }
      i += ago.length;
    }
  }
  return campi;
}

// Un campo è "prodotto" se il suo nome compare in map.js. Volutamente
// generoso: si vuole un elenco corto da leggere, non un verdetto automatico.
const prodotto = f => new RegExp('\\b' + f + '\\b').test(map);

let daGuardare = 0;
console.log('\ncampi che il prototipo legge sulle voci tradotte\n');

for (const [nome, racc, varName] of RACCOLTE) {
  const punti = puntiDiScorrimento(racc, varName);
  if (!punti.length) { console.log('  ?    ' + nome + ' (' + racc + '): nessuno scorrimento trovato'); continue; }
  const letti = campiLetti(punti, varName);
  const mancanti = [...letti].filter(f => !prodotto(f)).sort();
  if (mancanti.length) {
    daGuardare += mancanti.length;
    console.log('  !    ' + nome + ' (' + racc + '): ' + mancanti.join(', '));
  } else {
    console.log('  ok   ' + nome + ' (' + racc + '): ' + letti.size + ' campi, tutti presenti in map.js');
  }
}

console.log('\n' + (daGuardare ? daGuardare + ' campi da guardare a mano' : 'niente da segnalare') + '\n');

if (daGuardare) {
  console.log("Se sono falsi allarmi, toglili dall'elenco spiegando perche'.");
  console.log('Se no, il prototipo sta leggendo undefined, e prima o poi ci');
  console.log("chiama sopra un metodo: e' cosi' che e' morta la conferma.\n");
}
process.exit(daGuardare ? 1 : 0);
