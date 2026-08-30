// Confronta gli eventi che la ROADMAP-V1 chiede con quelli che il codice
// registra davvero.
//
// Le analytics sono l'unica cosa che al lancio non si puo' recuperare a
// posteriori: un evento non registrato il giorno del lancio e' un dato perso
// per sempre. Meglio saperlo prima.
//
//   node tools/controlla-eventi.mjs
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const src = ['app/data.js', 'app/live.js', 'app/index.html', 'index.html']
  .map(f => { try { return readFileSync(join(root, f), 'utf8'); } catch { return ''; } })
  .join('\n');

// Prima versione: /logEvent\('([a-z_]+)'/ — non vedeva
// `logEvent(inCorso ? 'guest_to_account' : 'signup')` e dava per mancanti due
// eventi che c'erano. Uno strumento che sbaglia e' peggio di nessuno
// strumento (lezione 3 di STATO.md). Ora si prende TUTTO l'argomento e da
// li' si tirano fuori le stringhe, ternari compresi.
const presenti = new Set();
for (const m of src.matchAll(/logEvent\(([^)]*)\)/g)) {
  for (const s of m[1].matchAll(/'([a-z_]+)'/g)) presenti.add(s[1]);
}

// L'elenco minimo della ROADMAP-V1, sezione Analytics.
const CHIESTI = ['signup', 'plan_created', 'share_clicked', 'invite_link_opened',
  'guest_joined', 'vote_submitted', 'plan_confirmed', 'rsvp_submitted',
  'group_created', 'second_plan_created', 'guest_to_account', 'unlimited_viewed',
  'subscription_started', 'event_pass_started'];

// Lo stesso fatto con un altro nome.
const ALIAS = { invite_link_opened: 'invite_opened' };

// Eventi che NON si registrano, e perche'. Un elenco corto e motivato: senza,
// diventa il modo comodo per far tacere lo strumento.
const NON_SI_REGISTRANO = {
  second_plan_created:
    'si ricava contando plan_created per organizzatore — registrarlo a parte\n' +
    '              vorrebbe dire tenere un contatore nel client, che sbaglia appena\n' +
    '              qualcuno usa due telefoni. E\' gia\' il gate dei 10 gruppi in CLAUDE.md.',
  unlimited_viewed:     'i pagamenti non esistono ancora (STATO.md): registrare un evento',
  subscription_started: 'che non puo\' accadere significa avere una metrica sempre a zero',
  event_pass_started:   'e non sapere se e\' zero perche\' non funziona o perche\' non c\'e\'.',
};

console.log('\nanalytics — l\'elenco della roadmap contro il codice\n');
let ci = 0, mancano = 0, rimandati = 0;
for (const e of CHIESTI) {
  const vero = ALIAS[e] && presenti.has(ALIAS[e]) ? ALIAS[e] : e;
  if (presenti.has(vero)) {
    console.log('  c\'e\'      ' + e.padEnd(22) + (vero !== e ? 'si chiama ' + vero : ''));
    ci++;
  } else if (NON_SI_REGISTRANO[e]) {
    console.log('  rimandato ' + e.padEnd(22) + NON_SI_REGISTRANO[e]);
    rimandati++;
  } else {
    console.log('  MANCA     ' + e);
    mancano++;
  }
}

const extra = [...presenti].filter(p => !CHIESTI.includes(p) && !Object.values(ALIAS).includes(p));
console.log('\n' + ci + ' registrati · ' + rimandati + ' rimandati con un motivo · ' + mancano + ' mancanti');
if (extra.length) console.log('registrati ma non chiesti dalla roadmap: ' + extra.join(', '));
console.log('');
process.exit(mancano ? 1 : 0);
