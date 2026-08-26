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
// Per provare i percorsi d'errore: guasti[nome] = { alla: n, messaggio: '...' }
// fa fallire l'n-esima chiamata a quella funzione. Serve un interruttore qui
// dentro perché il modulo finto cattura il proxy una volta sola al
// caricamento: sostituirlo dopo non avrebbe effetto.
const guasti = {};
const fake = new Proxy({}, {
  get: (_, name) => {
    if (name === 'then') return undefined;         // non è una promise
    return async (...args) => {
      calls.push({ name, args });
      const g = guasti[name];
      if (g && calls.filter(c => c.name === name).length === g.alla) {
        throw new Error(g.messaggio);
      }
      if (name === 'createGroup')    return 'g-nuovo';
      if (name === 'createSection')  return 's-nuova';
      if (name === 'createPlanFull') return { plan_id: 'p-nuovo', token: 'tok-nuovo' };
      if (name === 'loadState')      return { me: 'u1', people: {}, groups: {}, plans: {} };
      return null;
    };
  }
});

register('data:text/javascript,' + encodeURIComponent(`
  export async function resolve(spec, ctx, next) {
    // Il ?v= del timbro fa parte del percorso: senza toglierlo il finto
    // non veniva piu' riconosciuto e tutte le prove sui gestori cadevano.
    const nudo = spec.split('?')[0];
    if (nudo.endsWith('/data.js') || nudo === './data.js')
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
                 'setRsvp','addCandidates','confirmPlan','confirmExtra','openProposal','ensureActor',
                 'signInWithProvider','createPlan','finalizePlan','joinPlan','saveToken','previewInvite','createPlanFull','deleteComment',
                 'setMyLate','clearMyLate','setMyAbsence','setPlanBooked','addFriend',
                 'removeFriend','toggleGroupMute','deleteGroup','transferGroupOwner',
                 'setPlaceCover','deletePlaceMedia','uploadMedia','uploadPlacePhoto','deleteMedia',
                 'setJoinPolicy','addPlanPlaceholder','removePlanPlaceholder','setInviteLimits',
                 'revokeInviteLinks','removeParticipant','createGroupInvite',
                 'previewGroupInvite','joinGroup','currentSession','haIdentitaVera',
                 'adottaIdentitaGoogle','pulisciUrlDopoLogin','signOut','myActor',
                 'voteProposal','applyProposal','closeProposal','addPlanExtra','removePlanExtra',
                 'logEvent','addPlanLink','addPlaceLink','cancelPlan','deleteMyAccount'].map(n => `export const ${n} = (...a) => f.${n}(...a);`).join('')
              )}
    };
    return next(url, ctx);
  }
`), pathToFileURL('./'));

globalThis.__fakeData = fake;

// live.js compone i link dall'indirizzo su cui gira. In Node non c'è, quindi
// se ne mette uno finto: senza, i gestori che costruiscono un link fallirebbero
// con "location is not defined" invece di dire qualcosa di utile.
globalThis.location = {
  origin: 'https://esempio.test',
  pathname: '/Kimari-0/app/',
  hash: ''
};

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

await test('chi ha un profilo non si rivede la schermata di benvenuto', () => {
  // IL BUG che sembrava un login rotto. Il prototipo riapre il benvenuto
  // finché state.consented è falso, e consented vive in memoria: ogni
  // ricarica lo azzerava e a chi era già dentro ricompariva "Continua con
  // Google", come se il login non fosse mai avvenuto.
  const state = { people: {}, groups: {}, plans: {}, me: 'guest',
                  consented: false, ageOk: false, welcomeShown: false };
  live.applyState(state, { me: 'a-1', people: { 'a-1': { name: 'Vincenzo' } },
                           groups: {}, plans: {} });
  assert.equal(state.consented, true, 'chi ha un profilo è già passato dalla porta');
  assert.equal(state.welcomeShown, true);
  assert.equal(state.ageOk, true);
});

await test('un ospite vero il benvenuto lo deve vedere', () => {
  const state = { people: {}, groups: {}, plans: {}, me: 'x',
                  consented: false, ageOk: false, welcomeShown: false };
  live.applyState(state, { me: 'guest', people: {}, groups: {}, plans: {} });
  assert.equal(state.consented, false, 'senza profilo la porta va mostrata');
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
  // logEvent in coda: il funnel del gate dei 10 gruppi (CLAUDE.md) restava
  // vuoto perché nell'app non lo chiamava nessuno. Sta IN FONDO e non si
  // aspetta: misurare non deve poter far fallire ciò che misura.
  assert.deepEqual(calls.map(c => c.name), ['submitBallot', 'submitExtraBallot', 'logEvent']);
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
  assert.deepEqual(calls.map(c => c.name), ['confirmExtra', 'confirmPlan', 'logEvent']);
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
await test('loginName crea il profilo sulla sessione anonima', async () => {
  const K = { state: { ageOk: true },
              $: () => ({ value: '  Vincenzo  ' }) };
  const res = await live.HANDLERS.loginName(null, K);
  assert.deepEqual(calls[0], { name: 'ensureActor', args: ['Vincenzo'] });
  assert.equal(K.state.consented, true);
  assert.equal(res.closeSheet, true);
});

await test('loginName senza spunta sui 16 anni non scrive niente', async () => {
  const K = { state: { ageOk: false }, $: () => ({ value: 'Vincenzo' }) };
  const res = await live.HANDLERS.loginName(null, K);
  assert.equal(calls.length, 0);
  assert.match(res.toast, /16 anni/);
});

await test('loginName senza nome non scrive niente', async () => {
  const K = { state: { ageOk: true }, $: () => ({ value: '   ' }) };
  const res = await live.HANDLERS.loginName(null, K);
  assert.equal(calls.length, 0);
  assert.equal(res.skipReload, true);
});

await test('la creazione passa da una sola chiamata, non da tre', async () => {
  const K = { state: { draft: {
    step: 4, title: ' Pizza ', emoji: '🍕', groupId: 'g1', allowProposals: true,
    whenMode: 'deciding', whenCands: [{ start: '2026-09-10T20:00', end: '', allDay: false }],
    whereMode: 'fixed', whereFixed: { name: 'Da Gino', address: '' }, whereCands: [],
    deadline: '', extras: [{ question: 'Invitiamo Matteo?', binary: true, options: [] }]
  } } };
  await live.HANDLERS.next.run(null, K);

  // Tre chiamate sarebbero tre transazioni: se la seconda fallisce resta un
  // piano a metà. È successo davvero in produzione il 25/8/2026.
  assert.deepEqual(calls.map(c => c.name), ['createPlanFull', 'logEvent']);
  const [payload, opts] = calls[0].args;
  assert.equal(payload.title, 'Pizza');
  assert.equal(payload.when_mode, 'deciding');
  assert.equal(payload.when_candidates.length, 1);
  assert.equal(payload.place_name, 'Da Gino');
  assert.equal(opts.emoji, '🍕');
  assert.equal(opts.group, 'g1');
  assert.equal(opts.extras[0].binary, true);
  assert.equal(K.state.draft, null, 'la bozza va buttata dopo la creazione');
});

await test('se la misurazione cade, l\'azione riesce lo stesso', async () => {
  // logEvent scrive nel funnel del gate dei 10 gruppi. È la cosa meno
  // importante che succede in quel momento: se il server la rifiuta, o la rete
  // cade, la persona deve comunque avere il suo piano. Misurare non deve poter
  // far fallire ciò che misura — per questo data.logEvent ingoia già i suoi
  // errori, e questa prova impedisce che qualcuno tolga quel .catch().
  const vero = globalThis.__fakeData.logEvent;
  let tentato = false;
  globalThis.__fakeData.logEvent = () => { tentato = true; throw new Error('funnel giù'); };
  try {
    const K = { state: { draft: {
      step: 4, title: 'Pizza', emoji: '🍕', groupId: 'g1', allowProposals: true,
      whenMode: 'deciding', whenCands: [{ start: '2026-09-10T20:00', end: '', allDay: false }],
      whereMode: 'fixed', whereFixed: { name: 'Da Gino', address: '' }, whereCands: [],
      deadline: '', extras: []
    } } };
    const res = await live.HANDLERS.next.run(null, K);
    assert.ok(tentato, 'la misurazione non è stata nemmeno tentata: questa prova non misura niente');
    assert.ok(res && res.go, 'il piano deve esserci anche col funnel caduto');
    assert.equal(K.state.draft, null);
  } finally {
    globalThis.__fakeData.logEvent = vero;
  }
});

await test('next ai passi 1-3 non crea niente: è navigazione', () => {
  for (const step of [1, 2, 3]) {
    assert.equal(live.HANDLERS.next.when(null, { state: { draft: { step } } }), false,
      'il passo ' + step + ' non deve creare il piano');
  }
  assert.equal(live.HANDLERS.next.when(null, { state: { draft: { step: 4 } } }), true);
});

await test('il token si legge dalla rotta di un invito', () => {
  assert.equal(live.tokenDaRotta('#/i/AbC-123_x'), 'AbC-123_x');
  assert.equal(live.tokenDaRotta('#i/AbC-123_x'), 'AbC-123_x');
  assert.equal(live.tokenDaRotta('#/p/qualcosa'), null, 'un piano proprio non è un invito');
  assert.equal(live.tokenDaRotta('#/home'), null);
  assert.equal(live.tokenDaRotta(''), null);
});

await test('join entra col nome e si tiene il token', async () => {
  const K = { $: () => ({ value: '  Luca  ' }),
              state: { currentPlan: 'p1', plans: { p1: { id: 'p1', token: 'tok' } } } };
  const res = await live.HANDLERS.join(null, K);
  assert.deepEqual(calls[0], { name: 'joinPlan', args: ['tok', 'Luca', null] });
  assert.deepEqual(calls[1], { name: 'saveToken', args: ['p1', 'tok'] },
    'senza salvare il token il piano non si riapre più');
  assert.equal(res.go, 'p/p1');
});

await test('join senza nome non entra', async () => {
  const K = { $: () => ({ value: '  ' }), state: { currentPlan: 'p1', plans: { p1: {} } } };
  const res = await live.HANDLERS.join(null, K);
  assert.equal(calls.length, 0);
  assert.equal(res.skipReload, true);
});

await test('claim rivendica un nome già nel piano invece di duplicarlo', async () => {
  const K = { state: { currentPlan: 'p1', plans: { p1: { id: 'p1', token: 'tok' } } } };
  await live.HANDLERS.claim({ dataset: { id: 'a-9' } }, K);
  assert.deepEqual(calls[0], { name: 'joinPlan', args: ['tok', null, 'a-9'] });
});

await test('il ritardo si manda in minuti, non come orario', async () => {
  const K = { state: { currentPlan: 'p1', plans: { p1: { id: 'p1' } }, lateMin: 20 },
              $: () => ({ value: '  sono in tangenziale  ' }) };
  await live.HANDLERS.saveLate(null, K);
  assert.deepEqual(calls[0], { name: 'setMyLate', args: ['p1', 20, 'sono in tangenziale'] });
});

await test('senza minuti il ritardo non parte', async () => {
  const K = { state: { currentPlan: 'p1', plans: { p1: {} }, lateMin: 0 }, $: () => ({ value: '' }) };
  const res = await live.HANDLERS.saveLate(null, K);
  assert.equal(calls.length, 0);
  assert.equal(res.skipReload, true);
});

await test('toggleBooked manda il valore opposto a quello attuale', async () => {
  const K = { state: { currentPlan: 'p1', plans: { p1: { id: 'p1', booked: false } } } };
  await live.HANDLERS.toggleBooked(null, K);
  assert.deepEqual(calls[0], { name: 'setPlanBooked', args: ['p1', true] });
});

await test('muteGroup usa lo stato che torna il server, non quello locale', async () => {
  // toggle_group_mute torna il nuovo stato: fidarsi di quello evita che il
  // messaggio dica il contrario di quello che è successo.
  globalThis.__fakeData.__next = true;
  const res = await live.HANDLERS.muteGroup({ dataset: { g: 'g1' } }, { state: {} });
  assert.deepEqual(calls[0], { name: 'toggleGroupMute', args: ['g1'] });
  assert.ok(/silenziato|riattivate/.test(res.toast));
});

await test('saveProfile aggiorna nome ed email', async () => {
  const K = { state: {}, $: sel => ({ value: sel === '#pname' ? ' Vincenzo ' : 'V@Example.IT ' }) };
  await live.HANDLERS.saveProfile(null, K);
  assert.deepEqual(calls.map(c => c.name), ['ensureActor', 'setMyEmail']);
  assert.deepEqual(calls[0].args, ['Vincenzo']);
  assert.deepEqual(calls[1].args, ['v@example.it'], 'email normalizzata minuscola');
});

await test('i file si caricano uno alla volta, non tutti insieme', async () => {
  const K = { state: { currentPlan: 'p1', plans: { p1: { id: 'p1' } } }, toast: () => {} };
  await live.caricaFile(K, [{ name: 'a.jpg' }, { name: 'b.jpg' }], 'photo', null);
  assert.deepEqual(calls.map(c => c.name), ['uploadMedia', 'uploadMedia']);
  assert.equal(calls[0].args[2], 'photo');
});

await test('se un file sfora, dice quanti erano gia passati', async () => {
  guasti.uploadMedia = { alla: 3, messaggio: 'massimo 20 foto per piano' };
  const K = { state: { currentPlan: 'p1', plans: { p1: { id: 'p1' } } }, toast: () => {} };
  const file = { name: 'x.jpg' };
  await assert.rejects(
    () => live.caricaFile(K, [file, file, file, file], 'photo', null),
    // "2 di 4 caricate, la terza e troppo grande" e utile; "errore" no.
    e => /2 di 4 caricate/.test(e.message) && /massimo 20 foto/.test(e.message));
  delete guasti.uploadMedia;
});

await test('le foto di un posto salvato prendono un altra strada', async () => {
  const K = { state: {}, toast: () => {} };
  await live.caricaFile(K, [{ name: 'menu.jpg' }], 'photo', { kind: 'place', id: 'pl1' });
  assert.deepEqual(calls[0], { name: 'uploadPlacePhoto', args: ['pl1', { name: 'menu.jpg' }] });
});

await test('caricare senza un piano aperto non tenta nemmeno', async () => {
  await assert.rejects(() => live.caricaFile({ state: { plans: {} } }, [{}], 'photo', null),
                       /Nessun piano aperto/);
  assert.equal(calls.length, 0);
});

await test('invitare in un gruppo chiede il token al server', async () => {
  // Il link a un gruppo non si compone da un id: senza token non esiste, ed è
  // il motivo per cui nel messaggio del prototipo c'è {link} come segnaposto.
  const K = {
    state: { groups: { g1: { id: 'g1', name: 'Padel', emoji: 'X' } } },
    msgs: { group: g => 'Entra in ' + g.name + ' -> {link}' },
    msgSheet: (titolo, sub, testo) => { K.__mostrato = testo; }
  };
  await live.HANDLERS.inviteGroup({ dataset: { g: 'g1' } }, K);

  assert.deepEqual(calls[0], { name: 'createGroupInvite', args: ['g1'] });
  assert.ok(!K.__mostrato.includes('{link}'), 'il segnaposto è rimasto a schermo');
  assert.ok(K.__mostrato.includes('#/gi/'), 'il link deve portare alla rotta degli inviti di gruppo');
});

await test('la rotta di un invito a un gruppo si riconosce', () => {
  assert.equal(live.tokenGruppoDaRotta('#/gi/abc123'), 'abc123');
  assert.equal(live.tokenGruppoDaRotta('#gi/abc123'), 'abc123');
  assert.equal(live.tokenGruppoDaRotta('#/i/abc123'), null, 'un piano non è un gruppo');
  assert.equal(live.tokenGruppoDaRotta('#/g/abc123'), null, 'aprire un gruppo non è un invito');
});

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
