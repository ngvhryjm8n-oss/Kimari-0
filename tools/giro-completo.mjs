// Il giro che la ROADMAP-V1 dice essere l'unico che deve essere perfetto:
//   crea → condividi → vota da ospite → conferma → ricondividi
//
// Non tocca l'interfaccia: parla con il database esattamente come farebbe il
// client, con le stesse RPC e gli stessi nomi di parametro. Serve a rispondere
// a una domanda sola — il giro completo funziona ADESSO, in produzione? — in
// venti secondi invece che in dieci minuti di clic.
//
//   node tools/giro-completo.mjs
//
// SCRIVE sul database: crea un piano di prova col prefisso PROVA-CLAUDE, che
// supabase/tools/pulizia_prove.sql porta via. Non tocca niente di esistente.
const URL_SB = 'https://fnafzokgkbhhjircrogy.supabase.co';
const CHIAVE = 'sb_publishable_f-CLx2j5Ht-ydkoh7iC-qQ_iacbBYW_';

const BR = String.fromCharCode(10);
let passi = 0, rotti = 0;
const passo = (nome, ok, dettaglio = '') => {
  console.log((ok ? '  ok   ' : '  ROTTO ') + nome.padEnd(42) + dettaglio);
  ok ? passi++ : rotti++;
  return ok;
};

// Una sessione anonima nuova = una persona nuova, con il suo telefono.
async function persona(nome) {
  const r = await fetch(URL_SB + '/auth/v1/signup', {
    method: 'POST', headers: { apikey: CHIAVE, 'Content-Type': 'application/json' },
    body: JSON.stringify({ data: {} })
  });
  if (!r.ok) throw new Error('non riesco ad aprire una sessione: ' + r.status);
  const token = (await r.json()).access_token;
  const H = { apikey: CHIAVE, Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' };
  const rpc = async (fn, args) => {
    const res = await fetch(`${URL_SB}/rest/v1/rpc/${fn}`, {
      method: 'POST', headers: H, body: JSON.stringify(args), signal: AbortSignal.timeout(20000)
    });
    const testo = await res.text();
    if (!res.ok) throw new Error(fn + ' → ' + res.status + ' ' + testo.slice(0, 140));
    try { return JSON.parse(testo); } catch { return testo; }
  };
  return { nome, H, rpc };
}

console.log(BR + 'il giro completo, contro la produzione' + BR);

try {
  /* ------------------------------------------------- 1. chi organizza */
  const anna = await persona('Anna');
  await anna.rpc('ensure_actor', { p_display_name: 'PROVA-CLAUDE Giro Anna' });
  passo('chi organizza entra e ha un profilo', true);

  /* ------------------------------------------------- 2. crea il piano */
  const domani = new Date(Date.now() + 2 * 864e5).toISOString();
  // I nomi sono quelli VERI, letti in supabase/schema/: 'deciding' e non
  // 'choose', when_candidates e non when_options. Inventarli fa fallire la
  // prova per colpa della prova, e sembra un difetto dell'app.
  const creato = await anna.rpc('create_plan', {
    p: {
      title: 'PROVA-CLAUDE Giro completo',
      when_mode: 'deciding', where_mode: 'fixed',
      place_name: 'Da Gino', timezone: 'Europe/Rome',
      when_candidates: [
        { starts_at: domani, timezone: 'Europe/Rome' },
        { starts_at: new Date(Date.now() + 3 * 864e5).toISOString(), timezone: 'Europe/Rome' }
      ]
    }
  });
  const piano = creato.plan_id || creato.id;
  const token = creato.token;
  if (!passo('crea un piano con due date', !!piano, piano ? '' : JSON.stringify(creato).slice(0, 90))) {
    throw new Error('senza piano il resto non ha senso');
  }

  /* ------------------------------------------------- 3. il link */
  passo('il link d\'invito nasce col piano', !!token, token ? 'kimariapp.com/?t=' + token.slice(0, 8) + '…' : '');

  /* ------------------------------------------- 4. l'ospite vede il piano */
  // preview_invite risponde anche a chi non e' entrato: e' quello che vede chi
  // apre il link da WhatsApp prima di scrivere il nome.
  const ospite = await persona('Bruno');
  const prev = await ospite.rpc('preview_invite', { p_token: token });
  passo('un estraneo col link vede il piano', prev && prev.ok === true,
        prev && prev.title ? '"' + prev.title + '"' : '');

  /* ------------------------------------------- 5. l'ospite entra e vota */
  await ospite.rpc('join_plan', { p_token: token, p_display_name: 'PROVA-CLAUDE Giro Bruno', p_claim_actor: null });
  passo('l\'ospite entra scrivendo il nome', true);

  const cands = await fetch(`${URL_SB}/rest/v1/candidates?select=id,field&plan_id=eq.${piano}`,
    { headers: ospite.H }).then(r => r.json());
  const quando = cands.filter(c => c.field === 'when').map(c => c.id);
  passo('l\'ospite vede le opzioni da votare', quando.length >= 2, quando.length + ' date');

  // p_field e' obbligatorio: si vota un campo per volta (when, where…).
  await ospite.rpc('submit_ballot',
    { p_plan: piano, p_field: 'when', p_candidates: [quando[0]], p_none_ok: false });
  passo('l\'ospite vota', true);

  /* --------------------------------- 6. l'ospite riapre e si ritrova */
  // Il punto P0.2: "riapre lo stesso link ore dopo → viene riconosciuto → vede
  // il suo voto". Stessa sessione, come un telefono che non si e' svuotato.
  const miei = await fetch(`${URL_SB}/rest/v1/ballots?select=actor_id&plan_id=eq.${piano}`,
    { headers: ospite.H }).then(r => r.json());
  passo('riaprendo, l\'ospite ritrova il suo voto', Array.isArray(miei) && miei.length === 1);

  /* ------------------------------------------------- 7. la conferma */
  const risultati = await fetch(
    `${URL_SB}/rest/v1/v_candidate_results?select=*&plan_id=eq.${piano}`,
    { headers: anna.H }).then(r => r.json()).catch(() => null);
  passo('chi organizza vede i risultati', Array.isArray(risultati) && risultati.length > 0,
        Array.isArray(risultati) ? risultati.length + ' righe' : 'vista non leggibile');

  await anna.rpc('confirm_plan', { p_plan: piano, p_when: quando[0] });
  const dopo = await fetch(`${URL_SB}/rest/v1/plans?select=status,version&id=eq.${piano}`,
    { headers: anna.H }).then(r => r.json());
  passo('conferma il piano', dopo[0] && dopo[0].status === 'confirmed',
        dopo[0] ? 'stato: ' + dopo[0].status : '');

  /* --------------------------------- 8. il link vale ancora, e mostra l'esito */
  const dopoConferma = await ospite.rpc('preview_invite', { p_token: token });
  passo('lo stesso link mostra il piano deciso', dopoConferma && dopoConferma.status === 'confirmed',
        'regola 2: i link non si rompono mai');

  /* ------------------------------------------------- 9. il "ci sono" */
  await ospite.rpc('set_rsvp', { p_plan: piano, p_rsvp: 'yes' });
  const parts = await fetch(
    `${URL_SB}/rest/v1/participants?select=rsvp&plan_id=eq.${piano}`,
    { headers: ospite.H }).then(r => r.json());
  passo('l\'ospite risponde "ci sono"', parts.some(p => p.rsvp === 'yes'));

} catch (e) {
  console.log('  ROTTO ' + String(e.message || e).slice(0, 150));
  rotti++;
}

console.log(BR + passi + ' passi riusciti · ' + rotti + ' rotti');
console.log(rotti
  ? 'Il giro che deve essere perfetto non lo e\'.' + BR
  : 'Il giro completo funziona. Pulire con supabase/tools/pulizia_prove.sql' + BR);
process.exit(rotti ? 1 : 0);
