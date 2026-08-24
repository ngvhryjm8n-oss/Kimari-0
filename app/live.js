// live.js — attacca il prototipo al database vero.
//
// Il prototipo espone `window.__kimari = { state, render, ... }` e gestisce i
// click con un solo listener su document, in fase di bolla. Qui ci si mette
// davanti in fase di CATTURA: le azioni che sappiamo salvare le intercettiamo
// (chiamata RPC, ricarica, render), tutte le altre passano oltre e continuano a
// funzionare come demo locale.
//
// Il vantaggio è che il prototipo non si tocca: si converte un'azione per
// volta, e quello che non è ancora convertito resta usabile invece che rotto.

import * as data from './data.js';

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

// Le azioni che oggi sanno arrivare al database. Ognuna riceve l'elemento
// cliccato e `K` (window.__kimari), e torna un messaggio da mostrare.
// Quelle non elencate cadono nel gestore del prototipo: restano demo.
export const HANDLERS = {
  async saveGroup(el, K) {
    const gd = K.state.gdraft;
    if (!gd || !gd.name.trim()) return { toast: 'Dai un nome al gruppo', skipReload: true };

    if (gd.id) {
      await data.updateGroup(gd.id, gd.name.trim(), gd.emoji, gd.color);
    } else {
      const id = await data.createGroup(gd.name.trim(), gd.emoji, gd.color);
      gd.id = id;
    }

    // Le sezioni sono private: vivono in tabelle a parte, non nel gruppo.
    let sectionId = gd.sectionId;
    if (sectionId === 'new') {
      if (!gd.newSection.trim()) return { toast: 'Scrivi il nome della sezione', skipReload: true };
      sectionId = await data.createSection(gd.newSection.trim());
    }
    await data.setGroupSection(gd.id, sectionId || null);

    return { toast: gd.id ? 'Gruppo salvato' : 'Gruppo creato', closeSheet: true };
  },

  async leaveGroup(el, K) {
    await data.leaveGroup(el.dataset.g);
    return { toast: 'Sei uscito dal gruppo', closeSheet: true, go: 'home' };
  },

  async gMemberRemove(el) {
    await data.removeGroupMember(el.dataset.g, el.dataset.a);
    return { toast: 'Tolto dal gruppo' };
  },

  async comment(el, K) {
    const input = K.$('#commentInput');
    const v = input ? input.value.trim() : '';
    if (!v) return { skipReload: true };
    const p = K.state.plans[K.state.currentPlan];
    await data.addComment(p.id, v);
    if (input) input.value = '';
    return {};
  },

  async delPlace(el) {
    await data.deletePlace(el.dataset.id);
    return { toast: 'Posto tolto' };
  },

  async addExpense(el, K) {
    const d = K.state.xdraft;
    if (!d || !d.amount) return { toast: 'Metti un importo', skipReload: true };
    const p = K.state.plans[K.state.currentPlan];
    // Il prototipo tiene gli importi già in centesimi interi: restano tali.
    await data.addExpense(p.id, d.amount, d.text || 'Spesa', d.among ? [...d.among] : null);
    return { toast: 'Spesa aggiunta', closeSheet: true };
  }
};

/* ------------------------------------------------------------------ */
/* aggancio al DOM                                                     */
/* ------------------------------------------------------------------ */

export async function reload(K) {
  applyState(K.state, await data.loadState());
  K.render();
}

function wire(K) {
  document.addEventListener('click', e => {
    const el = e.target.closest('[data-action]');
    if (!el) return;
    const h = HANDLERS[el.dataset.action];
    if (!h) return;                       // non nostra: la gestisce il prototipo

    // Da qui in poi è roba nostra: il gestore del prototipo non deve vederla,
    // altrimenti scrive anche in locale e i dati divergono.
    e.stopPropagation();
    e.preventDefault();

    Promise.resolve(h(el, K))
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
  }, true);                               // ← cattura: prima del prototipo
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
