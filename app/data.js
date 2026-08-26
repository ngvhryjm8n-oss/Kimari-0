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
} from './map.js?v=26%2F08%2020%3A41';

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

// Si sta tornando da Google o da Apple? Il token arriva nell'URL: nel frammento
// (flusso implicito) o come ?code= (flusso PKCE).
export const tornandoDaLogin = () =>
  /[#&](access_token|error_description)=/.test(location.hash) ||
  /[?&]code=/.test(location.search);

// La libreria consuma l'URL da sola, ma in modo asincrono. Qui si aspetta che
// abbia finito, invece di chiedere la sessione un attimo troppo presto.
function aspettaSessione(ms = 8000) {
  return new Promise(resolve => {
    let finito = false;
    const chiudi = s => { if (!finito) { finito = true; clearTimeout(orologio); resolve(s); } };
    const { data } = sb.auth.onAuthStateChange((_evento, sessione) => {
      if (sessione) { try { data.subscription.unsubscribe(); } catch { /* niente */ } chiudi(sessione); }
    });
    const orologio = setTimeout(() => {
      try { data.subscription.unsubscribe(); } catch { /* niente */ }
      chiudi(null);
    }, ms);
  });
}

export async function ensureSession() {
  const s = await currentSession();
  if (s) return s;

  // IL PUNTO. Tornando da un login il token è ancora nell'URL e la libreria
  // non l'ha ancora letto: entrare come anonimi adesso significherebbe
  // sovrascrivere l'accesso appena fatto con una sessione vuota, e all'utente
  // ricomparirebbe la schermata d'ingresso come se non fosse successo niente.
  if (tornandoDaLogin()) {
    const arrivata = await aspettaSessione();
    if (arrivata) return arrivata;
    // Scaduta l'attesa senza sessione: c'è stato un errore vero, e va detto.
    const motivo = new URLSearchParams(location.hash.replace(/^#/, '')).get('error_description')
                || new URLSearchParams(location.search).get('error_description');

    // "Identity is already linked to another user": si stava provando a
    // collegare Apple o Google a una sessione ospite, ma quell'identità
    // appartiene già a un account. Non è un errore da mostrare: la persona ha
    // semplicemente già un account, e la cosa giusta è farla entrare.
    //
    // Succede a chi apre l'app su un secondo dispositivo. Prima si tornava
    // alla schermata d'ingresso senza una parola, e riprovando succedeva
    // sempre lo stesso: un vicolo cieco.
    if (motivo && /already.*(linked|registered|exists)|identity_already/i.test(motivo)) {
      try { localStorage.removeItem(PENDING_LINK); } catch { /* niente */ }
      const provider = new URLSearchParams(location.hash.replace(/^#/, '')).get('provider')
                    || localStorage.getItem('kimari_provider') || 'google';
      const { error } = await sb.auth.signInWithOAuth({
        provider, options: { redirectTo: location.origin + location.pathname }
      });
      if (error) throw new Error('Accesso rifiutato: ' + error.message);
      // Da qui parte un redirect: la pagina se ne va.
      return null;
    }

    if (motivo) throw new Error('Accesso rifiutato: ' + motivo);
  }

  const { data, error } = await sb.auth.signInAnonymously();
  if (error) throw new Error('Accesso rifiutato da Supabase: ' + error.message);
  return data.session;
}

// Dopo il login l'URL resta pieno di token, e il prototipo usa il frammento
// per sapere che schermata mostrare: va ripulito, o si ritrova a interpretare
// "access_token=..." come una rotta.
export function pulisciUrlDopoLogin() {
  if (!tornandoDaLogin()) return false;
  history.replaceState(null, '', location.origin + location.pathname);
  return true;
}

// Segno lasciato prima del salto verso Google: al ritorno dice che l'actor
// esistente porta ancora il nome buttato lì per votare da ospite.
const PENDING_LINK = 'kimari_link_google';

export async function signInWithProvider(provider, redirectTo) {
  const s = await currentSession();
  const opts = { provider, options: { redirectTo } };

  // Collegare serve a NON perdere quello che si è fatto da ospite. Ma se da
  // ospite non si è ancora fatto niente — sessione appena creata, nessun
  // profilo — non c'è niente da salvare, e collegare fa danno: se quella
  // identità Apple o Google è già legata a un altro account, Supabase rifiuta
  // e si torna alla schermata d'ingresso senza spiegazioni.
  //
  // È il caso normale di chi apre l'app su un secondo dispositivo, o su un
  // indirizzo nuovo: lì la sessione ospite è vuota per definizione.
  const daSalvare = s && s.user.is_anonymous && await hoQualcosaDaSalvare();

  // Quale provider si sta usando, per poterlo riprovare al ritorno se il
  // collegamento viene rifiutato: nell'URL di ritorno quell'informazione non c'e'.
  try { localStorage.setItem('kimari_provider', provider); } catch { /* niente */ }

  if (daSalvare) {
    try { localStorage.setItem(PENDING_LINK, '1'); } catch { /* niente */ }
    const { error } = await sb.auth.linkIdentity(opts);
    if (error) throw error;
  } else {
    try { localStorage.removeItem(PENDING_LINK); } catch { /* niente */ }
    const { error } = await sb.auth.signInWithOAuth(opts);
    if (error) throw error;
  }
}

// C'è qualcosa che si perderebbe entrando come un altro utente? Un profilo
// basta: significa che questa persona ha già scritto il proprio nome, e forse
// votato. Senza profilo la sessione ospite è un contenitore vuoto.
async function hoQualcosaDaSalvare() {
  try { return !!(await myActor()); }
  catch { return false; }   // se non si riesce a chiedere, non si rischia il collegamento
}

// Da chiamare all'avvio. Se si torna da un collegamento, l'actor c'è già ma si
// chiama ancora "Ospite": adesso che sappiamo il nome vero si adotta quello,
// insieme all'email. Torna true se ha cambiato qualcosa, così chi chiama sa
// che deve ricaricare.
// Dopo linkIdentity l'utente NON è più anonimo, ma il token che si ha in mano
// continua a dire is_anonymous: true finché non viene rinnovato. Fidarsi di
// quel campo significa non accorgersi mai che l'accesso è avvenuto.
// Si guardano invece le identità collegate, che sono aggiornate.
export function haIdentitaVera(user) {
  if (!user) return false;
  const provider = (user.identities || []).map(i => i.provider);
  if (provider.some(p => p && p !== 'anonymous')) return true;
  // Ricaduta per i casi in cui identities non arriva: un'email c'è solo se
  // qualcuno l'ha fornita, e un utente anonimo non ne ha.
  return !!user.email;
}

export async function adottaIdentitaGoogle() {
  let inCorso = false;
  try { inCorso = localStorage.getItem(PENDING_LINK) === '1'; } catch { /* niente */ }

  // Il token appena tornato può essere ancora quello vecchio: rinnovarlo porta
  // le informazioni aggiornate sull'utente.
  if (inCorso) { try { await sb.auth.refreshSession(); } catch { /* pazienza */ } }

  const s = await currentSession();
  if (!s || !haIdentitaVera(s.user)) return false;

  // Il profilo va creato COMUNQUE, anche senza il segno lasciato prima del
  // salto: chi ha un'identità vera e nessun profilo resterebbe 'ospite' e si
  // vedrebbe ricomparire la schermata d'ingresso dopo essere entrato.
  const attuale = await myActor();
  if (!inCorso && attuale) return false;
  try { localStorage.removeItem(PENDING_LINK); } catch { /* niente */ }

  const md = s.user.user_metadata || {};
  const nome = md.full_name || md.name || md.preferred_username
            || (s.user.email || '').split('@')[0] || 'Io';
  await ensureActor(nome);
  if (s.user.email) { try { await setMyEmail(s.user.email); } catch { /* non blocca */ } }
  return true;
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
  // TUTTO in un giro solo. Prima erano quattro ondate in fila — l'attore, poi
  // i piani, poi le righe filtrate per plan_id, poi quelle filtrate per
  // candidate_id — e ogni ondata è un viaggio fino a Francoforte. Misurato su
  // un tocco: 719 ms, quasi tutti d'attesa, per cambiare una parola a schermo.
  //
  // Le ondate esistevano solo per passare gli id al filtro `.in('plan_id', …)`.
  // Ma quel filtro non serve: la RLS è già participant-scoped, quindi la stessa
  // domanda senza filtro rende esattamente le stesse righe. Verificato contro
  // la produzione il 26/8/2026 con due account: quello estraneo, interrogando
  // `candidates` senza filtro, ha visto le sue 2 righe e zero delle 4 altrui.
  //
  // Il filtro nel client non era una difesa — la difesa è la RLS, e il filtro
  // le camminava dietro ripetendo quello che aveva già fatto.
  const [actor,
         groupRows, memberRows, sectionRows, groupSectionRows,
         placeRows, entRows, friendRows, muteRows, placeMediaRows,
         planRows,
         cands, parts, ballots, changes, extras, comments,
         proposals, expenses, settlements, media,
         approvals, extraCands, extraApprovals, propVotes, expShares,
         actorRows] = await Promise.all([
    myActor(),
    rows(sb.from('groups').select('*'), 'i gruppi'),
    rows(sb.from('group_members').select('group_id, actor_id, role, joined_at'), 'i membri dei gruppi'),
    rows(sb.from('sections').select('*').order('position'), 'le tue sezioni'),
    rows(sb.from('group_sections').select('*'), 'le tue sezioni'),
    rows(sb.from('places').select('*').order('used_count', { ascending: false }), 'i posti salvati'),
    rows(sb.from('entitlements').select('*'), 'il tuo piano'),
    rows(sb.from('friendships').select('friend_id'), 'i tuoi amici'),
    rows(sb.from('mutes').select('group_id'), 'i gruppi silenziati'),
    rows(sb.from('place_media').select('*'), 'le foto dei posti'),
    rows(sb.from('plans').select('*'), 'i piani'),

    rows(sb.from('candidates').select('*'), 'le opzioni'),
    rows(sb.from('participants').select('*'), 'i partecipanti'),
    rows(sb.from('ballots').select('*'), 'i voti'),
    rows(sb.from('plan_changes').select('*'), 'la storia dei piani'),
    rows(sb.from('plan_extras').select('*'), 'le domande'),
    rows(sb.from('comments').select('*').order('created_at'), 'i commenti'),
    rows(sb.from('proposals').select('*'), 'le proposte'),
    rows(sb.from('expenses').select('*'), 'le spese'),
    rows(sb.from('settlements').select('*'), 'i rimborsi'),
    rows(sb.from('media').select('*'), 'le foto'),

    rows(sb.from('approvals').select('*'), 'le preferenze'),
    rows(sb.from('extra_candidates').select('*'), 'le opzioni delle domande'),
    rows(sb.from('extra_approvals').select('*'), 'le preferenze sulle domande'),
    rows(sb.from('proposal_votes').select('*'), 'i voti sulle proposte'),
    rows(sb.from('expense_shares').select('*'), 'le quote delle spese'),
    rows(sb.from('actors').select('id, display_name'), 'i nomi')
  ]);

  // Il controllo va DOPO: senza profilo non c'è niente da mostrare, ma le
  // domande partono comunque tutte insieme e la RLS non rende nulla a chi non
  // ha un attore. Aspettare qui costerebbe un viaggio in più a ogni azione.
  if (!actor) return { me: 'guest', people: {}, groups: {}, plans: {} };

  /* --------------------------------------------------- persone */
  const people = {};
  for (const a of actorRows) people[a.id] = mapPerson(a);
  people[actor.id] = mapPerson(actor, {
    sections: sectionRows.map(mapSection),
    groupSections: Object.fromEntries(groupSectionRows.map(r => [r.group_id, r.section_id])),
    places: placeRows.map(p => mapPlace(p, placeMediaRows)),
    friends: friendRows.map(f => f.friend_id),
    muted: muteRows.map(m => m.group_id),
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

/* ========================== notifiche push ========================== */

// La chiave pubblica VAPID: la vedono tutti, sta qui apposta. Quella privata
// firma le notifiche e vive SOLO nei segreti di Supabase — se finisse qui,
// chiunque potrebbe mandare notifiche a nome di Kimari.
const VAPID = 'BGnXCaULtWGf9hHfDsBTOQ8Ij56OqCBeFRytaWjlxFm42wCJ-PaPdXfGG0o9WUIotpl33h-M-sLe33VKK_Lof18';

const inBytes = b64 => {
  const s = (b64 + '='.repeat((4 - b64.length % 4) % 4)).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(s);
  return Uint8Array.from(raw, c => c.charCodeAt(0));
};

// Su iPhone le notifiche arrivano SOLO all'app aggiunta alla schermata Home, e
// solo da iOS 16.4. In Safari normale l'API non c'è proprio: chiederle
// darebbe un errore incomprensibile invece di una spiegazione.
export function pushPossibili() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    return { si: false, perche: 'Questo browser non sa ricevere notifiche' };
  }
  const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const installata = window.matchMedia('(display-mode: standalone)').matches
                  || navigator.standalone === true;
  if (iOS && !installata) {
    return { si: false, perche: 'Su iPhone servono l\'app aggiunta alla schermata Home' };
  }
  return { si: true };
}

export async function attivaPush() {
  const p = pushPossibili();
  if (!p.si) throw new Error(p.perche);

  const permesso = await Notification.requestPermission();
  if (permesso !== 'granted') {
    // Un rifiuto non è un errore da nascondere: il browser non lo richiede
    // una seconda volta, e chi ha detto no deve sapere dove ripensarci.
    throw new Error('Notifiche negate: si riattivano dalle impostazioni del browser');
  }

  const reg = await navigator.serviceWorker.register('./sw.js');
  await navigator.serviceWorker.ready;

  // Se c'è già un'iscrizione la si riusa: chiederne una nuova ogni volta
  // lascerebbe dietro endpoint morti a cui il server continua a scrivere.
  const sub = await reg.pushManager.getSubscription()
           || await reg.pushManager.subscribe({
                userVisibleOnly: true,          // niente notifiche invisibili
                applicationServerKey: inBytes(VAPID)
              });

  const j = sub.toJSON();
  await rpc('save_push_subscription', {
    p_endpoint: j.endpoint, p_p256dh: j.keys.p256dh, p_auth: j.keys.auth
  });
  return true;
}

export async function spegniPush() {
  if (!('serviceWorker' in navigator)) return false;
  const reg = await navigator.serviceWorker.getRegistration();
  const sub = reg && await reg.pushManager.getSubscription();
  if (!sub) return false;
  // Prima si toglie dal server, poi dal browser: se si facesse il contrario e
  // la chiamata fallisse, resterebbe un endpoint a cui scrivere per sempre
  // senza più nessuno che possa cancellarlo.
  await rpc('delete_push_subscription', { p_endpoint: sub.endpoint });
  await sub.unsubscribe();
  return true;
}

export async function pushAttive() {
  if (!('serviceWorker' in navigator)) return false;
  try {
    const reg = await navigator.serviceWorker.getRegistration();
    return !!(reg && await reg.pushManager.getSubscription());
  } catch { return false; }
}

/* ------- token degli inviti: restano sul dispositivo, come in V0 ------- */
const LSK = 'kimari_tokens';
const store = () => { try { return JSON.parse(localStorage.getItem(LSK) || '{}'); }
                      catch { return {}; } };
export const tokenFor = planId => store()[planId] || null;

// I token restano sul dispositivo perché nel database sono hashati: il server
// non può restituirli, nemmeno a chi ha creato il piano. Quindi chi apre il
// proprio piano da un altro telefono — o dopo aver svuotato il browser — non
// ce l'ha più, e il messaggio da mandare conteneva "?t=null": un link rotto,
// pronto da incollare su WhatsApp.
//
// Questa ne fa uno nuovo. Il server la concede solo a chi organizza, e i link
// vecchi restano validi: chi ha già votato non se ne accorge.
export const createInviteLink = plan => rpc('create_invite_link', { p_plan: plan });
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
// Creazione atomica: una sola RPC, quindi una sola transazione. Se qualcosa
// va storto non resta un piano a metà.
export async function createPlanFull(payload, o = {}) {
  const data = await rpc('create_plan_full', {
    p: payload,
    p_emoji: o.emoji || null,
    p_group: o.group || null,
    p_kind: o.kind || null,
    p_allow_proposals: o.allowProposals !== false,
    p_extras: o.extras || []
  });
  if (data && data.plan_id && data.token) saveToken(data.plan_id, data.token);
  return data;
}

export const finalizePlan = (plan, emoji, group, kind, allowProposals) =>
  rpc('finalize_plan', { p_plan: plan, p_emoji: emoji || null, p_group: group || null,
                         p_kind: kind || null, p_allow_proposals: allowProposals });
export const previewInvite = t => rpc('preview_invite', { p_token: t });
/* --------------- quanto è chiuso un piano (0012) --------------- */
export const setJoinPolicy = (plan, policy) =>
  rpc('set_join_policy', { p_plan: plan, p_policy: policy });
export const addPlanPlaceholder = (plan, name) =>
  rpc('add_plan_placeholder', { p_plan: plan, p_name: name });
export const removePlanPlaceholder = (actor, plan) =>
  rpc('remove_plan_placeholder', { p_actor: actor, p_plan: plan });
// Aggiorna il link GIÀ condiviso invece di crearne uno nuovo: quello mandato
// nel gruppo deve continuare a funzionare.
export const setInviteLimits = (plan, maxUses, expiresAt) =>
  rpc('set_invite_limits', { p_plan: plan, p_max_uses: maxUses || null,
                             p_expires_at: expiresAt || null });
export const revokeInviteLinks = plan => rpc('revoke_invite_links', { p_plan: plan });
export const removeParticipant = (plan, actor) =>
  rpc('remove_participant', { p_plan: plan, p_actor: actor });

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
// Applicare una proposta erano DUE transazioni: cambia il piano, poi chiudi la
// proposta. Se la seconda non arriva — rete che cade, app chiusa nel mezzo — il
// piano è cambiato e la proposta resta aperta: il gruppo vede in attesa una
// modifica già fatta, e riapplicandola il piano fa una versione identica alla
// precedente con una voce di storia che dice "cambiato" senza che sia cambiato
// niente. La stessa struttura, sulla creazione, ha lasciato un piano a metà in
// produzione il 25/8/2026.
//
// La 0016 la fa diventare un passo solo. Finché non è applicata si ricade sulle
// due chiamate: così non esiste un momento in cui l'app è pubblicata e la
// funzione non c'è ancora — che sarebbe un difetto peggiore di quello che si
// sta togliendo.
export async function applyProposal(plan, proposal, field, value, reason) {
  try {
    return await rpc('apply_proposal', { p_proposal: proposal });
  } catch (e) {
    const manca = /apply_proposal.*(schema cache|does not exist)|PGRST202/i
                    .test(String(e && e.message));
    if (!manca) throw e;                    // un rifiuto vero va riportato
    await updatePlanField(plan, field, value, reason);
    await closeProposal(proposal, 'applied');
  }
}

/* =============================== spese =============================== */
export const addExpense = (plan, cents, description, among) =>
  rpc('add_expense', { p_plan: plan, p_amount_cents: cents,
                       p_description: description, p_among: among && among.length ? among : null });
export const voidExpense   = id => rpc('void_expense', { p_expense: id });
export const addSettlement = (plan, to, cents) =>
  rpc('add_settlement', { p_plan: plan, p_to: to, p_amount_cents: cents });
export const planBalances  = plan => rpc('plan_balances', { p_plan: plan });

/* ==================== ritardi, assenze, prenotato ==================== */
export const setMyLate   = (plan, minutes, note) =>
  rpc('set_my_late', { p_plan: plan, p_minutes: minutes, p_note: note || null });
export const clearMyLate = plan => rpc('clear_my_late', { p_plan: plan });
export const setMyAbsence = (plan, note) =>
  rpc('set_my_absence', { p_plan: plan, p_note: note || null });
export const setPlanBooked = (plan, booked) =>
  rpc('set_plan_booked', { p_plan: plan, p_booked: !!booked });

/* ====================== amici e gruppi silenziati ==================== */
export const addFriend       = actor => rpc('add_friend', { p_actor: actor });
export const removeFriend    = actor => rpc('remove_friend', { p_actor: actor });
export const toggleGroupMute = group => rpc('toggle_group_mute', { p_group: group });

/* =================== commenti, gruppi, moderazione =================== */
export const deleteComment = id => rpc('delete_comment', { p_comment: id });
export const deleteGroup   = id => rpc('delete_group', { p_group: id });
export const transferGroupOwner = (group, actor) =>
  rpc('transfer_group_owner', { p_group: group, p_actor: actor });

/* =============================== posti =============================== */
export const addPlaceLink = (place, name, url) =>
  rpc('add_place_media', { p_place: place, p_kind: 'link', p_name: name, p_url: url });
export const deletePlaceMedia = id => rpc('delete_place_media', { p_media: id });
export const setPlaceCover    = id => rpc('set_place_cover', { p_media: id });

// Foto di un posto: prima nello Storage, poi la riga. Come per i piani, se la
// riga viene rifiutata il file caricato va tolto.
export async function uploadPlacePhoto(placeId, file) {
  const path = `places/${placeId}/${crypto.randomUUID()}`;
  const up = await sb.storage.from(BUCKET).upload(path, file);
  if (up.error) throw new Error('Non riesco a caricare la foto: ' + up.error.message);
  try {
    return await rpc('add_place_media', {
      p_place: placeId, p_kind: 'photo', p_name: file.name, p_path: path, p_size: file.size
    });
  } catch (e) {
    await sb.storage.from(BUCKET).remove([path]);
    throw e;
  }
}

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

// Un link non e' un file: niente bucket, niente contabilita' dello spazio.
// Prima "Aggiungi link" scriveva solo in memoria e spariva al ricaricamento.
export const addPlanLink = (plan, name, url) =>
  rpc('add_plan_link', { p_plan: plan, p_name: name, p_url: url });

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
