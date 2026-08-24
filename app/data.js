// data.js — l'unico punto dell'app che parla con Supabase.
//
// Le viste del prototipo leggono `state`; qui si costruisce quello `state`
// dalle righe vere e si offrono le azioni che lo modificano. La traduzione
// delle forme sta in map.js, che è puro e provato a parte.
//
// Due regole ereditate da V0 e non negoziabili:
//   - si LEGGE dalle tabelle (la RLS decide cosa si vede), si SCRIVE solo via
//     RPC. Nessuna insert/update/delete diretta, mai.
//   - gli errori si mostrano col dettaglio vero di Supabase, mai generici.

import {
  mapPerson, mapSection, mapPlace, mapGroup, mapPlan
} from './map.js';

let sb = null;

export function init(client) { sb = client; }

const BUCKET = 'kimari';

// Ogni chiamata passa di qui: un errore di Supabase non deve mai diventare
// un `null` silenzioso più avanti nel codice (regola 5).
async function rpc(name, args) {
  const { data, error } = await sb.rpc(name, args);
  if (error) {
    const e = new Error(error.message || ('errore in ' + name));
    e.rpc = name; e.detail = error;
    throw e;
  }
  return data;
}

async function rows(query, what) {
  const { data, error } = await query;
  if (error) {
    const e = new Error('Non riesco a leggere ' + what + ': ' + error.message);
    e.detail = error;
    throw e;
  }
  return data || [];
}

/* =============================== sessione =============================== */

export async function currentSession() {
  const { data, error } = await sb.auth.getSession();
  if (error) throw new Error('Sessione illeggibile: ' + error.message);
  return data.session;
}

export async function ensureSession() {
  const s = await currentSession();
  if (s) return s;
  const { data, error } = await sb.auth.signInAnonymously();
  if (error) throw new Error('Accesso rifiutato da Supabase: ' + error.message);
  return data.session;
}

export async function signInWithGoogle(redirectTo) {
  const s = await currentSession();
  const opts = { provider: 'google', options: { redirectTo } };
  // Chi è entrato come ospite collega Google all'account che ha già, così non
  // perde i piani a cui ha partecipato.
  const { error } = s && s.user.is_anonymous
    ? await sb.auth.linkIdentity(opts)
    : await sb.auth.signInWithOAuth(opts);
  if (error) throw error;
}

export async function signOut() { await sb.auth.signOut(); }

export async function myActor() {
  const s = await currentSession();
  if (!s) return null;
  const r = await rows(
    sb.from('actors').select('id, display_name, email').eq('auth_user_id', s.user.id),
    'il tuo profilo');
  return r[0] || null;
}

export const ensureActor = name => rpc('ensure_actor', { p_display_name: name });
export const setMyEmail  = email => rpc('set_my_email', { p_email: email });
export const deleteMyAccount = () => rpc('delete_my_account');

/* =============================== lettura =============================== */

// Costruisce l'intero `state` del prototipo. Le query non filtrano per utente:
// ci pensa la RLS, che è l'unica di cui ci si può fidare.
export async function loadState() {
  const actor = await myActor();
  if (!actor) return { me: 'guest', people: {}, groups: {}, plans: {} };

  const [groupRows, memberRows, sectionRows, groupSectionRows,
         placeRows, entRows, planRows] = await Promise.all([
    rows(sb.from('groups').select('*'), 'i gruppi'),
    rows(sb.from('group_members').select('group_id, actor_id, role, joined_at'), 'i membri dei gruppi'),
    rows(sb.from('sections').select('*').order('position'), 'le tue sezioni'),
    rows(sb.from('group_sections').select('*'), 'le tue sezioni'),
    rows(sb.from('places').select('*').order('used_count', { ascending: false }), 'i posti salvati'),
    rows(sb.from('entitlements').select('*'), 'il tuo piano'),
    rows(sb.from('plans').select('*'), 'i piani')
  ]);

  const planIds = planRows.map(p => p.id);
  const inPlans = q => planIds.length ? q : Promise.resolve({ data: [], error: null });

  const [cands, parts, ballots, changes, extras, comments,
         proposals, expenses, settlements, media] = await Promise.all([
    rows(inPlans(sb.from('candidates').select('*').in('plan_id', planIds)), 'le opzioni'),
    rows(inPlans(sb.from('participants').select('*').in('plan_id', planIds)), 'i partecipanti'),
    rows(inPlans(sb.from('ballots').select('*').in('plan_id', planIds)), 'i voti'),
    rows(inPlans(sb.from('plan_changes').select('*').in('plan_id', planIds)), 'la storia dei piani'),
    rows(inPlans(sb.from('plan_extras').select('*').in('plan_id', planIds)), 'le domande'),
    rows(inPlans(sb.from('comments').select('*').in('plan_id', planIds).order('created_at')), 'i commenti'),
    rows(inPlans(sb.from('proposals').select('*').in('plan_id', planIds)), 'le proposte'),
    rows(inPlans(sb.from('expenses').select('*').in('plan_id', planIds)), 'le spese'),
    rows(inPlans(sb.from('settlements').select('*').in('plan_id', planIds)), 'i rimborsi'),
    rows(inPlans(sb.from('media').select('*').in('plan_id', planIds)), 'le foto')
  ]);

  // Le approvazioni si filtrano per candidato, non per piano: la RLS nasconde
  // comunque quelle degli altri piani.
  const candIds  = cands.map(c => c.id);
  const extraIds = extras.map(e => e.id);
  const [approvals, extraCands, extraApprovals, propVotes, expShares, actorRows] =
    await Promise.all([
      rows(candIds.length ? sb.from('approvals').select('*').in('candidate_id', candIds)
                          : Promise.resolve({ data: [] }), 'le preferenze'),
      rows(extraIds.length ? sb.from('extra_candidates').select('*').in('extra_id', extraIds)
                           : Promise.resolve({ data: [] }), 'le opzioni delle domande'),
      rows(extraIds.length ? sb.from('extra_approvals').select('*').in('extra_id', extraIds)
                           : Promise.resolve({ data: [] }), 'le preferenze sulle domande'),
      rows(proposals.length ? sb.from('proposal_votes').select('*')
                                .in('proposal_id', proposals.map(p => p.id))
                            : Promise.resolve({ data: [] }), 'i voti sulle proposte'),
      rows(expenses.length ? sb.from('expense_shares').select('*')
                               .in('expense_id', expenses.map(e => e.id))
                           : Promise.resolve({ data: [] }), 'le quote delle spese'),
      rows(sb.from('actors').select('id, display_name'), 'i nomi')
    ]);

  /* --------------------------------------------------- persone */
  const people = {};
  for (const a of actorRows) people[a.id] = mapPerson(a);
  people[actor.id] = mapPerson(actor, {
    sections: sectionRows.map(mapSection),
    groupSections: Object.fromEntries(groupSectionRows.map(r => [r.group_id, r.section_id])),
    places: placeRows.map(mapPlace),
    unlimited: !!(entRows[0] && entRows[0].unlimited)
  });

  /* --------------------------------------------------- gruppi */
  const groups = {};
  for (const g of groupRows) groups[g.id] = mapGroup(g, memberRows);

  /* --------------------------------------------------- piani */
  const by = (arr, id) => arr.filter(x => x.plan_id === id);
  const plans = {};
  for (const p of planRows) {
    plans[p.id] = mapPlan(p, {
      candidates: cands,
      participants: by(parts, p.id),
      ballots: by(ballots, p.id),
      approvals,
      changes: by(changes, p.id).sort((a, b) => a.version - b.version),
      extras, extraCandidates: extraCands, extraApprovals,
      comments: by(comments, p.id),
      proposals: by(proposals, p.id),
      proposalVotes: propVotes,
      expenses: by(expenses, p.id),
      expenseShares: expShares,
      settlements: by(settlements, p.id),
      media: by(media, p.id),
      token: tokenFor(p.id),
      urlFor: null
    });
  }

  return { me: actor.id, people, groups, plans };
}

/* ------- token degli inviti: restano sul dispositivo, come in V0 ------- */
const LSK = 'kimari_tokens';
const store = () => { try { return JSON.parse(localStorage.getItem(LSK) || '{}'); }
                      catch { return {}; } };
export const tokenFor = planId => store()[planId] || null;
export function saveToken(planId, token) {
  try { const m = store(); m[planId] = token; localStorage.setItem(LSK, JSON.stringify(m)); }
  catch { /* navigazione privata: pazienza, il link resta su WhatsApp */ }
}

/* =============================== gruppi =============================== */
export const createGroup = (name, emoji, color) =>
  rpc('create_group', { p_name: name, p_emoji: emoji, p_color: color });
export const updateGroup = (id, name, emoji, color) =>
  rpc('update_group', { p_group: id, p_name: name, p_emoji: emoji, p_color: color });
export const createGroupInvite  = id => rpc('create_group_invite', { p_group: id });
export const revokeGroupInvites = id => rpc('revoke_group_invites', { p_group: id });
export const previewGroupInvite = t  => rpc('preview_group_invite', { p_token: t });
export const joinGroup = (t, name) =>
  rpc('join_group', { p_token: t, p_display_name: name || null });
export const leaveGroup        = id => rpc('leave_group', { p_group: id });
export const removeGroupMember = (g, a) => rpc('remove_group_member', { p_group: g, p_actor: a });
export const setGroupAdmin     = (g, a, on) =>
  rpc('set_group_admin', { p_group: g, p_actor: a, p_admin: !!on });

/* ------------------------------ sezioni ------------------------------ */
export const createSection  = name => rpc('create_section', { p_name: name });
export const renameSection  = (id, name) => rpc('rename_section', { p_section: id, p_name: name });
export const deleteSection  = id => rpc('delete_section', { p_section: id });
export const setGroupSection = (g, s) =>
  rpc('set_group_section', { p_group: g, p_section: s || null });

/* =============================== piani =============================== */
export async function createPlan(payload) {
  const data = await rpc('create_plan', { p: payload });
  if (data && data.plan_id && data.token) saveToken(data.plan_id, data.token);
  return data;
}
export const previewInvite = t => rpc('preview_invite', { p_token: t });
export const joinPlan = (t, name, claim) =>
  rpc('join_plan', { p_token: t, p_display_name: name || null, p_claim_actor: claim || null });
export const submitBallot = (plan, field, cands, note) =>
  rpc('submit_ballot', { p_plan: plan, p_field: field, p_candidates: cands,
                         p_none_ok: cands.length === 0, p_note: note || null });
export const addCandidates = (plan, field, items) =>
  rpc('add_candidates', { p_plan: plan, p_field: field, p_items: items });
export const confirmPlan = (plan, when, where) =>
  rpc('confirm_plan', { p_plan: plan, p_when: when, p_where: where });
export const updatePlanField = (plan, field, value, note) =>
  rpc('update_plan_field', { p_plan: plan, p_field: field, p_value: value, p_note: note || null });
export const cancelPlan = (plan, note) => rpc('cancel_plan', { p_plan: plan, p_note: note || null });
export const setRsvp    = (plan, rsvp) => rpc('set_rsvp', { p_plan: plan, p_rsvp: rsvp });
export const logEvent   = (name, plan) =>
  rpc('log_event', { p_name: name, p_plan: plan || null, p_props: {} }).catch(() => {});

/* --------------------------- domande extra --------------------------- */
export const addPlanExtra = (plan, question, options, binary) =>
  rpc('add_plan_extra', { p_plan: plan, p_question: question,
                          p_options: options, p_binary: !!binary });
export const submitExtraBallot = (extra, cands) =>
  rpc('submit_extra_ballot', { p_extra: extra, p_candidates: cands });
export const confirmExtra = (extra, cand) =>
  rpc('confirm_extra', { p_extra: extra, p_candidate: cand });
export const removePlanExtra = extra => rpc('remove_plan_extra', { p_extra: extra });

/* ------------------------- commenti e proposte ------------------------ */
export const addComment = (plan, body) => rpc('add_comment', { p_plan: plan, p_body: body });
export const openProposal = (plan, field, value, reason) =>
  rpc('open_proposal', { p_plan: plan, p_field: field, p_value: value, p_reason: reason || null });
export const voteProposal = (id, vote) => rpc('vote_proposal', { p_proposal: id, p_vote: vote });
export const closeProposal = (id, status) =>
  rpc('close_proposal', { p_proposal: id, p_status: status });

// Applicare una proposta è in due tempi apposta: prima si cambia il piano con
// update_plan_field, che tiene aggiornati version e storia, poi si chiude la
// proposta. Se il primo passo fallisce, la proposta resta aperta.
export async function applyProposal(plan, proposal, field, value, reason) {
  await updatePlanField(plan, field, value, reason);
  await closeProposal(proposal, 'applied');
}

/* =============================== spese =============================== */
export const addExpense = (plan, cents, description, among) =>
  rpc('add_expense', { p_plan: plan, p_amount_cents: cents,
                       p_description: description, p_among: among && among.length ? among : null });
export const voidExpense   = id => rpc('void_expense', { p_expense: id });
export const addSettlement = (plan, to, cents) =>
  rpc('add_settlement', { p_plan: plan, p_to: to, p_amount_cents: cents });
export const planBalances  = plan => rpc('plan_balances', { p_plan: plan });

/* =============================== posti =============================== */
export const savePlace = (name, address, note) =>
  rpc('save_place', { p_name: name, p_address: address || null, p_note: note || null });
export const deletePlace = id => rpc('delete_place', { p_place: id });

/* =============================== media =============================== */
// Due tempi: prima il file va nello Storage, poi si registra la riga — che è
// anche il momento in cui il server applica i limiti. Se il secondo passo
// viene rifiutato il file caricato va tolto, altrimenti resta lì a occupare
// spazio senza che nessuna schermata lo mostri.
export async function uploadMedia(planId, file, kind) {
  const path = `plans/${planId}/${crypto.randomUUID()}`;
  const up = await sb.storage.from(BUCKET).upload(path, file);
  if (up.error) throw new Error('Non riesco a caricare il file: ' + up.error.message);
  try {
    return await rpc('register_media', {
      p_plan: planId, p_path: path, p_kind: kind || 'photo',
      p_name: file.name, p_size: file.size
    });
  } catch (e) {
    await sb.storage.from(BUCKET).remove([path]);   // niente file orfani
    throw e;
  }
}

export async function deleteMedia(id) {
  const path = await rpc('delete_media', { p_media: id });
  if (path) await sb.storage.from(BUCKET).remove([path]);
}

// Il bucket è privato: le immagini si mostrano con un link a scadenza.
export async function mediaUrl(path, seconds = 3600) {
  const { data, error } = await sb.storage.from(BUCKET).createSignedUrl(path, seconds);
  if (error) throw new Error('Non riesco ad aprire il file: ' + error.message);
  return data.signedUrl;
}
