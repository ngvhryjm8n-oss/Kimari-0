// Che cosa manca da agganciare al database.
//
// Legge le azioni del prototipo, guarda cosa fa ciascuna nel suo dispatcher, e
// le divide in tre: già convertite, ancora da convertire, e quelle che NON
// vanno convertite perché toccano solo l'interfaccia (aprire uno sheet,
// cambiare passo, selezionare un'opzione).
//
// Fallisce se live.js intercetta un'azione che nel prototipo non esiste: un
// nome scritto male lì dentro non lo segnala nessuno — il bottone smette e
// basta.
//
//   node app/test/wiring-audit.mjs
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const html = readFileSync(join(root, 'app', 'index.html'), 'utf8');
const liveSrc = readFileSync(join(root, 'app', 'live.js'), 'utf8');

/* ---------- le azioni che esistono nel prototipo ---------- */
const azioniNelMarkup = new Set(
  [...html.matchAll(/data-action="([a-zA-Z]+)"/g)].map(m => m[1]));

/* ---------- il corpo di ogni case del dispatcher ---------- */
const start = html.indexOf("document.addEventListener('click'");
const disp = html.slice(start);
const casi = new Map();
const reCase = /case '([a-zA-Z]+)':/g;
let m, prev = null, prevIdx = 0;
while ((m = reCase.exec(disp))) {
  if (prev) casi.set(prev, disp.slice(prevIdx, m.index));
  prev = m[1]; prevIdx = m.index;
}
if (prev) casi.set(prev, disp.slice(prevIdx, prevIdx + 2000));

// Un'azione "scrive" se nel prototipo cambia qualcosa che nel database
// esisterebbe. È un'euristica, non un oracolo: se sbaglia su un caso si
// aggiunge il motivo qui sotto invece di aggiustarlo a mano nell'elenco.
const SCRIVE = new RegExp([
  /\.push\(/,                                    // aggiunta a una lista
  /\.splice\(/,                                  // rimozione
  /state\.(plans|groups|people)\[[^\]]+\]\s*=/,
  /\bdelete (state|me\(\))\./,
  /Object\.assign\(state\.(plans|groups)/,
  /\.ballots\[/,                                 // il voto
  /\.(rsvp|late|voided|status|email|unlimited|admins|members|muted)\s*=/,
  /\b(createPlan|createDecision|joinPlan|confirmPlan|editPlan|savePlace|addMemberToGroup|removeMemberFromGroup|openProposal|voteProposal|applyProposal|rejectProposal|sysComment|mergePersona)\(/
].map(r => r.source).join('|'));

/* ---------- quelle già convertite ---------- */
// Solo dentro l'oggetto HANDLERS: fuori ci sono funzioni esportate che non
// sono gestori (applyState, reload, boot) e non vanno contate.
const blocco = liveSrc.slice(liveSrc.indexOf('export const HANDLERS'),
                             liveSrc.indexOf('/* aggancio al DOM'));
const convertite = new Set(
  [...blocco.matchAll(/^\s{2}(?:async\s+)?([a-zA-Z]+)\s*[:(]/gm)].map(x => x[1])
    .filter(n => !['when', 'run', 'if', 'for', 'return', 'const', 'let'].includes(n)));

/* ------------------------------------------------------------------ */
console.log('\nwiring — quanto manca\n');

// 1. Nessun gestore deve puntare a un'azione che non esiste.
const fantasma = [...convertite].filter(n => !azioniNelMarkup.has(n) && casi.has(n) === false);
try {
  assert.deepEqual(fantasma, [], 'gestori per azioni inesistenti: ' + fantasma.join(', '));
  console.log('  ok   ogni gestore punta a un\'azione che esiste davvero');
} catch (e) {
  console.log('  FAIL ' + e.message);
  process.exitCode = 1;
}

// 2. Il quadro.
const scriventi = [...casi.keys()].filter(n => SCRIVE.test(casi.get(n) || ''));
const fatte     = scriventi.filter(n => convertite.has(n));
const restano   = scriventi.filter(n => !convertite.has(n));
const soloUI    = [...casi.keys()].filter(n => !SCRIVE.test(casi.get(n) || ''));

const riga = (etichetta, arr) =>
  console.log(`\n  ${etichetta} (${arr.length})\n    ` +
              (arr.length ? arr.join(', ') : '—'));

console.log(`\n  azioni totali nel prototipo: ${casi.size}`);
riga('CONVERTITE — scrivono sul database', fatte);
riga('DA CONVERTIRE — oggi scrivono solo in locale', restano);
riga('solo interfaccia — non vanno convertite', soloUI);

const pct = scriventi.length ? Math.round(fatte.length / scriventi.length * 100) : 100;
console.log(`\n  ${fatte.length} su ${scriventi.length} azioni che scrivono: ${pct}%\n`);
