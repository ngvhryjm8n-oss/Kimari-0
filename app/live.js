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

// Marcatura della versione: le app installate tengono la cache a lungo, e
// senza un numero visibile non c'e' modo di sapere se quello che si sta
// guardando e' l'ultima correzione o una copia di tre ore fa.
export const VERSIONE = '26/08 03:55';

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

  // QUI stava il bug che sembrava un login rotto. Il prototipo riapre la
  // schermata di benvenuto finché state.consented è falso — e consented vive
  // in memoria. Nella demo l'app non si ricaricava mai; nel mondo vero ogni
  // ricarica lo azzerava, e a chi era già dentro ricompariva "Continua con
  // Google" come se non fosse mai entrato.
  // Chi ha un profilo per la porta ci è già passato: non gliela si chiede più.
  if (loaded.me && loaded.me !== 'guest') {
    state.consented = true;
    state.ageOk = true;
    state.welcomeShown = true;
    // La marcatura la legge il prototipo al PROSSIMO avvio, prima che questo
    // file esista: e' l'unico modo di impedirgli di programmare il benvenuto,
    // invece di rincorrerlo chiudendolo dopo.
    try { localStorage.setItem('kimari_profilo', '1'); } catch { /* niente */ }
  } else {
    try { localStorage.removeItem('kimari_profilo'); } catch { /* niente */ }
  }
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

// Invito a un GRUPPO: #/gi/<token>. Rotta diversa da quella dei piani perché
// porta a un posto diverso — si entra in un gruppo, non si vota un piano.
export const tokenGruppoDaRotta = hash => {
  const m = String(hash || '').match(/^#\/?gi\/([^/?#]+)/);
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

  /* ------------------------------------------- invitare in un gruppo */

  // Il link a un gruppo NON si compone da un id: serve un token, e lo dà il
  // server. Per questo nel messaggio del prototipo c'era {link} — un
  // segnaposto visibile, invece di un indirizzo che sembra buono e non porta
  // da nessuna parte.
  async inviteGroup(el, K) {
    const g = K.state.groups[el.dataset.g];
    if (!g) return { toast: 'Gruppo non trovato', skipReload: true };

    const token = await data.createGroupInvite(g.id);
    const link = location.origin + location.pathname + '#/gi/' + token;
    const testo = K.msgs.group(g).replace('{link}', link);

    // msgSheet apre già lo sheet da sé: non va avvolta in openSheet.
    K.msgSheet('Invita nel gruppo',
               'Chi apre il link entra nel gruppo. Puoi revocarlo quando vuoi.',
               testo, { emoji: g.emoji, title: g.name });
    return { skipReload: true };
  },

  /* ------------------------------------------------------ ingresso */

  // Senza un profilo `loadState` torna me='guest' e il prototipo mostra la
  // vista web: l'app resta inaccessibile. Qui si crea il profilo sulla
  // sessione anonima già aperta, come fa V0 quando un ospite scrive il nome.
  async loginName(el, K) {
    const nome = val(K, '#welcomeName');
    if (!nome) return { toast: 'Scrivi come ti chiami', skipReload: true };
    if (!K.state.ageOk) return { toast: 'Conferma prima di avere almeno 16 anni', skipReload: true };
    await data.ensureActor(nome);
    K.state.consented = true;
    return { toast: 'Benvenuto, ' + nome, closeSheet: true };
  },

  // Un gestore solo per tutti e due: il provider arriva dal bottone. Prima
  // Apple era cablata a rifiutare — scritta quando l'account non c'era e mai
  // tolta dopo averlo attivato.
  async login(el, K) {
    const chi = el.dataset.p === 'apple' ? 'apple' : 'google';
    if (!K.state.ageOk) {
      return { toast: 'Prima conferma di avere almeno 16 anni', skipReload: true };
    }
    try {
      await data.signInWithProvider(chi, location.origin + location.pathname);
    } catch (e) {
      // Regola 5: dire cosa manca davvero, non "riprova".
      const m = String((e && e.message) || e).toLowerCase();
      const nome = chi === 'apple' ? 'Apple' : 'Google';
      if (m.includes('not enabled') || m.includes('provider is not')) {
        return { toast: nome + ' non è attivo su Supabase', skipReload: true };
      }
      if (m.includes('redirect') || m.includes('not allowed')) {
        return { toast: 'Questo indirizzo non è fra i Redirect URLs di Supabase: ' +
                        location.origin + location.pathname, skipReload: true };
      }
      throw e;
    }
    return { skipReload: true };   // la pagina se ne va sul redirect
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

  // Una "decisione" è un piano il cui unico scopo è una domanda: stessa
  // creazione atomica, con kind='decision' e la domanda già dentro.
  async saveDecision(el, K) {
    const dd = K.state.ddraft || {};
    if (!String(dd.question || '').trim()) {
      return { toast: 'Scrivi la domanda', skipReload: true };
    }
    if (!dd.binary && (dd.options || []).length < 2) {
      return { toast: 'Servono almeno 2 opzioni', skipReload: true };
    }
    const res = await data.createPlanFull(
      { title: dd.question.trim(), when_mode: 'later', where_mode: 'later' },
      { emoji: '❓', group: dd.groupId || null, kind: 'decision', allowProposals: false,
        extras: [{ question: dd.question.trim(), binary: !!dd.binary,
                   options: dd.binary ? [] : (dd.options || []) }] });
    K.state.ddraft = null;
    return { closeSheet: true, go: 'p/' + res.plan_id };
  },

  // Modifica di un piano già confermato: passa da update_plan_field, che tiene
  // aggiornati versione e storia. Un campo per volta, come vuole quella RPC.
  async saveEdit(el, K) {
    const p = curPlan(K);
    const start = val(K, '#editStart');
    const nome  = val(K, '#editPlace');
    let cambiato = 0;

    if (start) {
      const nuovo = toDbWhen({ start, end: val(K, '#editEnd'), allDay: on(K, '#editAllDay') });
      const vecchio = p.when.value;
      if (!vecchio || new Date(vecchio.start).getTime() !== new Date(nuovo.starts_at).getTime()) {
        await data.updatePlanField(p.id, 'when', nuovo, null);
        cambiato++;
      }
    }
    if (nome) {
      const vecchio = p.where.value;
      if (!vecchio || vecchio.name !== nome || (vecchio.address || '') !== val(K, '#editAddr')) {
        await data.updatePlanField(p.id, 'where',
          toDbWhere({ name: nome, address: val(K, '#editAddr') }), null);
        cambiato++;
      }
    }
    if (!cambiato) return { toast: 'Nessuna modifica', closeSheet: true, skipReload: true };
    return { toast: 'Piano aggiornato', closeSheet: true };
  },

  /* -------------------------------------------- chi può votare */

  async setPolicy(el, K) {
    await data.setJoinPolicy(curPlan(K).id, el.dataset.v);
    // Lo sheet resta aperto: cambiando in 'roster' compare l'elenco da
    // riempire, e chiuderlo costringerebbe a riaprirlo subito.
    return { toast: 'Aggiornato', riapriSheet: 'joinPolicy' };
  },

  async addRoster(el, K) {
    const nome = val(K, '#rosterName');
    if (!nome) return { toast: 'Scrivi un nome', skipReload: true };
    await data.addPlanPlaceholder(curPlan(K).id, nome);
    return { riapriSheet: 'joinPolicy' };
  },

  async rmRoster(el, K) {
    // Se quella persona è già entrata il server rifiuta con un messaggio
    // chiaro: il client non può distinguerla da un segnaposto, perché non
    // vede auth_user_id.
    await data.removePlanPlaceholder(el.dataset.id, curPlan(K).id);
    return { riapriSheet: 'joinPolicy' };
  },

  async saveLimits(el, K) {
    const v = K.$('#maxUses');
    const n = v && v.value ? parseInt(v.value, 10) : null;
    await data.setInviteLimits(curPlan(K).id, n, null);
    return { toast: n ? 'Massimo ' + n + ' persone' : 'Nessun limite' };
  },

  async revokePlanLink(el, K) {
    await data.revokeInviteLinks(curPlan(K).id);
    return { toast: 'Link revocato: chi è già entrato resta', closeSheet: true };
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

  // Ultima spiaggia quando la sessione e' in uno stato strano: si butta via
  // tutto e si ricomincia da ospite.
  async esci(el, K) {
    try { await data.signOut(); } catch { /* niente */ }
    try { localStorage.clear(); } catch { /* niente */ }
    location.replace(location.origin + location.pathname);
    return { skipReload: true };
  },

  async joinGroup(el, K) {
    const g = await data.joinGroup(el.dataset.tok, null);
    K.state._invitoGruppo = null;
    return { toast: 'Sei dentro', closeSheet: true, go: 'g/' + g };
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

  // Togliere un allegato è in due tempi: prima la riga, che dice se ne hai il
  // diritto e restituisce il percorso, poi il file. Se saltasse il secondo
  // resterebbe spazio occupato da un file che nessuna schermata mostra.
  async delFile(el) {
    await data.deleteMedia(el.dataset.id);
    return { toast: 'Tolto' };
  },

  // Nota: nel prototipo le foto del piano NON si cancellano — non c'è nessun
  // bottone. Ci sono solo quelle dei posti salvati (plDelPhoto, più sotto).
  // Se un giorno si aggiunge, il gestore è identico a delFile.

  async comment(el, K) {
    const input = K.$('#commentInput');
    const v = input ? input.value.trim() : '';
    if (!v) return { skipReload: true };
    await data.addComment(curPlan(K).id, v);
    if (input) input.value = '';
    return {};
  },

  async delComment(el, K) {
    await data.deleteComment(el.dataset.id);
    return { toast: 'Commento tolto' };
  },

  /* ------------------------------------------- ritardi e assenze */

  async saveLate(el, K) {
    const minuti = K.state.lateMin;
    if (!minuti) return { toast: 'Di quanto sei in ritardo?', skipReload: true };
    await data.setMyLate(curPlan(K).id, minuti, val(K, '#lateNote'));
    return { toast: 'Il gruppo lo sa', closeSheet: true };
  },

  async clearLate(el, K) {
    await data.clearMyLate(curPlan(K).id);
    return { toast: 'Ritardo annullato' };
  },

  async saveAbsent(el, K) {
    await data.setMyAbsence(curPlan(K).id, val(K, '#absentNote'));
    return { toast: 'Il gruppo lo sa', closeSheet: true };
  },

  async toggleBooked(el, K) {
    const p = curPlan(K);
    await data.setPlanBooked(p.id, !p.booked);
    return { toast: p.booked ? 'Non risulta più prenotato' : 'Prenotato' };
  },

  /* ----------------------------------------- amici e silenziati */

  async addFriend(el, K) {
    await data.addFriend(el.dataset.id);
    return { toast: 'Aggiunto ai tuoi', closeSheet: true };
  },

  async rmFriend(el, K) {
    await data.removeFriend(el.dataset.id);
    return { toast: 'Tolto', closeSheet: true };
  },

  async muteGroup(el, K) {
    const ora = await data.toggleGroupMute(el.dataset.g);
    return { toast: ora ? 'Gruppo silenziato' : 'Notifiche riattivate', closeSheet: true };
  },

  /* ----------------------------------------------------- gruppo */

  async deleteGroup(el, K) {
    const g = K.state.groups[el.dataset.g];
    if (!confirm('Sciogliere "' + (g ? g.name : 'il gruppo') +
                 '"?\n\nI piani NON vengono cancellati: quelli ancora ai voti ' +
                 'vengono annullati, gli altri restano leggibili.')) {
      return { skipReload: true };
    }
    await data.deleteGroup(el.dataset.g);
    return { toast: 'Gruppo sciolto', closeSheet: true, go: 'home' };
  },

  async transferOwner(el, K) {
    await data.transferGroupOwner(el.dataset.g, el.dataset.id);
    return { toast: 'Chiavi passate', closeSheet: true };
  },

  /* ------------------------------------------------------ posti */

  async savePlaceFromPlan(el, K) {
    const p = curPlan(K);
    const w = p && p.where && p.where.value;
    if (!w || !w.name) return { skipReload: true };
    await data.savePlace(w.name, w.address, null);
    return { toast: 'Salvato tra i tuoi posti ★' };
  },

  async plCover(el) {
    await data.setPlaceCover(el.dataset.id);
    return { toast: 'Copertina cambiata' };
  },

  async plDelPhoto(el) {
    await data.deletePlaceMedia(el.dataset.id);
    return { toast: 'Foto tolta' };
  },

  async plDelFile(el) {
    await data.deletePlaceMedia(el.dataset.id);
    return { toast: 'Tolto' };
  },

  /* ---------------------------------------------------- profilo */

  async saveProfile(el, K) {
    const nome = val(K, '#pname');
    if (!nome) return { toast: 'Il nome serve', skipReload: true };
    await data.ensureActor(nome);                  // ensure_actor aggiorna anche il nome
    const mail = val(K, '#pemail');
    if (mail) await data.setMyEmail(mail.toLowerCase());
    return { toast: 'Profilo aggiornato', closeSheet: true };
  }
};

/* ------------------------------------------------------------------ */
/* aggancio al DOM                                                     */
/* ------------------------------------------------------------------ */

// Schermata di diagnostica: si apre con #/diag e mostra lo stato vero della
// sessione. Serve quando "non va" e non c'è modo di guardare la console di un
// telefono: si legge questa e si sa dove si è rotto invece di indovinare.
export async function mostraDiagnostica(K) {
  if (!/^#\/?diag/.test(location.hash)) return false;

  const r = { versione: VERSIONE, indirizzo: location.origin + location.pathname };
  try {
    const s = await data.currentSession();
    r.sessione = s ? 'sì' : 'NESSUNA';
    if (s) {
      r.utente = s.user.id;
      r.is_anonymous = String(s.user.is_anonymous);
      r.identita = (s.user.identities || []).map(i => i.provider).join(', ') || 'nessuna';
      r.email = s.user.email || '—';
      r.nomeDaProvider = (s.user.user_metadata || {}).full_name
                      || (s.user.user_metadata || {}).name || '—';
      r.riconosciutoComeEntrato = data.haIdentitaVera(s.user) ? 'SÌ' : 'NO';
    }
    const a = await data.myActor();
    r.profilo = a ? (a.display_name + ' (' + a.id.slice(0, 8) + ')') : 'NESSUNO';
    r.me = K.state.me;
  } catch (e) {
    r.errore = e.message || String(e);
  }

  const righe = Object.entries(r)
    .map(([k, v]) => `<div class="row"><div class="grow s">${k}</div><div class="t" style="font-size:13px;text-align:right;word-break:break-all">${String(v)}</div></div>`)
    .join('');
  K.openSheet(`<h2>Diagnostica</h2>
    <p class="sub">Mandane una foto: dice dove si è rotto.</p>
    <div class="group">${righe}</div>
    <div class="actions stack">
      <button class="btn tint" data-action="copy" data-text="${encodeURIComponent(JSON.stringify(r))}">Copia</button>
      <button class="btn danger" data-action="esci">Esci e ricomincia</button>
      <button class="btn plain" data-action="closeSheet">Chiudi</button>
    </div>`);
  return true;
}

export async function reload(K) {
  applyState(K.state, await data.loadState());
  await caricaInvito(K);
  disegna(K);
  await mostraInvitoGruppo(K);
}

// render() che muore lascia lo schermo fermo su dati vecchi mentre lo stato è
// già cambiato. È successo il 26/8/2026: un piano confermato continuava a dire
// "IN DECISIONE", e l'unico segnale era un toast con un TypeError. Uno schermo
// che mente è peggio di uno che si scusa — chi legge può confermare due volte.
//
// Quindi: si dice cosa è successo, e si ricarica la pagina una volta sola, che
// ridisegna tutto da zero dai dati veri. Il segno in sessionStorage evita il
// giro infinito se a rompersi è qualcosa che c'è anche dopo il ricaricamento.
const SEGNO = 'kimari_render_rotto';

function disegna(K) {
  try {
    K.render();
    try { sessionStorage.removeItem(SEGNO); } catch { /* niente */ }
  } catch (err) {
    console.error('render', err);
    let giaProvato = false;
    try { giaProvato = sessionStorage.getItem(SEGNO) === '1'; } catch { /* niente */ }
    if (giaProvato) {
      // Ricaricare non è servito: meglio dirlo che riprovare all'infinito.
      K.toast && K.toast('La schermata non si aggiorna: ' + (err.message || err));
      return;
    }
    try { sessionStorage.setItem(SEGNO, '1'); } catch { /* niente */ }
    K.toast && K.toast('Salvato. Ricarico la schermata…');
    setTimeout(() => location.reload(), 600);
  }
}

// Chi apre #/gi/<token> vede chi c'è nel gruppo e decide se entrare.
// preview_group_invite risponde anche a chi non è ancora dentro, quindi si può
// mostrare il nome del gruppo prima di chiedere qualsiasi cosa.
export async function mostraInvitoGruppo(K) {
  const token = tokenGruppoDaRotta(location.hash);
  if (!token) return false;
  if (K.state._invitoGruppo === token) return false;   // già mostrato

  try {
    const prev = await data.previewGroupInvite(token);
    if (!prev || !prev.ok) {
      K.toast && K.toast('Questo invito non è più valido');
      return false;
    }
    // Già dentro: non si chiede niente, si va e basta.
    if (K.state.groups[prev.group_id]) {
      location.hash = '#/g/' + prev.group_id;
      return true;
    }
    K.state._invitoGruppo = token;
    K.openSheet(`<h2>${prev.emoji || '👥'} ${K.$ ? '' : ''}${prev.name}</h2>
      <p class="sub">${(prev.members || []).length} ${(prev.members || []).length === 1 ? 'persona' : 'persone'} nel gruppo</p>
      <div class="actions stack">
        <button class="btn primary" data-action="joinGroup" data-tok="${token}">Entra nel gruppo</button>
        <button class="btn plain" data-action="closeSheet">Non adesso</button>
      </div>`);
    return true;
  } catch (e) {
    console.error('invito gruppo', e);
    K.toast && K.toast(e.message || String(e));
    return false;
  }
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
        // Alcune schermate si modificano mentre le si usa: scegliere "elenco
        // chiuso" fa comparire l'elenco da riempire lì sotto. Chiuderle
        // costringerebbe a riaprirle subito.
        if (res.riapriSheet === 'joinPolicy' && K.openSheet && K.sheetJoinPolicy) {
          K.openSheet(K.sheetJoinPolicy(curPlan(K)));
        }
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
    mostraDiagnostica(K);
    caricaInvito(K).then(caricato => { if (caricato) K.render(); });
  });

  // Le foto non passano da un data-action: il bottone apre un <input file>
  // nascosto, e il lavoro vero sta nel suo evento change. Stessa intercettazione
  // in fase di cattura, altrimenti il prototipo se le tiene in memoria come
  // base64 e sparirebbero alla ricarica.
  document.addEventListener('change', e => {
    const el = e.target;
    if (!el || (el.id !== 'photoInput' && el.id !== 'fileInput')) return;
    const files = [...(el.files || [])];
    if (!files.length) return;

    e.stopPropagation();
    e.preventDefault();
    const tipo = el.id === 'photoInput' ? 'photo' : 'file';
    const target = K.state.mediaTarget;
    K.state.mediaTarget = null;
    el.value = '';                       // così riselezionare lo stesso file rifà partire l'evento

    caricaFile(K, files, tipo, target)
      .then(() => reload(K))
      .catch(err => {
        if (K.toast) K.toast(err.message || String(err));
        console.error('caricamento', err);
      });
  }, true);
}

// Un file alla volta e non tutti insieme: se il quinto sfora il limite, i
// primi quattro sono già salvati e l'errore riguarda solo quello. Caricandoli
// in parallelo il server ne rifiuterebbe alcuni a caso.
export async function caricaFile(K, files, tipo, target) {
  const perPosto = target && target.kind === 'place';
  const plan = perPosto ? null : (curPlan(K) || {}).id;
  if (!perPosto && !plan) throw new Error('Nessun piano aperto');

  let fatti = 0;
  try {
    for (const f of files) {
      if (perPosto) await data.uploadPlacePhoto(target.id, f);
      else await data.uploadMedia(plan, f, tipo);
      fatti++;
    }
  } catch (e) {
    // Dire quanti ne sono passati: "3 di 5 caricate, la quarta è troppo
    // grande" è utile, "errore" no.
    if (fatti) e.message = fatti + ' di ' + files.length + ' caricate. ' + e.message;
    throw e;
  }
  if (K.toast) K.toast(fatti === 1 ? 'Caricata' : fatti + ' caricate');
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
    // Prima di leggere: se si torna da un collegamento, l'actor porta ancora
    // il nome da ospite. Si adotta quello vero e poi si legge, altrimenti il
    // primo schermo mostrerebbe ancora "Ospite" e cambierebbe sotto gli occhi.
    await data.adottaIdentitaGoogle();
    // L'URL è pieno di token e il prototipo usa il frammento per le rotte:
    // se resta, prova a interpretare "access_token=..." come una schermata.
    data.pulisciUrlDopoLogin();
    await reload(K);
    await mostraDiagnostica(K);
    wire(K);
    document.body.dataset.kimari = 'live';
    document.body.dataset.versione = VERSIONE;
    console.log('Kimari · versione ' + VERSIONE + ' · utente ' + K.state.me);
    // Visibile senza aprire la console: serve a farsi dire da chi prova
    // l'app quale copia sta usando davvero.
    if (K.state) K.state.versione = VERSIONE;

    // Sessione aperta ma nessun profilo: senza questo il prototipo mostrerebbe
    // la vista web (isWeb() è vero quando me === 'guest') e nell'app non si
    // entrerebbe mai. La porta d'ingresso va aperta a mano.
    //
    // Ma se l'utente ha GIÀ un account collegato e resta 'ospite', non è una
    // porta da aprire: è un errore, e riproporre l'ingresso a chi è appena
    // entrato lo manda in tondo. Meglio dirlo.
    if (K.state.me === 'guest') {
      const s = await data.currentSession();
      if (s && data.haIdentitaVera(s.user)) {
        K.toast && K.toast('Sei entrato ma non riesco a creare il tuo profilo. Riprova, o scrivimi.');
        console.error('sessione con identità vera ma nessun actor', s.user.id);
      } else if (K.openSheet && K.sheetWelcome) {
        K.state.welcomeShown = true;
        K.openSheet(K.sheetWelcome());
      }
    } else if (K.closeSheet) {
      // Al primo avvio dopo il login la marcatura non c'era ancora, quindi il
      // prototipo il benvenuto l'ha gia' aperto: si chiude. Dal secondo avvio
      // non verra' nemmeno programmato.
      K.closeSheet();
      setTimeout(() => K.closeSheet(), 120);   // il suo setTimeout e' a 60 ms
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
