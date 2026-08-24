// Prova il nucleo di live.js: la sostituzione dello stato e i gestori delle
// azioni. Niente DOM e niente rete — data.js è sostituito da un finto che
// registra le chiamate, così si verifica COSA viene chiesto al database.
//
//   node app/test/live.test.mjs
import assert from 'node:assert/strict';
import { register } from 'node:module';
import { pathToFileURL } from 'node:url';

/* Sostituisce ./data.js con un finto, prima che live.js lo importi. */
const calls = [];
const fake = new Proxy({}, {
  get: (_, name) => {
    if (name === 'then') return undefined;         // non è una promise
    return async (...args) => {
      calls.push({ name, args });
      if (name === 'createGroup')   return 'g-nuovo';
      if (name === 'createSection') return 's-nuova';
      if (name === 'loadState')     return { me: 'u1', people: {}, groups: {}, plans: {} };
      return null;
    };
  }
});

register('data:text/javascript,' + encodeURIComponent(`
  export async function resolve(spec, ctx, next) {
    if (spec.endsWith('/data.js') || spec === './data.js')
      return { url: 'fake:data', shortCircuit: true };
    return next(spec, ctx);
  }
  export async function load(url, ctx, next) {
    if (url === 'fake:data') return {
      format: 'module', shortCircuit: true,
      source: 'const f = globalThis.__fakeData; export default f;' +
              ${JSON.stringify(
                ['init','ensureSession','loadState','createGroup','updateGroup','createSection',
                 'setGroupSection','leaveGroup','removeGroupMember','addComment','deletePlace',
                 'addExpense'].map(n => `export const ${n} = (...a) => f.${n}(...a);`).join('')
              )}
    };
    return next(url, ctx);
  }
`), pathToFileURL('./'));

globalThis.__fakeData = fake;
const live = await import('../live.js');

let passed = 0, failed = 0;
const test = async (name, fn) => {
  calls.length = 0;
  try { await fn(); passed++; console.log('  ok   ' + name); }
  catch (e) { failed++; console.log('  FAIL ' + name + '\n       ' + e.message); }
};

console.log('\nlive.js — aggancio del prototipo al database\n');

/* ------------------------------------------------------------------ */
await test('applyState svuota i dati vecchi invece di sovrapporsi', () => {
  const state = {
    people: { vecchio: {} }, groups: { g0: {} }, plans: { p0: {} },
    me: 'org', settings: { push: true }, cal: { y: 2026 }
  };
  live.applyState(state, {
    me: 'u1', people: { u1: { name: 'Anna' } }, groups: { g1: {} }, plans: {}
  });

  assert.deepEqual(Object.keys(state.groups), ['g1'], 'il gruppo finto è rimasto');
  assert.equal(state.plans.p0, undefined, 'il piano di prova è rimasto');
  assert.equal(state.me, 'u1');
  // Le preferenze di sessione non stanno nel database: non vanno buttate.
  assert.deepEqual(state.settings, { push: true });
  assert.deepEqual(state.cal, { y: 2026 });
});

await test('applyState muta l\'oggetto invece di riassegnarlo', () => {
  const state = { people: {}, groups: {}, plans: {} };
  const ref = state.groups;
  live.applyState(state, { me: 'u1', people: {}, groups: { g1: { id: 'g1' } }, plans: {} });
  // Nel prototipo `state` è un const e le viste tengono riferimenti:
  // riassegnare romperebbe tutto in silenzio.
  assert.equal(state.groups, ref, 'il riferimento a groups è cambiato');
  assert.equal(ref.g1.id, 'g1');
});

/* ------------------------------------------------------------------ */
await test('saveGroup crea il gruppo e gli attacca la sezione', async () => {
  const K = { state: { gdraft: { id: null, name: ' Padel ', emoji: '🎾',
                                 color: '#34C759', sectionId: 's1', members: new Set() } } };
  const res = await live.HANDLERS.saveGroup(null, K);

  assert.deepEqual(calls.map(c => c.name), ['createGroup', 'setGroupSection']);
  assert.deepEqual(calls[0].args, ['Padel', '🎾', '#34C759'], 'il nome va ripulito');
  assert.deepEqual(calls[1].args, ['g-nuovo', 's1'], 'la sezione va sull\'id appena creato');
  assert.equal(res.closeSheet, true);
});

await test('saveGroup su un gruppo esistente aggiorna, non ne crea un altro', async () => {
  const K = { state: { gdraft: { id: 'g1', name: 'Padel', emoji: '🎾',
                                 color: '#000000', sectionId: '', members: new Set() } } };
  await live.HANDLERS.saveGroup(null, K);
  assert.deepEqual(calls.map(c => c.name), ['updateGroup', 'setGroupSection']);
  assert.equal(calls[1].args[1], null, 'sezione vuota = staccato da ogni sezione');
});

await test('saveGroup crea prima la sezione nuova, poi ci mette il gruppo', async () => {
  const K = { state: { gdraft: { id: null, name: 'Amici', emoji: '🎉', color: '#007AFF',
                                 sectionId: 'new', newSection: ' Roma ', members: new Set() } } };
  await live.HANDLERS.saveGroup(null, K);
  assert.deepEqual(calls.map(c => c.name), ['createGroup', 'createSection', 'setGroupSection']);
  assert.deepEqual(calls[1].args, ['Roma']);
  assert.deepEqual(calls[2].args, ['g-nuovo', 's-nuova']);
});

await test('saveGroup senza nome non tocca il database', async () => {
  const K = { state: { gdraft: { id: null, name: '   ', emoji: '🎉', color: '#007AFF' } } };
  const res = await live.HANDLERS.saveGroup(null, K);
  assert.equal(calls.length, 0, 'ha scritto comunque');
  assert.equal(res.skipReload, true);
  assert.match(res.toast, /nome/i);
});

/* ------------------------------------------------------------------ */
await test('comment manda il testo e svuota il campo', async () => {
  let value = '  ci sto  ';
  const K = {
    $: () => ({ get value() { return value; }, set value(v) { value = v; } }),
    state: { currentPlan: 'p1', plans: { p1: { id: 'p1' } } }
  };
  await live.HANDLERS.comment(null, K);
  assert.deepEqual(calls[0], { name: 'addComment', args: ['p1', 'ci sto'] });
  assert.equal(value, '', 'il campo va svuotato dopo l\'invio');
});

await test('comment vuoto non scrive niente', async () => {
  const K = { $: () => ({ value: '   ' }), state: { currentPlan: 'p1', plans: { p1: {} } } };
  const res = await live.HANDLERS.comment(null, K);
  assert.equal(calls.length, 0);
  assert.equal(res.skipReload, true);
});

/* ------------------------------------------------------------------ */
await test('addExpense passa i centesimi interi e chi divide', async () => {
  const K = { state: { currentPlan: 'p1', plans: { p1: { id: 'p1' } },
                       xdraft: { amount: 1000, text: 'Pizza', among: new Set(['u1', 'u2']) } } };
  await live.HANDLERS.addExpense(null, K);
  const a = calls[0].args;
  assert.equal(a[0], 'p1');
  assert.equal(a[1], 1000);
  assert.equal(Number.isInteger(a[1]), true, 'mai virgola mobile sui soldi');
  assert.deepEqual(a[3].sort(), ['u1', 'u2'], 'il Set va convertito in lista');
});

await test('leaveGroup esce e torna alla home', async () => {
  const res = await live.HANDLERS.leaveGroup({ dataset: { g: 'g1' } }, {});
  assert.deepEqual(calls[0], { name: 'leaveGroup', args: ['g1'] });
  assert.equal(res.go, 'home');
});

/* ------------------------------------------------------------------ */
await test('ogni azione intercettata ha un gestore vero', () => {
  for (const [name, fn] of Object.entries(live.HANDLERS)) {
    assert.equal(typeof fn, 'function', name + ' non è una funzione');
  }
  // Se un'azione finisce qui dentro ma non sa scrivere, il prototipo non la
  // gestisce più e il bottone smette di funzionare in silenzio.
  assert.ok(Object.keys(live.HANDLERS).length > 0);
});

console.log(`\n${passed} passati, ${failed} falliti\n`);
process.exit(failed ? 1 : 0);
