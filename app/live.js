// live.js — attacca il prototipo al database vero.
//
// Il prototipo gestisce i click con un solo listener su document, in fase di
// bolla. Qui ci si mette davanti in fase di CATTURA: le azioni che sappiamo
// salvare le intercettiamo (chiamata RPC, ricarica, render), tutte le altre
// passano oltre e continuano a funzionare come demo locale.
//
// Un gestore può anche rifiutarsi, con `when`: serve per le azioni che a volte
// vanno salvate e a volte no. `saveExtra` in creazione lavora su una bozza che
// nel database non esiste ancora; su un piano già avviato invece è una scrittura
// vera. Senza `when` si romperebbe la creazione.

import * as data from './data.js';
import { toDbWhen, toDbWhere, toDbCandidate, draftToCreatePlan, mapPreview } from './map.js';

const SB_URL = 'https://fnafzokgkbhhjircrogy.supabase.co';
const SB_KEY = 'sb_publishable_f-CLx2j5Ht-ydkoh7iC-qQ_iacbBYW_';

/* ------------------------------------------------------------------ */
/* nucleo provabile: nessun DOM, nessuna rete                          */
/* ------------------------------------------------------------------ */

// `state` del prototipo è un const: si può solo mutare, non riassegnare.
// Si sostituiscono i dati e si lasciano stare le preferenze di sessione
// (calendario aperto, bozze, impostazioni), che non stanno nel database.
export function applyState(state, loaded) {
  for (const k of ['people', 'groups', 'plans']) {
    for (const id of Object.keys(state[k] || {})) delete state[k][id];
  }
  Object.assign(state.people, loaded.people);
  Object.assign(state.groups, loaded.groups);
  Object.assign(state.plans, loaded.plans);
  state.me = loaded.me;
  return state;
}

// Stessa logica di decidingFields() del prototipo, rifatta qui per non
// dipendere da un'altra funzione esportata.
export const campiInVoto = p => [
  ...(p.when.mode === 'deciding' ? ['when'] : []),
  ...(p.where.mode === 'deciding' ? ['where'] : []),
  ...(p.extras || []).filter(x => x.mode === 'deciding').map(x => x.id)
];

const inCents = s => {
  const n = parseFloat(String(s).replace(/[^\d,.-]/g, '').replace(',', '.'));
  return isNaN(n) ? null : Math.round(n * 100);
};

const curPlan = K => K.state.plans[K.state.currentPlan];
const val = (K, sel) => { const e = K.$(sel); return e ? e.value.trim() : ''; };
const on  = (K, sel) => { const e = K.$(sel); return !!e && e.classList.contains('on'); };

/* ------------------------------------------------------------------ */
/* le azioni che sanno arrivare al database                            */
/* ------------------------------------------------------------------ */

// Il token del link: #/i/<token>. Il prototipo cerca il piano fra quelli già
// in `state`, ma chi apre un invito non ne ha nessuno — va caricato prima.
export const tokenDaRotta = hash => {
  const m = String(hash || '').match(/^#\/?i\/([^/?#]+)/);
  return m ? decodeURIComponent(m[1]) : null;
};

export const HANDLERS = {

  /* -------------------------------------------------------- ospite */

  // "Sei uno di questi?": si rivendica un nome che l'organizzatore ha già
  // messo nel piano, invece di comparire come un doppione.
  async claim(el, K) {
    const p = curPlan(K) || Object.values(K.state.plans)[0];
    await data.joinPlan(p.token, null, el.dataset.id);
    data.saveToken(p.id, p.token);
    return { toast: 'Bentornato', closeSheet: true, go: 'p/' + p.id };
  },

  async join(el, K) {
    const nome = val(K, '#nameInput');
    if (!nome) return { toast: 'Scrivi il tuo nome', skipReload: true };
    const p = curPlan(K) || Object.values(K.state.plans)[0];
    await data.joinPlan(p.token, nome, null);
    data.saveToken(p.id, p.token);
    return { toast: 'Ci sei', closeSheet: true, go: 'p/' + p.id };
  },

  /* ------------------------------------------------------ ingresso */

  // Senza un profilo `loadState` torna me='guest' e il prototipo mostra la
  // vista web: l'app resta inaccessibile. Qui si crea il profilo sulla
  // sessione anonima già aperta, come fa V0 quando un ospite scrive il nome.
  async loginName(el, K) {
    if (!K.state.ageOk) return { toast: 'Conferma di avere almeno 16 anni', skipReload: true };
    const nome = val(K, '#welcomeName');
    if (!nome) return { toast: 'Scrivi come ti chiami', skipReload: true };
    await data.ensureActor(nome);
    K.state.consented = true;
    return { toast: 'Benvenuto, ' + nome, closeSheet: true };
  },

  login: {
    when: (el, K) => true,
    async run(el, K) {
      if (!K.state.ageOk) return { toast: 'Conferma di avere almeno 16 anni', skipReload: true };
      if (el.dataset.p === 'apple') {
        return { toast: 'Apple arriva quando l\'account sviluppatore è attivo', skipReload: true };
      }
      try {
        await data.signInWithGoogle(location.origin + location.pathname);
      } catch (e) {
        // Regola 5: dire cosa manca davvero, non "riprova".
        const m = String((e && e.message) || e).toLowerCase();
        if (m.includes('not enabled') || m.includes('provider')) {
          return { toast: 'Google non è ancora attivo su Supabase: entra col nome',
                   skipReload: true };
        }
        throw e;
      }
      return { skipReload: true };   // la pagina se ne va sul redirect
    }
  },

  /* -------------------------------------------------- creazione */

  // I passi 1-3 sono navigazione dentro la bozza: passano al prototipo.
  // Solo l'ultimo crea davvero il piano.
  next: {
    when: (el, K) => !!K.state.draft && K.state.draft.step >= 4,
    async run(el, K) {
      const d = K.state.draft;

      // Una chiamata sola, quindi una transazione sola. Prima erano tre e il
      // 25/8/2026 se n'è visto il perché: la seconda è fallita e in produzione
      // è rimasto un piano senza emoji, senza gruppo e senza domande, che chi
      // l'aveva creato non vedeva nemmeno.
      const res = await data.createPlanFull(draftToCreatePlan(d), {
        emoji: d.emoji,
        group: d.groupId || null,
        kind: 'plan',
        allowProposals: d.allowProposals !== false,
        extras: (d.extras || []).map(x => ({
          question: x.question,
          binary: !!x.binary,
          options: x.binary ? [] : (x.options || [])
        }))
      });
      const id = res && res.plan_id;
      if (!id) throw new Error('create_plan non ha reso un piano');

      K.state.draft = null; K.state.justVoted = false;
      K.state.ballotDraft = null; K.state.bdKey = null;
      return { go: 'share/' + id };
    }
  },

  /* ------------------------------------------------------ voto */

  // Il commit vero. tog/none/ynVote lavorano su una bozza locale e restano
  // al prototipo: solo qui si scrive.
  async vote(el, K) {
    const p = curPlan(K);
    const bd = K.state.ballotDraft || {};
    const campi = campiInVoto(p);

    for (const f of campi) {
      const d = bd[f];
      if (!d || (!d.approved.size && !d.noneOk)) {
        return { toast: 'Segna almeno un\'opzione per ogni domanda', skipReload: true };
      }
    }

    for (const f of campi) {
      const ids = [...bd[f].approved];
      if (f === 'when' || f === 'where') {
        await data.submitBallot(p.id, f, ids, bd[f].note || null);
      } else {
        await data.submitExtraBallot(f, ids);   // domanda extra
      }
    }
    K.state.ballotDraft = null; K.state.bdKey = null;   // così si ricarica dai dati veri
    K.state.justVoted = true;
    return { toast: 'Voto inviato' };
  },

  // Su un piano di tipo "decisione" toccare la risposta È il voto: si salva
  // subito. Su un piano normale è solo una selezione, e passa al prototipo.
  ynVote: {
    when: (el, K) => { const p = curPlan(K); return p && p.kind === 'decision'; },
    async run(el, K) {
      const p = curPlan(K);
      const f = el.dataset.field;
      if (f === 'when' || f === 'where') await data.submitBallot(p.id, f, [el.dataset.id], null);
      else await data.submitExtraBallot(f, [el.dataset.id]);
      K.state.ballotDraft = null; K.state.bdKey = null;
      K.state.justVoted = true;
      return { toast: 'Voto registrato' };
    }
  },

  async rsvp(el, K) {
    await data.setRsvp(curPlan(K).id, el.dataset.v);
    return {};
  },

  // Le opzioni proposte da un partecipante mentre si vota.
  async saveCand(el, K) {
    const p = curPlan(K), f = el.dataset.field;
    if (f !== 'when' && f !== 'where') {
      return { toast: 'Le opzioni delle domande si aggiungono creandole', skipReload: true };
    }
    let c;
    if (f === 'when') {
      const st = val(K, '#pcStart');
      if (!st) return { toast: 'Scegli una data', skipReload: true };
      c = { start: st, end: val(K, '#pcEnd'), allDay: on(K, '#pcAllDay') };
    } else {
      const n = val(K, '#pcName');
      if (!n) return { toast: 'Scrivi l\'opzione', skipReload: true };
      c = { name: n, address: val(K, '#pcAddr') };
    }
    await data.addCandidates(p.id, f, [toDbCandidate(f, c)]);
    return { toast: 'Opzione aggiunta: invia il voto per confermarla', closeSheet: true };
  },

  /* -------------------------------------------------- conferma */

  async confirm(el, K) {
    const p = curPlan(K), picks = K.state.picks || {};
    // Le domande extra si confermano una per una, quando/dove insieme.
    for (const [f, candId] of Object.entries(picks)) {
      if (f !== 'when' && f !== 'where' && candId) await data.confirmExtra(f, candId);
    }
    if (p.when.mode === 'deciding' || p.where.mode === 'deciding') {
      await data.confirmPlan(p.id, picks.when || null, picks.where || null);
    }
    return { toast: 'Kimari! ✅', closeSheet: true };
  },

  /* -------------------------------------------------- proposte */

  async savePropose(el, K) {
    const p = curPlan(K), f = el.dataset.field;
    const reason = val(K, '#prReason');
    let nv;
    if (f === 'when') {
      const st = val(K, '#prStart');
      if (!st) return { toast: 'Scegli data e ora', skipReload: true };
      nv = toDbWhen({ start: st, end: val(K, '#prEnd'), allDay: on(K, '#prAllDay') });
    } else {
      const n = val(K, '#prName');
      if (!n) return { toast: 'Scrivi il nome del posto', skipReload: true };
      nv = toDbWhere({ name: n, address: val(K, '#prAddr') });
    }
    await data.openProposal(p.id, f, nv, reason);
    return { toast: 'Proposta aperta', closeSheet: true };
  },

  async pvote(el, K) {
    const stato = await data.voteProposal(el.dataset.pr, el.dataset.v);
    return { toast: stato === 'approved' ? 'Proposta approvata'
                  : stato === 'rejected' ? 'Proposta rifiutata' : 'Voto registrato' };
  },

  // Due tempi apposta: prima si cambia il piano (update_plan_field tiene
  // aggiornati versione e storia), poi si chiude la proposta. Se il primo passo
  // fallisce la proposta resta aperta invece di risultare applicata a vuoto.
  async papply(el, K) {
    const p = curPlan(K);
    const pr = (p.proposals || []).find(x => x.id === el.dataset.pr);
    if (!pr) return { toast: 'Proposta non trovata', skipReload: true };
    const value = pr.field === 'when' ? toDbWhen(pr.newValue) : toDbWhere(pr.newValue);
    await data.applyProposal(p.id, pr.id, pr.field, value, pr.reason || null);
    return { toast: 'Piano aggiornato' };
  },

  async preject(el) {
    await data.closeProposal(el.dataset.pr, 'rejected');
    return { toast: 'Proposta rifiutata' };
  },

  async pwithdraw(el) {
    await data.closeProposal(el.dataset.pr, 'rejected');
    return { toast: 'Proposta ritirata' };
  },

  /* ----------------------------------------------------- spese */

  async saveExpense(el, K) {
    const p = curPlan(K), ed = K.state.edraft || {};
    const cents = inCents(ed.amount);
    if (!String(ed.desc || '').trim()) return { toast: 'Scrivi cosa hai pagato', skipReload: true };
    if (!cents || cents <= 0) return { toast: 'Importo non valido', skipReload: true };

    let among;
    if (ed.among === 'pick') {
      among = [...(ed.picked || [])];
      if (!among.length) return { toast: 'Scegli per chi è la spesa', skipReload: true };
    } else if (ed.among === 'yes') {
      among = p.participants.filter(x => x.rsvp === 'yes').map(x => x.id);
      if (among.length < 2) among = p.participants.map(x => x.id);
    } else {
      among = p.participants.map(x => x.id);
    }
    if (ed.payer && !among.includes(ed.payer)) among = [ed.payer, ...among];

    await data.addExpense(p.id, cents, String(ed.desc).trim(), among);
    return { toast: 'Spesa aggiunta', closeSheet: true };
  },

  async voidExpense(el) {
    await data.voidExpense(el.dataset.id);
    return { toast: 'Spesa annullata' };
  },

  async settle(el, K) {
    await data.addSettlement(curPlan(K).id, el.dataset.to, +el.dataset.amount);
    return { toast: 'Pagamento registrato' };
  },

  /* -------------------------------------------------- domande */

  // In creazione la domanda va nella bozza del piano, che ancora non esiste:
  // lì lascia fare al prototipo. Su un piano avviato è una scrittura vera.
  saveExtra: {
    when: (el, K) => !K.state.draft && !!curPlan(K),
    async run(el, K) {
      const x = K.state.xdraft || {};
      if (!String(x.question || '').trim()) return { toast: 'Scrivi la domanda', skipReload: true };
      if (!x.binary && (x.options || []).length < 2) {
        return { toast: 'Servono almeno 2 opzioni', skipReload: true };
      }
      await data.addPlanExtra(curPlan(K).id, x.question.trim(),
                              x.binary ? null : [...x.options], !!x.binary);
      return { toast: 'Domanda aggiunta al piano', closeSheet: true };
    }
  },

  rmExtra: {
    when: (el, K) => !K.state.draft && !!curPlan(K),
    async run(el) {
      await data.removePlanExtra(el.dataset.id);
      return { toast: 'Domanda tolta' };
    }
  },

  /* ----------------------------------------------------- gruppi */

  async saveGroup(el, K) {
    const gd = K.state.gdraft;
    if (!gd || !gd.name.trim()) return { toast: 'Dai un nome al gruppo', skipReload: true };

    if (gd.id) await data.updateGroup(gd.id, gd.name.trim(), gd.emoji, gd.color);
    else gd.id = await data.createGroup(gd.name.trim(), gd.emoji, gd.color);

    // Le sezioni sono private: vivono in tabelle a parte, non nel gruppo.
    let sectionId = gd.sectionId;
    if (sectionId === 'new') {
      if (!gd.newSection.trim()) return { toast: 'Scrivi il nome della sezione', skipReload: true };
      sectionId = await data.createSection(gd.newSection.trim());
    }
    await data.setGroupSection(gd.id, sectionId || null);
    return { toast: 'Gruppo salvato', closeSheet: true };
  },

  async leaveGroup(el) {
    await data.leaveGroup(el.dataset.g);
    return { toast: 'Sei uscito dal gruppo', closeSheet: true, go: 'home' };
  },

  async removeMember(el, K) {
    await data.removeGroupMember(el.dataset.g, el.dataset.id);
    return { toast: 'Tolto dal gruppo', closeSheet: true };
  },

  async toggleAdmin(el, K) {
    const g = K.state.groups[el.dataset.g];
    const era = g && g.admins.includes(el.dataset.id);
    await data.setGroupAdmin(el.dataset.g, el.dataset.id, !era);
    return { toast: era ? 'Non è più admin' : 'Ora è admin', closeSheet: true };
  },

  async revokeLink(el, K) {
    const g = el.dataset.g || (K.route && K.route().arg);
    await data.revokeGroupInvites(g);
    return { toast: 'Link revocato: chi è già dentro resta', closeSheet: true };
  },

  /* ----------------------------------------------------- profilo */

  async email(el, K) {
    const v = val(K, '#emailInput');
    if (!v.includes('@')) return { toast: 'Controlla l\'email', skipReload: true };
    await data.setMyEmail(v.toLowerCase());
    return { toast: 'Ti avvisiamo alla conferma' };
  },

  async savePlaceDraft(el, K) {
    const d = K.state.draft;
    if (!d || !d.whereFixed || !d.whereFixed.name) return { skipReload: true };
    await data.savePlace(d.whereFixed.name, d.whereFixed.address, null);
    return { toast: 'Salvato tra i tuoi posti ★' };
  },

  async delPlace(el) {
    await data.deletePlace(el.dataset.id);
    return { toast: 'Posto tolto', closeSheet: true };
  },

  async comment(el, K) {
    const input = K.$('#commentInput');
    const v = input ? input.value.trim() : '';
    if (!v) return { skipReload: true };
    await data.addComment(curPlan(K).id, v);
    if (input) input.value = '';
    return {};
  }
};

/* ------------------------------------------------------------------ */
/* aggancio al DOM                                                     */
/* ------------------------------------------------------------------ */

export async function reload(K) {
  applyState(K.state, await data.loadState());
  await caricaInvito(K);
  K.render();
}

// Se la rotta è un invito e quel piano non è fra i propri, lo si chiede al
// server con preview_invite — che risponde anche a chi non è ancora entrato.
// Senza questo il prototipo mostrerebbe "questo link non porta a niente".
export async function caricaInvito(K) {
  const token = tokenDaRotta(location.hash);
  if (!token) return false;
  if (Object.values(K.state.plans).some(p => p.token === token)) return false;

  try {
    const prev = await data.previewInvite(token);
    if (!prev || !prev.ok) return false;
    const { plan, people } = mapPreview(prev, token);
    for (const [id, p] of Object.entries(people)) {
      if (!K.state.people[id]) K.state.people[id] = p;
    }
    K.state.plans[plan.id] = plan;
    return true;
  } catch (e) {
    console.error('invito', e);
    return false;
  }
}

function wire(K) {
  document.addEventListener('click', e => {
    const el = e.target.closest('[data-action]');
    if (!el) return;
    const h = HANDLERS[el.dataset.action];
    if (!h) return;                                   // non nostra

    const run = typeof h === 'function' ? h : h.run;
    if (h.when && !h.when(el, K)) return;             // nostra, ma non stavolta

    // Da qui in poi è roba nostra: il gestore del prototipo non deve vederla,
    // altrimenti scrive anche in locale e i dati divergono.
    e.stopPropagation();
    e.preventDefault();

    Promise.resolve(run(el, K))
      .then(async res => {
        res = res || {};
        if (res.closeSheet && K.closeSheet) K.closeSheet();
        if (!res.skipReload) await reload(K);
        if (res.toast && K.toast) K.toast(res.toast);
        if (res.go && K.go) K.go(res.go);
      })
      .catch(err => {
        // Regola 5: il dettaglio vero, non "qualcosa è andato storto".
        if (K.toast) K.toast(err.message || String(err));
        console.error(el.dataset.action, err);
      });
  }, true);                                           // ← cattura: prima del prototipo

  // Il prototipo renderizza a ogni hashchange. Se si apre un invito il piano
  // non c'è ancora: si carica e si renderizza di nuovo.
  window.addEventListener('hashchange', () => {
    caricaInvito(K).then(caricato => { if (caricato) K.render(); });
  });
}

export async function boot() {
  const K = window.__kimari;
  if (!K) { console.error('live.js caricato prima del prototipo'); return; }

  if (!window.supabase || !window.supabase.createClient) {
    K.toast && K.toast('Libreria Supabase non caricata: resto in modalità demo');
    return;
  }

  data.init(window.supabase.createClient(SB_URL, SB_KEY));

  try {
    await data.ensureSession();
    await reload(K);
    wire(K);
    document.body.dataset.kimari = 'live';

    // Sessione aperta ma nessun profilo: senza questo il prototipo mostrerebbe
    // la vista web (isWeb() è vero quando me === 'guest') e nell'app non si
    // entrerebbe mai. La porta d'ingresso va aperta a mano.
    if (K.state.me === 'guest' && K.openSheet && K.sheetWelcome) {
      K.state.welcomeShown = true;
      K.openSheet(K.sheetWelcome());
    }
  } catch (e) {
    // Non si azzera lo schermo: i dati finti del prototipo restano, e l'utente
    // legge perché non è collegato invece di trovare una pagina vuota.
    K.toast && K.toast('Non collegato: ' + (e.message || e));
    console.error('boot', e);
    document.body.dataset.kimari = 'demo';
  }
}

if (typeof window !== 'undefined' && window.document) {
  if (document.readyState === 'complete') boot();
  else window.addEventListener('load', boot);
}
