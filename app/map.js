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

export function mapPlace(row) {
  return {
    id: row.id, name: row.name, address: row.address || '',
    note: row.note || '', used: row.used_count || 0,
    photos: [], files: [], createdAt: ms(row.created_at)
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
      rsvpAt: null, late: null, joinedAt: ms(p.joined_at)
    })),
    ballots: mapBallots({ ballots, approvals, candidates: mine, extraApprovals }),

    changes: changes.map(c => ({
      version: c.version, kind: c.kind, at: ms(c.created_at),
      note: c.note || null, newValue: c.new_value || null
    })),

    comments: comments.map(mapComment),
    proposals: proposals.map(p => mapProposal(p, proposalVotes, participantIds)),
    expenses: expenses.map(e => mapExpense(e, expenseShares)),
    settlements: settlements.map(mapSettlement),
    photos,
    files,

    // campi che il prototipo si aspetta ma che il database non ha ancora
    booked: false, seriesId: null, occurrence: null, of: null, recurrence: null
  };
}
