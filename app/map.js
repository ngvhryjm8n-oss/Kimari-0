// map.js — traduce le righe del database nelle forme che le viste del
// prototipo già sanno leggere.
//
// Qui dentro NON si parla con Supabase: sono funzioni pure, riga in, oggetto
// fuori. È voluto. La traduzione è il punto dove si sbaglia più facilmente
// (starts_at → start, place_name → name, label → name, centesimi → interi) e
// separandola si può provare senza mock, senza rete e senza database.
//
// L'I/O sta in data.js.

const ms = t => (t ? new Date(t).getTime() : null);

/* ------------------------------------------------------------------ when */
// DB: starts_at / ends_at / all_day   →   prototipo: start / end / allDay
export function mapWhenValue(row) {
  if (!row || !row.starts_at) return null;
  return { id: row.id || null, start: row.starts_at, end: row.ends_at || '', allDay: !!row.all_day };
}

export function mapWhenCandidate(c) {
  return { id: c.id, start: c.starts_at, end: c.ends_at || '', allDay: !!c.all_day };
}

/* ----------------------------------------------------------------- where */
// DB: place_name / place_address   →   prototipo: name / address
export function mapWhereValue(row) {
  if (!row || !row.place_name) return null;
  return { id: row.id || null, name: row.place_name, address: row.place_address || '' };
}

export function mapWhereCandidate(c) {
  return { id: c.id, name: c.place_name, address: c.place_address || '' };
}

/* ---------------------------------------------------------------- people */
export function mapPerson(actor, extra = {}) {
  return {
    id: actor.id,
    name: actor.display_name,
    email: actor.email || '',
    sections: extra.sections || [],
    groupSections: extra.groupSections || {},
    friends: extra.friends || [],
    muted: extra.muted || [],
    places: extra.places || [],
    unlimited: !!extra.unlimited,
    web: !!extra.web
  };
}

export function mapSection(row) {
  return { id: row.id, name: row.name, position: row.position };
}

export function mapPlace(row, mediaRows = [], urlFor = null) {
  const mie = mediaRows.filter(m => m.place_id === row.id);
  return {
    id: row.id, name: row.name, address: row.address || '',
    note: row.note || '', used: row.used_count || 0,
    photos: mie.filter(m => m.kind === 'photo').map(m => ({
      id: m.id, name: m.name, path: m.path, cover: !!m.is_cover,
      dataUrl: urlFor ? urlFor(m.path) : null
    })),
    // Il prototipo chiama "files" anche i link: per un posto salvato un menu
    // online e un PDF servono alla stessa cosa.
    files: mie.filter(m => m.kind === 'link').map(m => ({
      id: m.id, name: m.name, url: m.url, at: ms(m.created_at)
    })),
    createdAt: ms(row.created_at)
  };
}

/* ---------------------------------------------------------------- gruppi */
export function mapGroup(row, memberRows = []) {
  const mine = memberRows.filter(m => m.group_id === row.id);
  return {
    id: row.id,
    name: row.name,
    emoji: row.emoji,
    color: row.color,
    members: mine.map(m => m.actor_id),
    admins: mine.filter(m => m.role === 'admin').map(m => m.actor_id),
    createdBy: row.created_by,
    createdAt: ms(row.created_at)
  };
}

/* ---------------------------------------------------------------- schede */
// Il prototipo tiene le schede come:
//   ballots[actorId] = { when:{approved:[id],noneOk:bool}, where:{...}, <extraId>:{...}, note, at }
// Il database le tiene sparse fra tre tabelle: ballots (una riga per campo),
// approvals (when/where) ed extra_approvals (domande extra).
export function mapBallots({ ballots = [], approvals = [], candidates = [],
                             extraApprovals = [] }) {
  const fieldOfCandidate = new Map(candidates.map(c => [c.id, c.field]));
  const out = {};
  const slot = (actor, field) => {
    if (!out[actor]) out[actor] = {};
    if (!out[actor][field]) out[actor][field] = { approved: [], noneOk: false };
    return out[actor][field];
  };

  for (const b of ballots) {
    const s = slot(b.actor_id, b.field);
    s.noneOk = !!b.none_ok;
    if (b.note) out[b.actor_id].note = b.note;
    if (b.created_at) out[b.actor_id].at = ms(b.created_at);
  }
  for (const a of approvals) {
    const field = fieldOfCandidate.get(a.candidate_id);
    if (!field) continue;             // candidato di un altro piano
    slot(a.actor_id, field).approved.push(a.candidate_id);
  }
  for (const a of extraApprovals) {
    slot(a.actor_id, a.extra_id).approved.push(a.candidate_id);
  }
  return out;
}

/* --------------------------------------------------------- domande extra */
export function mapExtra(row, candidateRows = []) {
  const cands = candidateRows
    .filter(c => c.extra_id === row.id)
    .sort((a, b) => a.position - b.position)
    .map(c => ({ id: c.id, name: c.label }));   // DB: label → prototipo: name
  return {
    id: row.id,
    question: row.question,
    binary: !!row.is_binary,
    mode: row.status === 'confirmed' ? 'fixed' : 'deciding',
    value: row.chosen_id ? cands.find(c => c.id === row.chosen_id) || null : null,
    candidates: cands
  };
}

/* --------------------------------------------------------------- commenti */
export function mapComment(row) {
  return {
    id: row.id, by: row.actor_id, at: ms(row.created_at),
    text: row.body, system: !!row.is_system, kind: row.kind || null
  };
}

/* --------------------------------------------------------------- proposte */
export function mapProposal(row, voteRows = [], participantIds = []) {
  const votes = {};
  for (const v of voteRows.filter(v => v.proposal_id === row.id)) votes[v.actor_id] = v.vote;
  const nv = row.new_value || {};
  return {
    id: row.id,
    field: row.field,
    by: row.created_by,
    at: ms(row.created_at),
    // Riportata nella forma del campo, così le viste la trattano come un valore
    newValue: row.field === 'when' ? mapWhenValue(nv) : mapWhereValue(nv),
    reason: row.reason || '',
    votes,
    status: row.status === 'approved' ? 'ready' : row.status,
    eligible: participantIds.slice()
  };
}

/* ----------------------------------------------------------------- spese */
// I centesimi restano centesimi: balances() del prototipo lavora su interi.
export function mapExpense(row, shareRows = []) {
  return {
    id: row.id,
    by: row.paid_by,
    amount: Number(row.amount_cents),
    text: row.description,
    among: shareRows.filter(s => s.expense_id === row.id).map(s => s.actor_id),
    voided: !!row.voided_at,
    at: ms(row.created_at)
  };
}

export function mapSettlement(row) {
  return {
    id: row.id, from: row.from_actor, to: row.to_actor,
    amount: Number(row.amount_cents), at: ms(row.created_at)
  };
}

/* ----------------------------------------------------------------- media */
export function mapMedia(row, urlFor) {
  return {
    id: row.id, by: row.actor_id, name: row.name,
    size: Number(row.size_bytes), path: row.path,
    dataUrl: urlFor ? urlFor(row.path) : null,
    at: ms(row.created_at)
  };
}

/* ------------------------------------------------------------- cambiamenti */
// Il prototipo legge `by` e `text` da ogni voce di storia; il database scrive
// changed_by e un new_value in JSON. Senza tradurli succedeva questo:
//   - alla PRIMA conferma di un piano render() moriva su c.text.replace di
//     undefined, e la pagina restava ferma su "IN DECISIONE" pur avendo lo
//     stato già aggiornato: sembrava che la conferma non fosse partita;
//   - lo "Storico" mostrava "undefined" a ogni riga;
//   - la scheda novità restava vuota, perché filtra su state.people[i.by].
// Le specie non coincidono: il database scrive `when_changed`/`where_changed`,
// il prototipo si aspetta `changed`.

// La stessa lingua che il prototipo usa nei suoi formattatori (index.html,
// riga ~581). Se qui si mette la lingua del dispositivo e li' no, nella stessa
// schermata compaiono due formati diversi: "Ven 28 ago" nel piano e
// "Fri, Aug 28" nello storico. Quando l'app avra' le cinque lingue va cambiata
// qui E li', insieme.
export const LINGUA_DATE = 'it-IT';

const dataUmana = (iso, allDay) => {
  if (!iso) return '';
  const d = new Date(iso);
  return allDay
    ? d.toLocaleDateString(LINGUA_DATE, { weekday: 'short', day: 'numeric', month: 'short' })
    : d.toLocaleString(LINGUA_DATE, { weekday: 'short', day: 'numeric', month: 'short',
                                      hour: '2-digit', minute: '2-digit' });
};

// Il testo di un valore, qualunque campo sia: quando o dove.
export function testoValore(v) {
  if (!v) return '';
  if (v.place_name) return [v.place_name, v.place_address].filter(Boolean).join(' · ');
  if (v.starts_at) return dataUmana(v.starts_at, v.all_day);
  if (v.title) return v.title;
  return '';
}

export function mapChange(c) {
  const kindDb = c.kind || '';
  const kind = /_changed$/.test(kindDb) ? 'changed' : kindDb;
  const campo = /_changed$/.test(kindDb) ? kindDb.replace(/_changed$/, '') : null;
  const nuovo = c.new_value || null;
  const vecchio = c.old_value || null;

  let text;
  if (kind === 'confirmed') {
    // Il prototipo toglie il prefisso "Confermato: " quando lo mostra nel
    // feed, e lo tiene nello Storico: va scritto in questa forma esatta.
    const parti = [];
    if (nuovo && nuovo.starts_at) parti.push(dataUmana(nuovo.starts_at, nuovo.all_day));
    if (nuovo && nuovo.place_name) parti.push(nuovo.place_name);
    text = 'Confermato: ' + (parti.join(' · ') || 'il piano');
  } else if (kind === 'created') {
    text = 'Creato: ' + ((nuovo && nuovo.title) || 'il piano');
  } else if (kind === 'cancelled') {
    text = 'Annullato' + (c.note ? ': ' + c.note : '');
  } else if (kind === 'changed') {
    const etichetta = campo === 'when' ? 'Quando' : campo === 'where' ? 'Dove' : (campo || 'Piano');
    const a = testoValore(nuovo), da = testoValore(vecchio);
    text = etichetta + ': ' + (a || '—') + (da ? ' (era ' + da + ')' : '');
    if (c.note) text += ' · ' + c.note;
  } else {
    text = c.note || kindDb;
  }

  return {
    version: c.version, kind, at: ms(c.created_at),
    by: c.changed_by || null,
    text,
    field: campo,
    note: c.note || null,
    newValue: nuovo
  };
}

/* ------------------------------------------------------------------ piano */
export function mapPlan(plan, parts = {}) {
  const {
    candidates = [], participants = [], ballots = [], approvals = [],
    changes = [], extras = [], extraCandidates = [], extraApprovals = [],
    comments = [], proposals = [], proposalVotes = [],
    expenses = [], expenseShares = [], settlements = [], media = [],
    token = null, urlFor = null
  } = parts;

  const mine = candidates.filter(c => c.plan_id === plan.id);
  const participantIds = participants.map(p => p.actor_id);
  const photos = media.filter(m => m.kind === 'photo').map(m => mapMedia(m, urlFor));
  const files  = media.filter(m => m.kind === 'file').map(m => mapMedia(m, urlFor));

  return {
    id: plan.id,
    token,
    kind: plan.kind || 'plan',
    title: plan.title,
    emoji: plan.emoji || '📌',
    organizer: plan.organizer_id,
    groupId: plan.group_id || null,
    status: plan.status,
    version: plan.version,
    deadline: plan.deadline_at || null,
    createdAt: ms(plan.created_at),
    allowProposals: plan.allow_proposals !== false,
    joinPolicy: plan.join_policy || 'open',

    when: {
      mode: plan.when_mode,
      value: plan.when_mode === 'fixed' ? mapWhenValue(plan) : null,
      candidates: mine.filter(c => c.field === 'when').map(mapWhenCandidate)
    },
    where: {
      mode: plan.where_mode,
      value: plan.where_mode === 'fixed' ? mapWhereValue(plan) : null,
      candidates: mine.filter(c => c.field === 'where').map(mapWhereCandidate)
    },
    extras: extras
      .filter(e => e.plan_id === plan.id)
      .sort((a, b) => a.position - b.position)
      .map(e => mapExtra(e, extraCandidates)),

    participants: participants.map(p => ({
      id: p.actor_id, role: p.role, rsvp: p.rsvp || null,
      rsvpAt: ms(p.rsvp_at),
      // Minuti e non un orario: "20 minuti di ritardo" resta vero anche se il
      // piano viene spostato.
      late: p.late_minutes
        ? { minutes: p.late_minutes, note: p.late_note || '', at: ms(p.late_at) }
        : null,
      joinedAt: ms(p.joined_at)
    })),
    ballots: mapBallots({ ballots, approvals, candidates: mine, extraApprovals }),

    changes: changes.map(mapChange),

    comments: comments.map(mapComment),
    proposals: proposals.map(p => mapProposal(p, proposalVotes, participantIds)),
    expenses: expenses.map(e => mapExpense(e, expenseShares)),
    settlements: settlements.map(mapSettlement),
    photos,
    files,

    booked: !!plan.booked,
    // ricorrenze: il prototipo le mostra, il database non le ha ancora
    seriesId: null, occurrence: null, of: null, recurrence: null
  };
}

/* ------------------------------------------------------------------ */
/* verso il database: l'inverso delle funzioni qui sopra.              */
/* Serve quando il client PROPONE un valore (proposte, modifiche).     */
/* Le date arrivano da <input type="datetime-local">, quindi senza     */
/* fuso: vanno convertite in ISO come fa già il sito V0.               */

export function toDbWhen(v) {
  if (!v || !v.start) return null;
  return {
    starts_at: new Date(v.start).toISOString(),
    ends_at: v.end ? new Date(v.end).toISOString() : null,
    all_day: !!v.allDay,
    timezone: v.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone
  };
}

export function toDbWhere(v) {
  if (!v || !v.name) return null;
  return { place_name: v.name, place_address: v.address || null };
}

// Un'opzione da aggiungere a un piano: stessa forma che vuole add_candidates.
export function toDbCandidate(field, c) {
  return field === 'when' ? toDbWhen(c) : toDbWhere(c);
}

// Dalla bozza di creazione del prototipo al payload di create_plan.
// La bozza usa whenMode/whenCands/whereFixed…, create_plan vuole
// when_mode/when_candidates/place_name… — due vocabolari diversi per la
// stessa cosa, ed è esattamente dove si sbaglia.
export function draftToCreatePlan(d) {
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const p = { title: String(d.title || '').trim(),
              when_mode: d.whenMode, where_mode: d.whereMode };

  if (d.whenMode === 'fixed') Object.assign(p, toDbWhen({ ...d.whenFixed, timezone: tz }));
  else if (d.whenMode === 'deciding')
    p.when_candidates = (d.whenCands || []).map(c => toDbWhen({ ...c, timezone: tz }));

  if (d.whereMode === 'fixed') Object.assign(p, toDbWhere(d.whereFixed) || {});
  else if (d.whereMode === 'deciding')
    p.where_candidates = (d.whereCands || []).map(toDbWhere).filter(Boolean);

  if (d.deadline) p.deadline_at = new Date(d.deadline).toISOString();
  return p;
}

/* ------------------------------------------------------------------ */
/* invito: quello che vede chi apre un link ?t= senza avere l'app.     */
/* preview_invite torna una forma tutta sua — e in particolare dà      */
/* l'organizzatore come NOME, mentre le viste si aspettano un id.      */

export function mapPreview(prev, token) {
  const people = {};
  for (const p of (prev.people || [])) {
    people[p.actor_id] = mapPerson({ id: p.actor_id, display_name: p.name });
  }

  // L'organizzatore arriva come nome: si ritrova fra i partecipanti, e se non
  // c'è gli si dà un id di comodo, altrimenti nameOf() stamperebbe vuoto.
  let orgId = (prev.people || []).find(p => p.name === prev.organizer)?.actor_id;
  if (!orgId) {
    orgId = 'org:' + prev.plan_id;
    people[orgId] = mapPerson({ id: orgId, display_name: prev.organizer || '' });
  }

  const cands = prev.candidates || [];
  const plan = {
    id: prev.plan_id,
    token,
    kind: 'plan',
    title: prev.title,
    emoji: '📌',
    organizer: orgId,
    groupId: null,
    status: prev.status,
    version: prev.version,
    deadline: prev.deadline_at || null,
    createdAt: Date.now(),
    allowProposals: false,

    when: {
      mode: prev.when_mode,
      value: prev.when_mode === 'fixed' ? mapWhenValue(prev) : null,
      candidates: cands.filter(c => c.field === 'when').map(mapWhenCandidate)
    },
    where: {
      mode: prev.where_mode,
      value: prev.where_mode === 'fixed' ? mapWhereValue(prev) : null,
      candidates: cands.filter(c => c.field === 'where').map(mapWhereCandidate)
    },
    extras: [],

    // Dall'invito si sa CHI partecipa ma non COSA ha votato: il voto è segreto
    // finché non si entra. `voters` serve solo a dire "3 hanno già votato".
    participants: (prev.people || []).map(p => ({
      id: p.actor_id, role: p.actor_id === orgId ? 'organizer' : 'member',
      rsvp: null, rsvpAt: null, late: null, joinedAt: null
    })),
    ballots: {},
    voters: prev.voters || 0,

    changes: [], comments: [], proposals: [], expenses: [], settlements: [],
    photos: [], files: [],
    booked: false, seriesId: null, occurrence: null, of: null, recurrence: null
  };

  return { plan, people };
}
