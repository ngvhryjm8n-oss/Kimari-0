// La schermata di benvenuto ricompariva a chi era già entrato.
//
// È il bug che per tre giri è sembrato un login rotto. Il prototipo fa
// `reset(); render();` mentre la pagina viene letta — con i dati finti, e
// prima che live.js esista — e lì programma il benvenuto. Chiuderlo dopo è una
// corsa contro un setTimeout: l'unico modo pulito è che il prototipo non lo
// programmi affatto, leggendo una marcatura lasciata dall'avvio precedente.
//
// Questa prova gira sul file VERO, in un DOM vero, perché il difetto stava
// esattamente nell'ordine in cui le due parti si avviano — cosa che nessuna
// prova sui soli gestori avrebbe potuto vedere.
//
//   node app/test/benvenuto.test.mjs
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const HTML = readFileSync(join(root, 'app', 'index.html'), 'utf8');

const avvia = (marcatura) => new Promise(resolve => {
  const dom = new JSDOM(HTML, {
    url: 'https://esempio.test/Kimari-0/app/',
    runScripts: 'dangerously',
    pretendToBeVisual: true,
    beforeParse(w) { if (marcatura) w.localStorage.setItem('kimari_profilo', '1'); }
  });
  setTimeout(() => resolve(dom), 300);
});

let passed = 0, failed = 0;
const test = async (nome, fn) => {
  try { await fn(); passed++; console.log('  ok   ' + nome); }
  catch (e) { failed++; console.log('  FAIL ' + nome + '\n       ' + e.message); }
};

console.log('\nbenvenuto — si apre solo a chi serve\n');

await test('a chi è già entrato NON viene riproposto', async () => {
  const dom = await avvia(true);
  const sheet = dom.window.document.getElementById('sheet-root').innerHTML;
  assert.ok(!sheet.includes('Continua con'),
    'ricomparso a chi ha già un profilo: sembra un login che non ha attaccato');
});

await test('a chi non è mai entrato si apre', async () => {
  const dom = await avvia(false);
  const sheet = dom.window.document.getElementById('sheet-root').innerHTML;
  assert.ok(sheet.includes('Continua con'),
    'senza porta d\'ingresso nell\'app non si entra affatto');
});

await test('la porta offre tutte e tre le strade', async () => {
  const dom = await avvia(false);
  const D = dom.window.document;
  const azioni = [...D.querySelectorAll('#sheet-root [data-action]')]
    .map(x => x.dataset.action + (x.dataset.p ? '/' + x.dataset.p : ''));
  assert.ok(azioni.includes('login/apple'), 'manca Apple');
  assert.ok(azioni.includes('login'), 'manca Google');
  // L'ingresso col nome era finito dentro un menu a scomparsa, e quando il
  // login si è rotto è rimasto l'unico funzionante — nascosto.
  assert.ok(azioni.includes('loginName'), 'manca l\'ingresso col nome');
  assert.ok(D.querySelector('#welcomeName'), 'manca il campo del nome');
  assert.ok(!D.querySelector('details #welcomeName'), 'il campo non deve essere nascosto');
});

await test('la marcatura si legge prima che parta il render', async () => {
  // È il punto di tutta la faccenda: il prototipo decide se programmare il
  // benvenuto DURANTE il caricamento, quando live.js non esiste ancora.
  // Quindi la marcatura dev'essere letta con una lettura sincrona di
  // localStorage, non passata da live.js dopo.
  const src = readFileSync(join(root, 'app', 'index.html'), 'utf8');
  const i = src.indexOf('const giaEntrato');
  const j = src.indexOf('state.welcomeShown = true; setTimeout');
  assert.ok(i !== -1, 'manca giaEntrato()');
  assert.ok(i < j, 'giaEntrato deve essere definita PRIMA del render che la usa');
  assert.ok(/localStorage\.getItem\('kimari_profilo'\)/.test(src),
    'la marcatura deve venire da localStorage: è l\'unica cosa disponibile così presto');
});

await test('la chiusura del benvenuto non ammazza le altre schermate', () => {
  // reload() apre l'invito a un gruppo proprio durante l'avvio, e subito dopo
  // l'avvio chiudeva il benvenuto. Chiudendo "qualunque cosa sia aperta" —
  // e per giunta con un ritardo — spariva anche l'invito: chi riceveva il
  // link a un gruppo lo vedeva lampeggiare e restava fuori.
  const live = readFileSync(join(root, 'app', 'live.js'), 'utf8');
  assert.ok(/function chiudiSoloIlBenvenuto/.test(live),
    'manca la chiusura mirata');
  assert.ok(/data-action="loginName"/.test(live),
    'il riconoscimento deve stare su un elemento, non su un testo: i testi cambiano con la lingua');

  // Dopo l'avvio non deve restare nessuna chiusura cieca.
  const dopoAvvio = live.slice(live.indexOf('} else if (K.closeSheet) {'));
  assert.ok(!/setTimeout\(\(\) => K\.closeSheet\(\)/.test(dopoAvvio),
    'chiusura cieca ritardata: ammazzerebbe di nuovo l\'invito al gruppo');
});

await test("l'import di live.js porta la versione giusta", () => {
  // Senza, dopo ogni pubblicazione il browser tiene il live.js vecchio per
  // dieci minuti e lo abbina all'HTML nuovo: uno stato ibrido che non esiste
  // in nessun commit, e che guardando il codice non si riesce a spiegare.
  // Si sistema con: npm run timbra
  const live = readFileSync(join(root, 'app', 'live.js'), 'utf8');
  const v = live.match(/VERSIONE = '([^']*)'/)[1];
  const imp = HTML.match(/src="\.\/live\.js\?v=([^"]*)"/);
  assert.ok(imp, "l'import di live.js non porta ?v=");
  assert.equal(decodeURIComponent(imp[1]), v,
    "versione scaduta nell'import: gira `npm run timbra`");

  // Non basta l'ingresso: il browser mette in cache ogni modulo per conto
  // suo, quindi puo' abbinare un live.js nuovo a un map.js vecchio. Deve
  // portare la versione TUTTA la catena.
  for (const f of ['live.js', 'data.js']) {
    const src = readFileSync(join(root, 'app', f), 'utf8');
    for (const m of src.matchAll(/from '\.\/([a-z]+\.js)(\?v=([^']*))?'/g)) {
      assert.ok(m[2], `${f} importa ./${m[1]} senza versione: gira \`npm run timbra\``);
      assert.equal(decodeURIComponent(m[3]), v,
        `${f} importa ./${m[1]} con una versione scaduta`);
    }
  }
});

// Nota su cosa questo file NON può provare: in jsdom i moduli non vengono
// eseguiti, quindi live.js non parte e l'app resta coi dati finti. Che senza
// profilo l'app sia inutilizzabile — niente barra, nessuna azione — è stato
// verificato in un browser vero contro la produzione, non qui.

await test('ridisegnare non ricostruisce quello che non cambia', async () => {
  // Il motivo per cui l'app sfarfallava sul telefono di Vincenzo: ogni azione
  // che salva ridisegna, e il prototipo rifaceva tutto il DOM. Misurando un
  // tocco su "Forse": 719 ms d'attesa e poi 40.073 caratteri sostituiti per
  // cambiarne 2, con le 7 immagini buttate e ricreate.
  //
  // Qui si prova la cosa che conta davvero: gli STESSI nodi restano vivi.
  // Un'immagine che sopravvive non lampeggia.
  const dom = await avvia(true);
  const D = dom.window.document;
  const W = dom.window;

  const app = D.getElementById('app');
  assert.ok(typeof W.__kimari.aggiorna === 'function', 'manca aggiorna()');

  const primaImg = [...D.querySelectorAll('img')];
  const primoScreen = D.getElementById('screen');
  assert.ok(primaImg.length > 0, 'senza immagini questa prova non misura niente');

  // Stesso contenuto: non deve cambiare un solo nodo.
  W.__kimari.render();
  assert.equal(D.getElementById('screen'), primoScreen, 'lo schermo e stato ricreato');
  const dopoImg = [...D.querySelectorAll('img')];
  assert.equal(dopoImg.length, primaImg.length);
  primaImg.forEach((im, i) => assert.equal(dopoImg[i], im,
    'immagine ' + i + ' ricreata: e lei che lampeggia'));
});

await test('ridisegnare applica comunque i cambiamenti', async () => {
  // Un ridisegno che non ricostruisce e inutile se non aggiorna: questa prova
  // esiste perche' la precedente da sola si accontenterebbe di non fare niente.
  const dom = await avvia(true);
  const D = dom.window.document, W = dom.window;
  const bersaglio = D.createElement('div');
  bersaglio.innerHTML = '<p class="x" data-a="1">uno</p><span>due</span>';
  const p = bersaglio.querySelector('p');

  W.__kimari.aggiorna(bersaglio, '<p class="y" data-a="2">tre</p><span>due</span><b>nuovo</b>');

  assert.equal(bersaglio.querySelector('p'), p, 'il paragrafo doveva restare lo stesso nodo');
  assert.equal(p.textContent, 'tre', 'il testo non e stato aggiornato');
  assert.equal(p.className, 'y', 'la classe non e stata aggiornata');
  assert.equal(p.dataset.a, '2', 'l attributo non e stato aggiornato');
  assert.ok(bersaglio.querySelector('b'), 'il nodo nuovo non e stato aggiunto');
});

await test('ridisegnare toglie quello che non c e piu', async () => {
  const dom = await avvia(true);
  const W = dom.window, D = dom.window.document;
  const b = D.createElement('div');
  b.innerHTML = '<i>a</i><i>b</i><i>c</i>';
  W.__kimari.aggiorna(b, '<i>a</i>');
  assert.equal(b.querySelectorAll('i').length, 1, 'i nodi in eccesso restano');
  assert.equal(b.textContent, 'a');
});

await test('ridisegnare svuota una casella quando deve', async () => {
  // Il valore di un campo vive nella proprieta', non nell'attributo: senza
  // sincronizzarlo, svuotare la casella dei commenti dopo l'invio non
  // funzionerebbe piu' e il testo resterebbe li' come se non fosse partito.
  const dom = await avvia(true);
  const W = dom.window, D = dom.window.document;
  const b = D.createElement('div');
  b.innerHTML = '<input value="">';
  b.querySelector('input').value = 'scritto a mano';
  W.__kimari.aggiorna(b, '<input value="">');
  assert.equal(b.querySelector('input').value, '', 'la casella non si e svuotata');
});

console.log(`\n${passed} passati, ${failed} falliti\n`);
process.exit(failed ? 1 : 0);
