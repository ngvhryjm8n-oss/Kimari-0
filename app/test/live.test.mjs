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
                 'setGroupSection','leaveGroup','removeGroupMember','setGroupAdmin',
                 'revokeGroupInvites','addComment','deletePlace','savePlace','setMyEmail',
                 'addExpense','voidExpense','addSettlement','submitBallot','submitExtraBallot',
                 'setRsvp','addCandidates','confirmPlan','confirmExtra','openProposal',
                 'voteProposal','applyProposal','closeProposal','addPlanExtra','removePlanExtra'].map(n => `export const ${n} = (...a) => f.${n}(...a);`).join('')
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
await test('saveExpense legge edraft e converte gli euro in centesimi', async () => {
  // Attenzione: le spese stanno in edraft, non in xdraft (che è delle domande),
  // e l'azione è saveExpense — addExpense apre solo lo sheet.
  const K = { state: { currentPlan: 'p1',
                       plans: { p1: { id: 'p1', participants: [{ id: 'u1' }, { id: 'u2' }] } },
                       edraft: { amount: '12,50', desc: ' Pizza ', payer: 'u1', among: 'all' } } };
  await live.HANDLERS.saveExpense(null, K);
  const a = calls[0].args;
  assert.equal(calls[0].name, 'addExpense');
  assert.equal(a[1], 1250, '12,50 € devono diventare 1250 centesimi');
  assert.equal(Number.isInteger(a[1]), true, 'mai virgola mobile sui soldi');
  assert.equal(a[2], 'Pizza');
  assert.deepEqual(a[3].sort(), ['u1', 'u2']);
});

await test('saveExpense con importo scritto male non scrive niente', async () => {
  const K = { state: { currentPlan: 'p1', plans: { p1: { id: 'p1', participants: [] } },
                       edraft: { amount: 'boh', desc: 'Pizza', payer: 'u1', among: 'all' } } };
  const res = await live.HANDLERS.saveExpense(null, K);
  assert.equal(calls.length, 0);
  assert.match(res.toast, /Importo/);
});

await test('vote manda un ballot per ogni campo in votazione', async () => {
  const K = { state: {
    currentPlan: 'p1',
    plans: { p1: { id: 'p1',
      when:  { mode: 'deciding' }, where: { mode: 'fixed' },
      extras: [{ id: 'e1', mode: 'deciding' }, { id: 'e2', mode: 'fixed' }] } },
    ballotDraft: {
      when: { approved: new Set(['c1', 'c2']), noneOk: false, note: 'non tardi' },
      e1:   { approved: new Set(['x1']), noneOk: false, note: '' }
    }
  } };
  const res = await live.HANDLERS.vote(null, K);

  // when → submit_ballot; la domanda extra → submit_extra_ballot; where e la
  // domanda già decisa non si toccano.
  assert.deepEqual(calls.map(c => c.name), ['submitBallot', 'submitExtraBallot']);
  assert.deepEqual([...calls[0].args[2]].sort(), ['c1', 'c2']);
  assert.equal(calls[0].args[3], 'non tardi');
  assert.equal(calls[1].args[0], 'e1');
  assert.equal(K.state.ballotDraft, null, 'la bozza va buttata: si ricarica dai dati veri');
  assert.equal(res.toast, 'Voto inviato');
});

await test('vote si ferma se un campo è rimasto in bianco', async () => {
  const K = { state: { currentPlan: 'p1',
    plans: { p1: { id: 'p1', when: { mode: 'deciding' }, where: { mode: 'deciding' }, extras: [] } },
    ballotDraft: { when: { approved: new Set(['c1']), noneOk: false },
                   where: { approved: new Set(), noneOk: false } } } };
  const res = await live.HANDLERS.vote(null, K);
  assert.equal(calls.length, 0, 'non deve mandare un voto a metà');
  assert.equal(res.skipReload, true);
});

await test('ynVote salva solo sui piani "decisione", altrimenti lascia fare', async () => {
  const decisione = { state: { currentPlan: 'p1', plans: { p1: { id: 'p1', kind: 'decision' } } } };
  const normale   = { state: { currentPlan: 'p1', plans: { p1: { id: 'p1', kind: 'plan' } } } };
  assert.equal(live.HANDLERS.ynVote.when(null, decisione), true);
  assert.equal(live.HANDLERS.ynVote.when(null, normale), false,
    'su un piano normale toccare un\'opzione è solo una selezione');
});

await test('campiInVoto elenca solo quello che si sta ancora decidendo', () => {
  const p = { when: { mode: 'fixed' }, where: { mode: 'deciding' },
              extras: [{ id: 'e1', mode: 'deciding' }, { id: 'e2', mode: 'fixed' }] };
  assert.deepEqual(live.campiInVoto(p), ['where', 'e1']);
});

await test('confirm conferma le domande extra a parte da quando/dove', async () => {
  const K = { state: { currentPlan: 'p1',
    plans: { p1: { id: 'p1', when: { mode: 'deciding' }, where: { mode: 'fixed' } } },
    picks: { when: 'c1', e1: 'x2' } } };
  await live.HANDLERS.confirm(null, K);
  assert.deepEqual(calls.map(c => c.name), ['confirmExtra', 'confirmPlan']);
  assert.deepEqual(calls[0].args, ['e1', 'x2']);
  assert.deepEqual(calls[1].args, ['p1', 'c1', null]);
});

await test('saveExtra su un piano avviato scrive, in creazione no', async () => {
  const inCreazione = { state: { draft: { extras: [] }, currentPlan: null, plans: {} } };
  assert.equal(live.HANDLERS.saveExtra.when(null, inCreazione), false,
    'in creazione il piano non esiste ancora: deve restare al prototipo');

  const suPiano = { state: { draft: null, currentPlan: 'p1', plans: { p1: { id: 'p1' } },
                             xdraft: { question: ' Invitiamo Matteo? ', binary: true, options: [] } } };
  assert.equal(live.HANDLERS.saveExtra.when(null, suPiano), true);
  await live.HANDLERS.saveExtra.run(null, suPiano);
  assert.deepEqual(calls[0], { name: 'addPlanExtra',
                               args: ['p1', 'Invitiamo Matteo?', null, true] });
});

await test('leaveGroup esce e torna alla home', async () => {
  const res = await live.HANDLERS.leaveGroup({ dataset: { g: 'g1' } }, {});
  assert.deepEqual(calls[0], { name: 'leaveGroup', args: ['g1'] });
  assert.equal(res.go, 'home');
});

/* ------------------------------------------------------------------ */
await test('ogni azione intercettata sa davvero scrivere', () => {
  // Se un'azione finisce nella tabella ma non ha un gestore valido, il
  // prototipo non la gestisce più e il bottone smette di funzionare in
  // silenzio: peggio di non averla intercettata affatto.
  for (const [name, h] of Object.entries(live.HANDLERS)) {
    const run = typeof h === 'function' ? h : h.run;
    assert.equal(typeof run, 'function', name + ' non ha un gestore eseguibile');
    if (typeof h !== 'function') {
      assert.equal(typeof h.when, 'function',
        name + ' ha la forma {when, run} ma when non è una funzione');
    }
  }
  assert.ok(Object.keys(live.HANDLERS).length >= 20);
});

console.log(`\n${passed} passati, ${failed} falliti\n`);
process.exit(failed ? 1 : 0);
