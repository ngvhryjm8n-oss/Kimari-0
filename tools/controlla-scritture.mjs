// P0.5, la metà che conta: un estraneo non deve poter SCRIVERE.
//
// controlla-rls.mjs prova le letture. Ma il danno vero non e' leggere un
// piano altrui: e' annullarlo, confermarlo al posto dell'organizzatore, o
// buttare fuori un partecipante. CLAUDE.md promette due cose —
//   1. nessuna policy di scrittura: le tabelle si scrivono solo via RPC
//   2. le RPC sono security definer e controllano loro chi sei
// e questo script prova a smentirle dall'esterno, con una sessione anonima
// nuova che non c'entra niente col piano.
//
//   node tools/controlla-scritture.mjs <id-del-piano-da-attaccare>
//
// L'id di un piano di prova si legge dalla console dell'app. Senza argomento
// prova solo le scritture dirette sulle tabelle, che non ne hanno bisogno.
//
// ATTENZIONE: questo script TENTA di scrivere. Se una prova riesce e' un
// difetto grave, e va segnalata; i nomi usati cominciano tutti per
// PROVA-CLAUDE, cosi' supabase/tools/pulizia_prove.sql li porta via.
const URL_SB = 'https://fnafzokgkbhhjircrogy.supabase.co';
const CHIAVE = 'sb_publishable_f-CLx2j5Ht-ydkoh7iC-qQ_iacbBYW_';
const PIANO = process.argv[2] || null;

const r = await fetch(URL_SB + '/auth/v1/signup', {
  method: 'POST', headers: { apikey: CHIAVE, 'Content-Type': 'application/json' },
  body: JSON.stringify({ data: {} })
});
const token = r.ok ? (await r.json()).access_token : null;
if (!token) { console.error('non riesco ad aprire una sessione anonima:', r.status); process.exit(2); }
const H = { apikey: CHIAVE, Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' };

let passate = 0, bucate = 0;
const esito = (nome, riuscita, dettaglio) => {
  if (riuscita) { console.log('  BUCO      ' + nome.padEnd(46) + dettaglio); bucate++; }
  else { console.log('  ok        ' + nome.padEnd(46) + dettaglio); passate++; }
};

console.log('\nscritture — cosa riesce a fare un estraneo\n(sessione anonima nuova, nessun invito, nessun token)\n');

/* ---------------------------------------- 1. scrittura diretta sulle tabelle */
const dirette = [
  ['plans', 'POST', { title: 'PROVA-CLAUDE intruso', status: 'deciding' }],
  ['actors', 'POST', { display_name: 'PROVA-CLAUDE intruso' }],
  ['groups', 'POST', { name: 'PROVA-CLAUDE intruso' }],
  // I nomi delle colonne sono quelli veri (map.js): un 400 "colonna
  // inesistente" NON e' una prova di sicurezza — vuol dire che la richiesta e'
  // caduta sullo schema prima che la RLS dicesse la sua. Con le colonne giuste
  // la risposta e' un verdetto.
  ['comments', 'POST', { body: 'PROVA-CLAUDE intruso', is_system: false }],
  ['expenses', 'POST', { description: 'PROVA-CLAUDE intruso', amount_cents: 1 }],
];
for (const [tab, metodo, corpo] of dirette) {
  try {
    const res = await fetch(`${URL_SB}/rest/v1/${tab}`, {
      method: metodo, headers: { ...H, Prefer: 'return=representation' },
      body: JSON.stringify(corpo), signal: AbortSignal.timeout(15000)
    });
    const t = await res.text();
    // 42501 = permission denied: e' la RLS che parla, ed e' la risposta giusta.
    // Un 400 di altro genere va detto per quello che e': non provato.
    const rls = /42501|permission denied|violates row-level security/i.test(t);
    if (res.status < 300) esito(`insert diretto in ${tab}`, true, 'RIGA CREATA — c\'e\' una policy di scrittura');
    else if (res.status === 401 || res.status === 403 || rls) esito(`insert diretto in ${tab}`, false, 'negato dalla RLS (' + res.status + ')');
    else esito(`insert diretto in ${tab}`, false, 'respinto ma non dalla RLS (' + res.status + '): ' + t.slice(0, 60));
  } catch (e) { esito(`insert diretto in ${tab}`, false, 'errore di rete: ' + e.message); }
}

/* ------------------------------------------ 2. le RPC su un piano non tuo */
if (PIANO) {
  const rpc = async (nome, args) => {
    try {
      const res = await fetch(`${URL_SB}/rest/v1/rpc/${nome}`, {
        method: 'POST', headers: H, body: JSON.stringify(args),
        signal: AbortSignal.timeout(15000)
      });
      const t = await res.text();
      return { ok: res.status < 300, stato: res.status, corpo: t.slice(0, 80) };
    } catch (e) { return { ok: false, stato: 0, corpo: String(e.message) }; }
  };

  // I nomi dei parametri sono quelli VERI, presi dalle firme in
  // supabase/schema/: sbagliarne uno fa rispondere 404 o 400 e la prova
  // sembrerebbe superata senza aver mai raggiunto il controllo di chi sei.
  const prove = [
    ['confirm_plan', { p_plan: PIANO }, 'confermare il piano di un altro'],
    ['cancel_plan', { p_plan: PIANO }, 'annullare il piano di un altro'],
    ['update_plan_field', { p_plan: PIANO, p_field: 'when', p_value: null }, 'cambiare la data di un altro'],
    ['revoke_invite_links', { p_plan: PIANO }, 'revocare i link di un altro'],
    ['create_invite_link', { p_plan: PIANO }, 'farsi un link d\'invito a un piano altrui'],
    ['add_candidates', { p_plan: PIANO, p_field: 'when', p_items: [] }, 'aggiungere opzioni a un piano altrui'],
  ];
  for (const [nome, args, cosa] of prove) {
    const e = await rpc(nome, args);
    if (e.ok) { esito(cosa, true, 'RIUSCITO — ' + e.corpo); continue; }
    // Un rifiuto vale come prova solo se e' la funzione a dire "non sei tu":
    // un 404 (firma sbagliata) o un errore di tipo non hanno mai raggiunto il
    // controllo. Dirlo, invece di contarlo come una prova superata.
    const autorizzazione = /not.?authori|non autorizzat|only the organi|organizzatore|permission|not a participant|42501|P0001/i.test(e.corpo);
    if (e.stato === 404) esito(cosa, false, 'RPC non trovata: firma sbagliata (NON PROVATO)');
    else if (autorizzazione) esito(cosa, false, 'respinto da chi comanda: ' + e.corpo.slice(0, 46));
    else esito(cosa, false, 'respinto (' + e.stato + ') ma non si capisce da cosa: ' + e.corpo.slice(0, 44));
  }
} else {
  console.log('\n  (nessun id di piano passato: le prove sulle RPC sono saltate)');
}

console.log('\n' + passate + ' respinte · ' + bucate + ' riuscite\n');
if (bucate) console.log('Ogni riga BUCO e\' una cosa che un estraneo puo\' fare ai piani degli altri.\n');
process.exit(bucate ? 1 : 0);
