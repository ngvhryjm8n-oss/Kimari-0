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

/* ---------- le azioni che esistono ---------- */
// Nel prototipo, ma anche quelle che live.js si crea da sé: alcune schermate
// (l'invito a un gruppo) non esistono nel prototipo e le genera lui.
const azioniNelMarkup = new Set([
  ...[...html.matchAll(/data-action="([a-zA-Z]+)"/g)].map(m => m[1]),
  ...[...liveSrc.matchAll(/data-action="([a-zA-Z]+)"/g)].map(m => m[1])
]);

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
// Falsi positivi dell'euristica: modificano state.draft, cioè un piano che
// nel database non esiste ancora. Diventano scrittura solo alla creazione,
// dentro create_plan_full.
const SOLO_BOZZA = ['addDOpt', 'rmDOpt', 'addXOpt', 'rmXOpt',
                    'quickWhen', 'addWhen', 'quickWhere', 'addWhere'];

const scriventi = [...casi.keys()]
  .filter(n => SCRIVE.test(casi.get(n) || ''))
  .filter(n => !SOLO_BOZZA.includes(n));
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

/* ---------- 3. le capacità scritte e mai offerte ---------- */
// data.js parla col database. Una funzione esportata che nessuno chiama non è
// codice morto innocuo: è una cosa che l'utente NON può fare, anche se sotto
// è tutto pronto.
//
// cancelPlan stava lì dal primo giorno — RPC scritta, funzione esportata, il
// sito la usava — ma nell'app non c'era il bottone. Se una cena saltava e eri
// nell'app, l'unica strada era sciogliere il gruppo. Nessuna prova poteva
// vederlo: tutto quello che c'era funzionava.
const dataSrc = readFileSync(join(root, 'app', 'data.js'), 'utf8');
const esportate = [...dataSrc.matchAll(/export (?:async function|const) ([a-zA-Z]+)/g)]
  .map(m => m[1]);

// Chiamate come data.qualcosa(...) da live.js, più quelle che data.js usa al
// proprio interno (init chiama ensureSession, e va bene così).
const usate = new Set([
  ...[...liveSrc.matchAll(/data\.([a-zA-Z]+)\s*\(/g)].map(m => m[1]),
  ...[...dataSrc.matchAll(/(?<!export (?:async function|const) )\b([a-zA-Z]+)\s*\(/g)].map(m => m[1])
]);

// Non tutte devono essere chiamate da live.js: alcune servono all'avvio o alle
// prove. Si elencano a mano, con il motivo, perché un elenco che cresce da solo
// smette di dire qualcosa.
const NON_DA_BOTTONE = new Set([
  // servono all'avvio, non a un bottone
  'init', 'ensureSession', 'currentSession', 'loadState', 'saveToken',
  'savedTokens', 'previewInvite', 'previewGroupInvite',
  'tornandoDaLogin', 'aspettaSessione', 'pulisciUrlDopoLogin', 'haIdentitaVera',
  'adottaIdentitaGoogle', 'signInWithProvider', 'urlFor',
  // sostituite dalla 0010: create_plan_full fa tutto in una transazione, cosi'
  // un piano non puo' piu' restare mezzo creato. Restano esportate perche' il
  // sito V0 le usa ancora.
  'createPlan', 'finalizePlan'
]);

// Pronte sotto ma senza un bottone sopra. Non sono difetti da correggere di
// corsa: sono decisioni, scritte qui perché non si dimentichino. Un controllo
// che fallisce sempre smette di dire qualcosa, quindi queste si elencano e
// basta; fallisce solo quello che è scollegato per distrazione.
const DA_OFFRIRE = {
  // planBalances resta scollegata di proposito, non per dimenticanza.
  //
  // Il prototipo calcola i saldi in locale e li disegna senza aspettare la
  // rete: chiamare il server a ogni ridisegno aggiungerebbe un viaggio per
  // mostrare numeri che si hanno già. Il rischio di due implementazioni della
  // stessa regola è che divergano, quindi il 26/8/2026 le ho confrontate
  // contro la produzione sul caso che le fa divergere davvero — qualcuno che
  // cancella l'account lasciando una quota nelle spese:
  //
  //   A paga 30 divisi fra A e B, poi B cancella l'account
  //   server:  A +1500, B -1500   (invariati dopo la cancellazione)
  //   locale:  A +1500, B -1500   (prova in app/test/benvenuto.test.mjs)
  //
  // Entrambe seguono la stessa regola: chi compare NEI CONTI, non chi è nel
  // piano. Se una delle due cambia, quella prova lo dice.
  planBalances: "i conti li fa il prototipo in locale; il server concorda (verificato 26/8)",
  mediaUrl: "usata solo indirettamente, dentro loadState"
};

const mai = esportate.filter(n => !usate.has(n) && !NON_DA_BOTTONE.has(n));
const inattese = mai.filter(n => !DA_OFFRIRE[n]);

console.log('');
if (inattese.length) {
  console.log('  !    scritte in data.js e nessuno le chiama: ' + inattese.join(', '));
  console.log("       (o si collega un bottone, o si scrive in DA_OFFRIRE perché no)");
  process.exitCode = 1;
} else {
  console.log('  ok   nessuna capacità scollegata per distrazione');
}

const attese = mai.filter(n => DA_OFFRIRE[n]);
if (attese.length) {
  console.log('\n  pronte sotto, ancora senza bottone sopra:');
  attese.forEach(n => console.log('    · ' + n + ' — ' + DA_OFFRIRE[n]));
}
