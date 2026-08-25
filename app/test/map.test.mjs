// Prova la traduzione database → forme del prototipo.
// Funzioni pure: niente mock, niente rete, niente database.
//   node app/test/map.test.mjs
import assert from 'node:assert/strict';
import {
  mapPlan, mapBallots, mapExtra, mapExpense, mapProposal, mapGroup, mapPlace,
  toDbWhen, toDbWhere, toDbCandidate, mapWhenValue, mapPreview
} from '../map.js';

let passed = 0, failed = 0;
const test = (name, fn) => {
  try { fn(); passed++; console.log('  ok   ' + name); }
  catch (e) { failed++; console.log('  FAIL ' + name + '\n       ' + e.message); }
};

console.log('\nmap.js — traduzione database → prototipo\n');

/* ------------------------------------------------------------------ */
test('when: starts_at/all_day diventano start/allDay', () => {
  const p = mapPlan(
    { id: 'p1', title: 'Cena', status: 'confirmed', when_mode: 'fixed', where_mode: 'fixed',
      starts_at: '2026-09-01T19:00:00Z', ends_at: '2026-09-01T22:00:00Z', all_day: false,
      place_name: 'Da Gino', place_address: 'Via Roma 1', organizer_id: 'a' },
    {});
  assert.equal(p.when.value.start, '2026-09-01T19:00:00Z');
  assert.equal(p.when.value.end, '2026-09-01T22:00:00Z');
  assert.equal(p.when.value.allDay, false);
  // fmtWhen del prototipo legge .start: se restasse starts_at stamperebbe "Invalid Date"
  assert.ok(!('starts_at' in p.when.value));
});

test('where: place_name/place_address diventano name/address', () => {
  const p = mapPlan(
    { id: 'p1', title: 'Cena', status: 'confirmed', when_mode: 'fixed', where_mode: 'fixed',
      place_name: 'Da Gino', place_address: 'Via Roma 1', organizer_id: 'a' },
    {});
  assert.equal(p.where.value.name, 'Da Gino');
  assert.equal(p.where.value.address, 'Via Roma 1');
  // candText() per 'where' legge c.name
  assert.ok(!('place_name' in p.where.value));
});

test('i candidati di altri piani non entrano nel piano sbagliato', () => {
  const p = mapPlan(
    { id: 'p1', title: 'X', status: 'deciding', when_mode: 'deciding', where_mode: 'later',
      organizer_id: 'a' },
    { candidates: [
        { id: 'c1', plan_id: 'p1', field: 'when', starts_at: '2026-09-01T19:00:00Z' },
        { id: 'c9', plan_id: 'ALTRO', field: 'when', starts_at: '2026-09-02T19:00:00Z' }
      ] });
  assert.equal(p.when.candidates.length, 1);
  assert.equal(p.when.candidates[0].id, 'c1');
});

/* ------------------------------------------------------------------ */
test('le schede si ricompongono da tre tabelle diverse', () => {
  const b = mapBallots({
    ballots: [
      { actor_id: 'u1', field: 'when',  none_ok: false, note: 'non troppo tardi' },
      { actor_id: 'u1', field: 'where', none_ok: true,  note: null },
      { actor_id: 'u2', field: 'when',  none_ok: false, note: null }
    ],
    candidates: [
      { id: 'c1', field: 'when' }, { id: 'c2', field: 'when' }, { id: 'c3', field: 'where' }
    ],
    approvals: [
      { candidate_id: 'c1', actor_id: 'u1' },
      { candidate_id: 'c2', actor_id: 'u1' },
      { candidate_id: 'c1', actor_id: 'u2' },
      { candidate_id: 'ESTERNO', actor_id: 'u1' }      // candidato di un altro piano
    ],
    extraApprovals: [{ extra_id: 'e1', candidate_id: 'x1', actor_id: 'u1' }]
  });

  assert.deepEqual(b.u1.when.approved.sort(), ['c1', 'c2']);
  assert.equal(b.u1.when.noneOk, false);
  assert.equal(b.u1.where.noneOk, true);
  assert.deepEqual(b.u1.where.approved, []);
  assert.equal(b.u1.note, 'non troppo tardi');
  assert.deepEqual(b.u2.when.approved, ['c1']);
  // le domande extra finiscono nella stessa scheda, indicizzate per id
  assert.deepEqual(b.u1.e1.approved, ['x1']);
  // il candidato di un altro piano è stato ignorato, non attribuito a caso
  assert.equal(Object.keys(b.u1).filter(k => k !== 'note').length, 3);
});

test('chi non ha votato non compare fra le schede', () => {
  const b = mapBallots({ ballots: [{ actor_id: 'u1', field: 'when', none_ok: false }],
                         candidates: [], approvals: [], extraApprovals: [] });
  // missingIds() del prototipo si basa su questo: !p.ballots[x.id]
  assert.equal(b.u2, undefined);
});

/* ------------------------------------------------------------------ */
test('domanda extra: label diventa name, confirmed diventa fixed', () => {
  const e = mapExtra(
    { id: 'e1', plan_id: 'p1', question: 'Chi porta le palline?', is_binary: false,
      status: 'confirmed', chosen_id: 'x2', position: 0 },
    [{ id: 'x1', extra_id: 'e1', label: 'Anna', position: 1 },
     { id: 'x2', extra_id: 'e1', label: 'Bruno', position: 0 },
     { id: 'z9', extra_id: 'ALTRA', label: 'Fuori', position: 0 }]);

  assert.deepEqual(e.candidates.map(c => c.name), ['Bruno', 'Anna']); // ordinati per position
  assert.equal(e.mode, 'fixed');           // decidingFields() lo esclude
  assert.equal(e.value.name, 'Bruno');
  assert.equal(e.candidates.length, 2);    // niente candidati di un'altra domanda
});

test('domanda ancora aperta: mode deciding e nessun valore', () => {
  const e = mapExtra({ id: 'e1', plan_id: 'p1', question: 'Q', is_binary: true,
                       status: 'deciding', chosen_id: null, position: 0 }, []);
  assert.equal(e.mode, 'deciding');
  assert.equal(e.value, null);
  assert.equal(e.binary, true);
});

/* ------------------------------------------------------------------ */
test('spesa: centesimi interi e lista di chi divide', () => {
  const e = mapExpense(
    { id: 'x1', paid_by: 'u1', amount_cents: 1000, description: 'Pizza',
      created_at: '2026-08-01T12:00:00Z', voided_at: null },
    [{ expense_id: 'x1', actor_id: 'u1' }, { expense_id: 'x1', actor_id: 'u2' },
     { expense_id: 'ALTRA', actor_id: 'u3' }]);

  assert.equal(e.amount, 1000);
  assert.equal(Number.isInteger(e.amount), true, 'gli importi devono restare interi');
  assert.deepEqual(e.among.sort(), ['u1', 'u2']);
  assert.equal(e.voided, false);
});

test('spesa annullata: voided true', () => {
  const e = mapExpense({ id: 'x1', paid_by: 'u1', amount_cents: 500, description: 'X',
                         voided_at: '2026-08-02T00:00:00Z' }, []);
  assert.equal(e.voided, true);   // balances() del prototipo filtra su questo
});

/* ------------------------------------------------------------------ */
test('proposta approvata diventa "ready" e porta il valore nella forma giusta', () => {
  const p = mapProposal(
    { id: 'pr1', field: 'where', new_value: { place_name: 'Sushi', place_address: 'Corso 4' },
      reason: 'più vicino', created_by: 'u1', status: 'approved',
      created_at: '2026-08-01T00:00:00Z' },
    [{ proposal_id: 'pr1', actor_id: 'u1', vote: 'yes' },
     { proposal_id: 'pr1', actor_id: 'u2', vote: 'no' },
     { proposal_id: 'ALTRA', actor_id: 'u3', vote: 'yes' }],
    ['u1', 'u2', 'u3']);

  assert.equal(p.status, 'ready');      // il prototipo usa 'ready', il DB 'approved'
  assert.equal(p.newValue.name, 'Sushi');
  assert.deepEqual(p.votes, { u1: 'yes', u2: 'no' });
  assert.equal(p.eligible.length, 3);
});

/* ------------------------------------------------------------------ */
test('gruppo: membri e admin separati, solo quelli suoi', () => {
  const g = mapGroup(
    { id: 'g1', name: 'Padel', emoji: '🎾', color: '#34C759', created_by: 'u1',
      created_at: '2026-01-01T00:00:00Z' },
    [{ group_id: 'g1', actor_id: 'u1', role: 'admin' },
     { group_id: 'g1', actor_id: 'u2', role: 'member' },
     { group_id: 'ALTRO', actor_id: 'u9', role: 'admin' }]);

  assert.deepEqual(g.members.sort(), ['u1', 'u2']);
  assert.deepEqual(g.admins, ['u1']);
  assert.equal(typeof g.createdAt, 'number');   // il prototipo ordina per numero
});

test('posto salvato: used_count diventa used', () => {
  const pl = mapPlace({ id: 'pl1', name: 'Da Gino', address: 'Via Roma 1',
                        note: '', used_count: 4, created_at: '2026-01-01T00:00:00Z' });
  assert.equal(pl.used, 4);   // myPlaces() ordina su questo
  assert.deepEqual(pl.photos, []);
});

/* ------------------------------------------------------------------ */
test('un piano completo ha tutti i campi che le viste leggono', () => {
  const p = mapPlan(
    { id: 'p1', title: 'Torneo', status: 'deciding', version: 0, organizer_id: 'u1',
      group_id: 'g1', emoji: '🎾', kind: 'plan', allow_proposals: true,
      when_mode: 'deciding', where_mode: 'fixed', place_name: 'Club',
      created_at: '2026-08-01T00:00:00Z' },
    { token: 'abc', participants: [{ actor_id: 'u1', role: 'organizer', rsvp: null }] });

  for (const k of ['id', 'token', 'kind', 'title', 'emoji', 'organizer', 'groupId', 'status',
                   'version', 'deadline', 'createdAt', 'when', 'where', 'extras',
                   'participants', 'ballots', 'changes', 'comments', 'proposals',
                   'expenses', 'settlements', 'photos', 'files', 'recurrence']) {
    assert.ok(k in p, 'manca il campo ' + k);
  }
  assert.equal(p.when.value, null, 'when_mode deciding non deve avere un valore fisso');
  assert.equal(p.where.value.name, 'Club');
});

/* ---------------------------- verso il database ------------------- */
test('datetime-local diventa ISO completo', () => {
  const d = toDbWhen({ start: '2026-09-01T19:00', end: '', allDay: false, timezone: 'Europe/Rome' });
  // update_plan_field fa (p_value->>'starts_at')::timestamptz: senza ISO
  // completo Postgres interpreta con un fuso che non è quello dell'utente.
  assert.ok(d.starts_at.endsWith('Z'), 'manca il fuso: ' + d.starts_at);
  assert.equal(new Date(d.starts_at).getTime(), new Date('2026-09-01T19:00').getTime());
  assert.equal(d.ends_at, null, 'fine vuota deve essere null, non stringa vuota');
  assert.equal(d.timezone, 'Europe/Rome');
});

test('name/address tornano place_name/place_address', () => {
  assert.deepEqual(toDbWhere({ name: 'Da Gino', address: '' }),
                   { place_name: 'Da Gino', place_address: null });
  assert.equal(toDbWhere({ name: '' }), null, 'senza nome non si propone niente');
});

test('andata e ritorno: quello che mando torna uguale', () => {
  const originale = { start: '2026-09-01T19:00', end: '2026-09-01T22:00', allDay: false };
  const tornato = mapWhenValue({ id: null, ...toDbWhen(originale) });
  assert.equal(new Date(tornato.start).getTime(), new Date(originale.start).getTime());
  assert.equal(new Date(tornato.end).getTime(), new Date(originale.end).getTime());
  assert.equal(tornato.allDay, false);
});

test('toDbCandidate sceglie la forma dal campo', () => {
  assert.ok('place_name' in toDbCandidate('where', { name: 'X' }));
  assert.ok('starts_at' in toDbCandidate('when', { start: '2026-09-01T19:00' }));
});

/* ------------------------------ invito ---------------------------- */
test('invito: l\'organizzatore arriva come nome e va ricollegato al suo id', () => {
  const { plan, people } = mapPreview({
    ok: true, plan_id: 'p1', title: 'Cena', status: 'deciding', version: 0,
    organizer: 'Anna', voters: 2, when_mode: 'deciding', where_mode: 'fixed',
    place_name: 'Da Gino', deadline_at: null,
    candidates: [{ id: 'c1', field: 'when', starts_at: '2026-09-01T19:00:00Z' },
                 { id: 'c2', field: 'when', starts_at: '2026-09-02T19:00:00Z' }],
    people: [{ actor_id: 'a-1', name: 'Anna' }, { actor_id: 'a-2', name: 'Bruno' }]
  }, 'tok-123');

  // p.organizer nelle viste è un id, non un nome: nameOf() stamperebbe vuoto.
  assert.equal(plan.organizer, 'a-1');
  assert.equal(people['a-1'].name, 'Anna');
  assert.equal(plan.token, 'tok-123');
  assert.equal(plan.when.candidates.length, 2);
  assert.equal(plan.where.value.name, 'Da Gino');
  assert.equal(plan.participants.find(x => x.id === 'a-1').role, 'organizer');
  assert.deepEqual(plan.ballots, {}, 'dall\'invito non si vede cosa ha votato chi');
  assert.equal(plan.voters, 2);
});

test('invito: organizzatore che non è fra i partecipanti prende un id di comodo', () => {
  const { plan, people } = mapPreview({
    ok: true, plan_id: 'p1', title: 'X', status: 'deciding', organizer: 'Zoe',
    when_mode: 'later', where_mode: 'later', candidates: [], people: []
  }, 'tok');
  assert.equal(plan.organizer, 'org:p1');
  assert.equal(people['org:p1'].name, 'Zoe');
});

/* ------------------------------------------------------------------ */
/* storia del piano                                                    */
/*                                                                     */
/* Il 26/8/2026 la prima conferma di un piano vero faceva morire        */
/* render(): il prototipo fa c.text.replace(...) su ogni voce di specie  */
/* 'confirmed', e qui text non veniva prodotto. Lo stato passava a       */
/* confirmed, il ridisegno si fermava a metà, e la pagina restava su     */
/* "IN DECISIONE" — cioè sembrava che la conferma non fosse partita,     */
/* mentre nel database era andata benissimo.                            */

test('una conferma diventa una voce leggibile, non una che rompe il render', () => {
  const p = mapPlan(
    { id: 'p1', title: 'Pizza', status: 'confirmed', version: 1 },
    { changes: [{
        version: 1, kind: 'confirmed', changed_by: 'a1',
        created_at: '2026-08-26T10:00:00Z',
        new_value: { starts_at: '2026-08-28T11:30:00+00:00', all_day: false,
                     place_name: 'Pizzeria da Gino', place_address: 'Via Roma 12' }
      }] });
  const c = p.changes[0];
  assert.equal(typeof c.text, 'string', 'senza text il prototipo lancia su .replace');
  assert.match(c.text, /^Confermato: /, 'il prototipo toglie questo prefisso nel feed');
  assert.match(c.text, /Pizzeria da Gino/);
  // Stessa lingua del resto della schermata: "ven 28 ago", non "Fri, Aug 28".
  // Con toLocaleString(undefined) usciva l'inglese sotto un piano in italiano.
  assert.match(c.text, /ago/, 'la data va scritta come la scrive il prototipo');
  assert.equal(c.by, 'a1', 'senza by la voce sparisce dalle novità e lo Storico dice undefined');

  // La riga esatta che moriva.
  assert.doesNotThrow(() => c.text.replace(/^(Confermato|Deciso): /, ''));
});

test('nessuna voce di storia lascia text o by vuoti', () => {
  // Vale per ogni specie che il database sa scrivere: se una sfugge, si
  // ripresenta lo stesso crash su un percorso diverso.
  const righe = [
    { version: 0, kind: 'created',       changed_by: 'a1', created_at: '2026-08-26T09:00:00Z', new_value: { title: 'Pizza' } },
    { version: 1, kind: 'confirmed',     changed_by: 'a1', created_at: '2026-08-26T10:00:00Z', new_value: { place_name: 'Da Gino' } },
    { version: 2, kind: 'when_changed',  changed_by: 'a2', created_at: '2026-08-26T11:00:00Z',
      old_value: { starts_at: '2026-08-28T11:30:00Z' }, new_value: { starts_at: '2026-08-29T12:00:00Z' }, note: 'chiuso' },
    { version: 3, kind: 'where_changed', changed_by: 'a2', created_at: '2026-08-26T12:00:00Z', new_value: { place_name: 'Sushi Zen' } },
    { version: 4, kind: 'cancelled',     changed_by: 'a1', created_at: '2026-08-26T13:00:00Z', note: 'piove' }
  ];
  const p = mapPlan({ id: 'p1', title: 'Pizza', status: 'cancelled' }, { changes: righe });
  for (const c of p.changes) {
    assert.ok(c.text && typeof c.text === 'string', `specie senza testo: ${c.kind}`);
    assert.ok(c.by, `specie senza autore: ${c.kind}`);
    assert.doesNotThrow(() => c.text.replace(/^(Confermato|Deciso): /, ''));
  }
});

test('le modifiche prendono la specie che il prototipo conosce', () => {
  // Il database scrive when_changed / where_changed; il prototipo confronta
  // con 'changed'. Senza la traduzione quelle voci non compaiono mai.
  const p = mapPlan({ id: 'p1', title: 'Pizza', status: 'deciding' }, { changes: [
    { version: 2, kind: 'when_changed', changed_by: 'a2', created_at: '2026-08-26T11:00:00Z',
      old_value: { starts_at: '2026-08-28T11:30:00Z' }, new_value: { starts_at: '2026-08-29T12:00:00Z' } }
  ] });
  assert.equal(p.changes[0].kind, 'changed');
  assert.equal(p.changes[0].field, 'when', 'il campo va tenuto: serve per l\'etichetta');
  assert.match(p.changes[0].text, /era /, 'una modifica dice anche da cosa si veniva');
});

/* ------------------------------------------------------------------ */
console.log(`\n${passed} passati, ${failed} falliti\n`);
process.exit(failed ? 1 : 0);
