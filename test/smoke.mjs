// Smoke test di index.html con jsdom e client Supabase finto.
// Nessun build: si estrae lo <script> inline dal file vero e lo si esegue.
//   node test/smoke.mjs
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import { readIndex, extractInlineScript, cdnTag } from './extract.mjs';

const HTML = readIndex();
const SCRIPT = extractInlineScript(HTML);

let passed = 0, failed = 0;
async function test(name, fn){
  try { await fn(); passed++; console.log('  ok   ' + name); }
  catch (e) { failed++; console.log('  FAIL ' + name + '\n       ' + (e && e.message)); }
}

/* ------------------------------------------------------------------ */
/* client Supabase finto                                               */
/* ------------------------------------------------------------------ */
function makeSupabase(fixtures = {}){
  const calls = { rpc: [], from: [] };
  const table = name => {
    const rows = fixtures.tables && fixtures.tables[name];
    const res = typeof rows === 'function' ? rows() : { data: rows === undefined ? [] : rows, error: null };
    const chain = {
      select(){ return chain; }, eq(){ return chain; }, in(){ return chain; },
      order(){ return chain; }, maybeSingle(){ return Promise.resolve(single(res)); },
      then(ok, ko){ return Promise.resolve(res).then(ok, ko); }
    };
    return chain;
  };
  const single = r => r.error ? r : { data: Array.isArray(r.data) ? (r.data[0] || null) : r.data, error: null };

  return {
    calls,
    auth: {
      getSession: async () => fixtures.session || { data: { session: null }, error: null },
      signInAnonymously: async () => fixtures.anon || { data: { session: { user: { id: 'u-anon', is_anonymous: true } } }, error: null },
      signOut: async () => ({ error: null }),
      linkIdentity: async () => ({ error: null }),
      signInWithOAuth: async () => ({ error: null })
    },
    from(name){ calls.from.push(name); return table(name); },
    async rpc(name, args){
      calls.rpc.push({ name, args });
      const h = fixtures.rpc && fixtures.rpc[name];
      if (typeof h === 'function') return h(args);
      if (h !== undefined) return h;
      return { data: null, error: null };
    }
  };
}

// Costruisce il DOM, inietta il finto client, esegue lo script inline.
async function boot(fixtures = {}, url = 'https://example.test/'){
  const dom = new JSDOM(HTML, { url, runScripts: 'outside-only', pretendToBeVisual: true });
  const sb = makeSupabase(fixtures);
  dom.window.supabase = { createClient: () => sb };
  dom.window.eval(SCRIPT);
  await new Promise(r => setTimeout(r, 0));
  await new Promise(r => setTimeout(r, 0));
  return { dom, sb, doc: dom.window.document, win: dom.window,
           $: s => dom.window.document.querySelector(s) };
}

/* ------------------------------------------------------------------ */
console.log('\nindex.html — smoke test\n');

await test('lo <script> inline è sintatticamente valido', () => {
  new Function(SCRIPT); // stessa garanzia di `node --check`
});

await test('la libreria Supabase è fissata a una versione con SRI', () => {
  const { tag, src } = cdnTag(HTML);
  assert.match(src, /@supabase\/supabase-js@\d+\.\d+\.\d+\//, 'la versione deve essere esatta, non un tag flottante come @2');
  assert.match(tag, /integrity="sha384-[A-Za-z0-9+/=]+"/, 'manca integrity=');
  assert.match(tag, /crossorigin=/, 'integrity senza crossorigin non viene applicato');
});

await test('senza la libreria dalla CDN mostra un messaggio, non una pagina bianca', () => {
  // Nella lingua di chi legge: questa schermata la vede chi ha una rete che
  // blocca la CDN, e dirgli in italiano cosa fare non gli serve a niente.
  // La prova girava con un browser inglese e cercava l'italiano: quando la
  // traduzione ha cominciato a funzionare, è stata la prova a rompersi.
  for (const [lingua, atteso] of [['it', /non si è caricato/i],
                                  ['en', /didn’t load/i],
                                  ['ja', /読み込め|Kimari/]]) {
    const dom = new JSDOM(HTML, { url: 'https://example.test/', runScripts: 'outside-only' });
    Object.defineProperty(dom.window.navigator, 'languages', { value: [lingua] });
    assert.throws(() => dom.window.eval(SCRIPT), /supabase-js non caricato/);
    const txt = dom.window.document.getElementById('app').textContent;
    assert.match(txt, atteso, `messaggio mancante in ${lingua}: ${txt.slice(0, 70)}`);
    assert.doesNotMatch(txt, /Carico…/, 'deve sostituire il segnaposto di caricamento');
    // E il consiglio pratico — cosa fare — non deve restare indietro in italiano.
    if (lingua !== 'it') {
      assert.doesNotMatch(txt, /Quasi sempre è la rete/,
        `in ${lingua} il testo lungo è rimasto italiano`);
    }
  }
});

// Il caso che rompeva il dato: piano con when_mode 'deciding' ma nessuna data
// proposta. La sezione "Quando" non viene mostrata, quindi non deve partire
// nessun ballot none_ok per 'when'.
await test('non manda un voto per un campo che non è a schermo', async () => {
  const preview = {
    ok: true, plan_id: 'p1', title: 'Cena', status: 'deciding', organizer: 'Vince',
    voters: 0, when_mode: 'deciding', where_mode: 'deciding',
    starts_at: null, place_name: null, deadline_at: null, people: [],
    candidates: [
      { id: 'c1', field: 'where', place_name: 'Da Mario', place_address: 'Via Roma 1' },
      { id: 'c2', field: 'where', place_name: 'Sushi', place_address: '' }
    ]
  };
  const { sb, $ } = await boot({
    rpc: { preview_invite: { data: preview, error: null }, join_plan: { data: 'p1', error: null } }
  }, 'https://example.test/?t=TOKEN123');

  assert.ok($('#send'), 'la scheda di voto deve essere renderizzata');
  assert.ok(!$('#g-when'), 'senza date proposte la sezione Quando non deve esserci');
  assert.ok($('#g-where'), 'la sezione Dove deve esserci');

  $('#name').value = 'Luca';
  $('[data-id="c1"]').click();
  $('#send').click();
  await new Promise(r => setTimeout(r, 0));
  await new Promise(r => setTimeout(r, 0));

  const ballots = sb.calls.rpc.filter(c => c.name === 'submit_ballot');
  assert.equal(ballots.length, 1, 'deve partire un solo submit_ballot, non due');
  assert.equal(ballots[0].args.p_field, 'where');
  assert.equal(ballots[0].args.p_none_ok, false);
  assert.deepEqual([...ballots[0].args.p_candidates], ['c1']); // spread: l'array arriva dal realm di jsdom
});

await test('un errore in avvio viene mostrato, non ingoiato', async () => {
  const { $ } = await boot({
    session: { data: { session: { user: { id: 'u1', is_anonymous: false, user_metadata: {} } } }, error: null },
    tables: { actors: () => ({ data: null, error: { message: 'permission denied for table actors' } }) }
  });
  const e = $('#err');
  assert.ok(e, 'la vista deve avere un contenitore #err');
  assert.match(e.textContent, /permission denied for table actors/, 'deve riportare il dettaglio vero di Supabase');
  assert.equal(e.style.display, 'block');
});

// Chi vota da ospite scrive un nome buttato lì. Se poi collega Google e resta
// "Ospite prova" per sempre, il collegamento sembra non aver funzionato anche
// quando ha funzionato: i dati ci sono ma la persona non si riconosce.
await test('dopo aver collegato Google si adotta il nome vero', async () => {
  const dom = new JSDOM(HTML, { url: 'https://example.test/', runScripts: 'outside-only' });
  dom.window.localStorage.setItem('kimari_link_google', '1');   // segno lasciato prima del salto

  const sb = makeSupabase({
    session: { data: { session: { user: {
      id: 'u1', is_anonymous: false, email: 'vincenzo@example.com',
      user_metadata: { full_name: 'Vincenzo Bottari' }
    } } }, error: null },
    tables: { actors: [{ id: 'a1', display_name: 'Ospite prova' }] }
  });
  dom.window.supabase = { createClient: () => sb };
  dom.window.eval(SCRIPT);
  await new Promise(r => setTimeout(r, 0));
  await new Promise(r => setTimeout(r, 0));

  const nomi = sb.calls.rpc.filter(c => c.name === 'ensure_actor');
  assert.equal(nomi.length, 1, 'il nome da Google non è stato adottato');
  assert.equal(nomi[0].args.p_display_name, 'Vincenzo Bottari');

  const mail = sb.calls.rpc.filter(c => c.name === 'set_my_email');
  assert.equal(mail.length, 1, 'l\'email da Google serve ad avvisare alla conferma');
  assert.equal(mail[0].args.p_email, 'vincenzo@example.com');

  assert.equal(dom.window.localStorage.getItem('kimari_link_google'), null,
    'il segno va tolto, altrimenti riscrive il nome a ogni avvio');
});

await test('senza collegamento in corso il nome scelto non viene toccato', async () => {
  // Chi ha già il suo account e si è messo un soprannome nel profilo non deve
  // vederselo riscrivere da Google a ogni apertura.
  const { sb } = await boot({
    session: { data: { session: { user: {
      id: 'u1', is_anonymous: false, email: 'v@example.com',
      user_metadata: { full_name: 'Vincenzo Bottari' }
    } } }, error: null },
    tables: { actors: [{ id: 'a1', display_name: 'Vince' }] }
  });
  assert.equal(sb.calls.rpc.filter(c => c.name === 'ensure_actor').length, 0);
  assert.equal(sb.calls.rpc.filter(c => c.name === 'set_my_email').length, 0);
});

// Il pezzo che si rompe in silenzio: se una chiave non combacia esce
// l'italiano, senza errori. Quindi non basta che il codice giri — bisogna
// leggere quello che finisce a schermo.
for (const [lingua, atteso] of [['en', 'Everyone has an opinion.'],
                                ['de', 'Jeder hat eine Meinung.'],
                                ['ja', 'みんな意見があります。'],
                                ['es', 'Todo el mundo tiene una opinión.']]) {
  await test(`il sito parla la lingua del dispositivo (${lingua})`, async () => {
    const dom = new JSDOM(HTML, { url: 'https://example.test/', runScripts: 'outside-only' });
    Object.defineProperty(dom.window.navigator, 'languages', { value: [lingua + '-XX', lingua] });
    dom.window.supabase = { createClient: () => makeSupabase() };
    dom.window.eval(SCRIPT);
    await new Promise(r => setTimeout(r, 0));
    await new Promise(r => setTimeout(r, 0));

    // #app, non body: body.textContent include anche il sorgente dello
    // <script>, e li dentro c'e il dizionario con tutte le chiavi italiane.
    // Cercando in body la prova passerebbe sempre, per il motivo sbagliato.
    const testo = dom.window.document.getElementById('app').textContent;
    assert.ok(testo.includes(atteso), `manca "${atteso}" · a schermo c'è: ${testo.slice(0, 90)}`);
    assert.ok(!testo.includes("Tutti hanno un'opinione"), 'è rimasto l\'italiano');
    assert.equal(dom.window.document.documentElement.lang, lingua);
  });
}

await test('lingua sconosciuta: si resta in italiano, non si rompe niente', async () => {
  const dom = new JSDOM(HTML, { url: 'https://example.test/', runScripts: 'outside-only' });
  Object.defineProperty(dom.window.navigator, 'languages', { value: ['sw-KE'] });
  dom.window.supabase = { createClient: () => makeSupabase() };
  dom.window.eval(SCRIPT);
  await new Promise(r => setTimeout(r, 0));
  await new Promise(r => setTimeout(r, 0));
  assert.match(dom.window.document.getElementById('app').textContent, /Tutti hanno un'opinione/);
});

await test('il titolo del piano non può iniettare HTML', async () => {
  // (prova del sito; quella dell'app sta in app/test/benvenuto.test.mjs)
  const preview = {
    ok: true, plan_id: 'p1', title: '<img src=x onerror=alert(1)>', status: 'deciding',
    organizer: 'Vince', voters: 0, when_mode: 'fixed', where_mode: 'fixed',
    starts_at: null, place_name: null, deadline_at: null, people: [], candidates: []
  };
  const { $, doc } = await boot({
    rpc: { preview_invite: { data: preview, error: null } }
  }, 'https://example.test/?t=TOKEN123');
  assert.equal(doc.querySelectorAll('img[onerror]').length, 0, 'niente markup iniettato');
  assert.match($('#app').textContent, /<img src=x onerror=alert\(1\)>/, 'deve comparire come testo');
});

/* ------------------------------------------------------------------ */
console.log(`\n${passed} passati, ${failed} falliti\n`);
process.exit(failed ? 1 : 0);
