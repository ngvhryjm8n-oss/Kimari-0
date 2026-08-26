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

// `conDati`: chiede la modalita' demo. Dal 27/8 l'app NON parte piu' coi dati
// finti — mostra lo scheletro di caricamento finche' non arrivano i veri. Le
// prove che hanno bisogno di qualcosa da disegnare devono chiederlo, e questo
// e' un bene: rende esplicito quali provano il rendering e quali no.
const avvia = (marcatura, conDati = false) => new Promise(resolve => {
  const dom = new JSDOM(HTML, {
    url: 'https://esempio.test/Kimari-0/app/' + (conDati ? '?demo=1' : ''),
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
  // Si riconosce dal pulsante d'ingresso col nome, non dal testo: da quando
  // la porta è tradotta, "Continua con" esiste solo in italiano e questa prova
  // sarebbe passata in inglese per il motivo sbagliato.
  const sr = dom.window.document.getElementById('sheet-root');
  assert.equal(sr.querySelector('[data-action="loginName"]'), null,
    'ricomparso a chi ha già un profilo: sembra un login che non ha attaccato');
});

await test('a chi non è mai entrato si apre', async () => {
  const dom = await avvia(false);
  const sr = dom.window.document.getElementById('sheet-root');
  assert.ok(sr.querySelector('[data-action="loginName"]'),
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

await test('entrare col nome si vede, non si intuisce', async () => {
  // Una persona vera ha guardato questa schermata e ha detto "non ho Google o
  // Apple", concludendo di non poter entrare. La strada c'era, scritta come un
  // titoletto grigio in mezzo: si leggeva come un'intestazione.
  //
  // È la SECONDA volta che questo ingresso si perde. La prima era finito
  // dentro un menu a scomparsa, e quando il login si è rotto è rimasto l'unico
  // funzionante — nascosto.
  const dom = await avvia(false);
  const sr = dom.window.document.getElementById('sheet-root');

  assert.ok(sr.querySelector('[data-action="loginName"]'), 'manca il bottone');
  assert.ok(sr.querySelector('#welcomeName'), 'manca il campo del nome');
  assert.ok(!sr.querySelector('details #welcomeName, [hidden] #welcomeName'),
    'il campo non deve stare dentro qualcosa da aprire');

  // La domanda che quella persona si è fatta dev'essere scritta a schermo.
  // Si cerca una RIGA che nomini entrambi e finisca con un punto interrogativo,
  // in qualunque lingua: cercare le parole italiane renderebbe la prova verde
  // in inglese per il motivo sbagliato — errore che ho già fatto oggi.
  const domanda = sr.textContent.split('\n').map(r => r.trim()).some(r =>
    /google/i.test(r) && /apple/i.test(r) && /[?？]\s*$/.test(r));
  assert.ok(domanda,
    'la schermata deve rispondere a "non ho Google o Apple", non lasciarlo intuire');
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
  const dom = await avvia(true, true);   // servono immagini da disegnare
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

await test('la barra di sviluppo non compare, nemmeno per un istante', async () => {
  // Compariva per un secondo a ogni apertura: era nascosta solo quando il
  // database rispondeva, e il database ci mette un attimo. Un pannello di
  // sviluppo che lampeggia all'avvio di un'app vera e' un difetto.
  //
  // Da quella barra si cambia identita' in persone finte e si azzera tutto
  // caricando dati inventati — e' cosi' che Vincenzo si e' ritrovato i piani
  // di un Marco che non esiste.
  const dom = await avvia(true);
  const D = dom.window.document;
  const barra = D.getElementById('devbar');
  assert.ok(barra, 'la barra deve esistere ancora: serve in modalita' + "'" + ' demo');
  assert.notEqual(D.body.dataset.demo, '1', 'senza ?demo non va accesa');

  // Non basta che sia nascosta DOPO: la regola deve stare nel CSS, cosi' vale
  // gia' alla prima pittura. Se dipendesse da JavaScript, lampeggerebbe.
  const css = HTML.slice(0, HTML.indexOf('</style>'));
  assert.match(css, /#devbar\{display:none\}/,
    'la barra deve essere spenta dal CSS, non da JavaScript: se no lampeggia');
  assert.match(css, /body\[data-demo="1"\] #devbar\{display:flex\}/,
    'e deve poter tornare con ?demo=1');
});

await test('con ?demo=1 la barra torna', async () => {
  // Senza questa prova la correzione qui sopra si potrebbe "superare"
  // cancellando la barra, e si perderebbe il modo di mostrare il prototipo.
  const dom = await new Promise(resolve => {
    const d = new JSDOM(HTML, {
      url: 'https://esempio.test/Kimari-0/app/?demo=1',
      runScripts: 'dangerously', pretendToBeVisual: true,
      beforeParse(w) { w.localStorage.setItem('kimari_profilo', '1'); }
    });
    setTimeout(() => resolve(d), 300);
  });
  assert.equal(dom.window.document.body.dataset.demo, '1');
});

await test('chi cancella l account non fa pagare di piu agli altri', async () => {
  // Provato contro la produzione: cancellando l'account, la persona sparisce
  // dai partecipanti ma le sue quote restano nelle spese. Il calcolo la
  // escludeva e ridistribuiva la sua parte sugli altri.
  //
  // Il totale tornava comunque a zero — ed e' proprio questo che rende il
  // difetto difficile da vedere: l'invariante che si controlla di solito
  // restava soddisfatta mentre la gente si trovava a pagare di piu'.
  const dom = await avvia(true);
  const K = dom.window.__kimari;

  // Anna paga 30 per tre persone. Poi Carlo cancella l'account: non e' piu'
  // fra i partecipanti, ma la sua quota resta nella spesa.
  const piano = {
    participants: [{ id: 'anna' }, { id: 'bea' }],
    expenses: [{ id: 'e1', by: 'anna', amount: 3000, among: ['anna', 'bea', 'carlo'], voided: false }],
    settlements: []
  };
  const b = K.balances(piano);

  assert.equal(b.bea, -1000,
    'Bea deve ancora 10, non 15: la quota di chi se n e andato non ricade su di lei');
  assert.ok('carlo' in b, 'la quota di Carlo deve restare visibile, non sparire');
  assert.equal(b.carlo, -1000);
  const somma = Object.values(b).reduce((s, v) => s + v, 0);
  assert.equal(somma, 0, 'il conto deve comunque chiudere a zero');
});

await test('chi non c e piu si chiama "Membro eliminato", non stringa vuota', async () => {
  // L'app lo promette in due punti: "Lo storico condiviso resta come «Membro
  // eliminato»". Senza, a schermo comparivano crediti e debiti intestati a
  // nessuno — una riga con un importo e un nome vuoto.
  const dom = await avvia(true);
  const K = dom.window.__kimari;
  const src = readFileSync(join(root, 'app', 'index.html'), 'utf8');
  assert.match(src, /const nameOf = id => state\.people\[id\] \? state\.people\[id\]\.name : \(id \? t\('Membro eliminato'\) : ''\)/,
    'nameOf deve dire chi non c e piu, e restare vuota se l id e vuoto');
});

// La porta d'ingresso e' la prima schermata che vede chi installa. Se resta in
// italiano, per un tedesco l'app E' italiana — qualunque cosa dicano le altre
// duecento stringhe. Per questo ha una prova sua, che guarda cosa finisce
// davvero a schermo invece di fidarsi che il dizionario sia pieno.
for (const [lingua, atteso, vietato] of [
  ['en', 'Continue with Apple', 'Continua con Apple'],
  ['de', 'Weiter mit Apple',    'Continua con Apple'],
  ['es', 'Continuar con Apple', 'Continua con Apple'],
  ['ja', 'Apple で続ける',       'Continua con Apple']
]) {
  await test('la porta d ingresso parla ' + lingua, async () => {
    const dom = await new Promise(resolve => {
      const d = new JSDOM(HTML, {
        url: 'https://esempio.test/Kimari-0/app/',
        runScripts: 'dangerously', pretendToBeVisual: true,
        beforeParse(w) {
          Object.defineProperty(w.navigator, 'languages', { value: [lingua + '-XX', lingua] });
          Object.defineProperty(w.navigator, 'language',  { value: lingua + '-XX' });
        }
      });
      setTimeout(() => resolve(d), 300);
    });
    const sr = dom.window.document.getElementById('sheet-root');
    assert.ok(sr.querySelector('[data-action="loginName"]'), 'la porta non si e aperta');
    const testo = sr.textContent;
    assert.ok(testo.includes(atteso), 'manca "' + atteso + '" · a schermo: ' + testo.slice(0, 120));
    assert.ok(!testo.includes(vietato), 'e rimasto l italiano');
    assert.equal(dom.window.document.documentElement.lang, lingua);
  });
}

// I messaggi che finiscono su WhatsApp sono spesso il PRIMO contatto con
// Kimari: uno li riceve inoltrati da un amico, senza aver mai visto l'app.
// Restavano in italiano anche a chi usa l'app in un'altra lingua.
for (const lingua of ['en', 'de', 'ja']) {
  await test('i messaggi da condividere parlano ' + lingua, async () => {
    const dom = await new Promise(resolve => {
      const d = new JSDOM(HTML, {
        url: 'https://esempio.test/Kimari-0/app/?demo=1',   // serve un gruppo vero
        runScripts: 'dangerously', pretendToBeVisual: true,
        beforeParse(w) {
          Object.defineProperty(w.navigator, 'languages', { value: [lingua + '-XX', lingua] });
          Object.defineProperty(w.navigator, 'language', { value: lingua + '-XX' });
          w.localStorage.setItem('kimari_profilo', '1');
        }
      });
      setTimeout(() => resolve(d), 300);
    });
    const K = dom.window.__kimari;
    const gruppo = Object.values(K.state.groups)[0];
    assert.ok(gruppo, 'senza un gruppo questa prova non misura niente');

    const msg = K.msgs.group(gruppo);
    assert.ok(!/Entra nel gruppo/.test(msg), 'e rimasto l italiano: ' + msg.slice(0, 60));
    assert.ok(msg.includes('{link}'),
      'il segnaposto del link e sparito: il messaggio partirebbe senza indirizzo');
    assert.ok(msg.includes(gruppo.name), 'il nome del gruppo si e perso per strada');

    // L'invito a un amico porta l'indirizzo del sito, non un segnaposto.
    const amico = K.msgs.friend();
    assert.ok(!/Aggiungimi su Kimari/.test(amico), 'e rimasto l italiano');
    assert.ok(/https?:\/\//.test(amico), 'manca il link');
  });
}

await test('l app si puo installare sul telefono', async () => {
  // Sono quattro righe di <head> che nessuno guarda mai, e il sintomo quando
  // mancano non sembra un difetto: l'app si installa lo stesso, solo con
  // un'icona brutta o dentro la barra del browser. Nessuno lo segnala.
  assert.match(HTML, /<link rel="manifest" href="\.\/manifest\.json">/,
    'senza manifest il telefono non propone di installarla');

  // iOS IGNORA le icone del manifest: guarda solo apple-touch-icon. Senza,
  // mette uno screenshot della pagina come icona sulla schermata Home.
  assert.match(HTML, /<link rel="apple-touch-icon" href="[^"]+">/,
    'su iPhone l icona sarebbe uno screenshot della pagina');

  assert.match(HTML, /<meta name="apple-mobile-web-app-capable" content="yes">/,
    'senza, su iPhone l app si apre dentro Safari con la barra degli indirizzi');

  const man = JSON.parse(readFileSync(join(root, 'app', 'manifest.json'), 'utf8'));
  assert.equal(man.display, 'standalone', 'si aprirebbe come una pagina web qualunque');
  assert.ok(man.icons && man.icons.length, 'niente icone');
  for (const i of man.icons) {
    const f = i.src.replace(/^\.\//, '');
    assert.ok(readFileSync(join(root, 'app', f)).length > 0, 'icona mancante: ' + f);
  }
  // Una maskable serve ad Android, che ritaglia l'icona nella forma di sistema:
  // senza, la ritaglia lo stesso e taglia via i bordi del disegno.
  assert.ok(man.icons.some(i => String(i.purpose || '').includes('maskable')),
    'su Android l icona verrebbe ritagliata male');
});

await test('il titolo e l anteprima sono quelli che vede chi riceve il link', () => {
  // Il titolo della pagina finisce nell'anteprima di WhatsApp. Diceva
  // "Kimari — prototipo app v3": una nota per noi, letta da loro.
  const titolo = (HTML.match(/<title>([^<]*)<\/title>/) || [])[1];
  assert.equal(titolo, 'Kimari', 'il titolo lo legge chi riceve il link');
  assert.ok(!/prototip|v\d|test|bozza/i.test(titolo));

  // Senza questi tag l'anteprima e' un indirizzo nudo. Il link a un piano
  // viene inoltrato a gente che non ha mai sentito nominare Kimari: e' il
  // primo pezzo di prodotto che vedono.
  for (const t of ['og:title', 'og:description', 'og:image']) {
    assert.ok(HTML.includes('property="' + t + '"'), 'manca ' + t);
  }
  // L'immagine deve essere un indirizzo ASSOLUTO: WhatsApp non risolve i
  // percorsi relativi, e un'anteprima senza immagine sembra un link sospetto.
  const img = (HTML.match(/property="og:image" content="([^"]*)"/) || [])[1];
  assert.match(img, /^https:\/\//, 'og:image relativa: l anteprima resta senza immagine');
});

await test('lo schermo d errore non lascia pulsanti che funzionano per finta', async () => {
  // Se l'avvio fallisce, wire() non viene mai chiamata: live.js non intercetta
  // niente e i pulsanti rimasti a schermo li gestisce la DEMO. Vincenzo si e'
  // trovato la porta d'ingresso aperta sopra lo schermo d'errore, ha toccato
  // "entra", e l'app lo ha salutato "Benvenuto Marco" — un nome finto.
  //
  // Uno schermo d'errore con sopra pulsanti che funzionano per finta e' peggio
  // di un errore e basta: invita a usarli.
  const live = readFileSync(join(root, 'app', 'live.js'), 'utf8');
  const i = live.indexOf('export function schermoNonCollegato');
  const corpo = live.slice(i, i + 1400);
  assert.ok(/sheet-root/.test(corpo) && /innerHTML = ''/.test(corpo),
    'lo schermo d errore deve chiudere le schermate aperte');
  // E deve farlo PRIMA di disegnare, o per un istante i pulsanti restano.
  assert.ok(corpo.indexOf('sheet-root') < corpo.indexOf("getElementById('app')"),
    'le schermate vanno chiuse prima di disegnare l errore');
});

await test('nessun comando promette cose che l app non fa', () => {
  // Vincenzo ha chiesto a che servissero due righe del Profilo. La risposta
  // era: a niente. Erano segnaposto del prototipo che mostravano un messaggio
  // e basta — "Lingua · Italiano" anche a un tedesco, e un calendario a
  // pagamento che non esiste.
  //
  // I comandi che mostrano solo un messaggio sono leciti: spiegare come
  // funziona una cosa e' utile. Quello che NON e' lecito e' promettere.
  const promesse = /\b(presto|in arrivo|prossimamente|a breve|coming soon|demo|prototipo)\b/i;
  const morti = [];
  for (const m of HTML.matchAll(/data-action="toast"[^>]*data-msg="([^"]*)"/g)) {
    if (promesse.test(m[1])) morti.push(m[1].slice(0, 70));
  }
  assert.deepEqual(morti, [],
    'un comando che promette e non fa e un debito verso chi lo tocca');
});

await test('esportare i propri dati funziona davvero', () => {
  // PRIVACY.md promette di poterli "ricevere in un formato leggibile da una
  // macchina". Il bottone c'era e diceva "Esportazione in arrivo": una
  // promessa scritta in una policy e disattesa da un pulsante.
  assert.ok(HTML.includes('data-action="esporta"'),
    'il bottone deve chiamare qualcosa, non mostrare un messaggio');
  const live = readFileSync(join(root, 'app', 'live.js'), 'utf8');
  assert.match(live, /async esporta\(/, 'manca il gestore');
  assert.match(live, /esportaMieiDati/, 'non legge i dati veri');

  const policy = readFileSync(join(root, 'PRIVACY.md'), 'utf8');
  assert.match(policy, /leggibile da una macchina/,
    'se la policy non lo promette piu, questa prova va ripensata, non cancellata');
});

await test('senza dati veri non si inventa niente', async () => {
  // Vincenzo: "leva Marco e i dati finti, metti l effetto di caricamento".
  // Aveva ragione oltre l estetica: quei piani inventati erano la radice di
  // tre difetti diversi trovati il 26/8. Da uno di essi si poteva votare,
  // condividere un link e confermare cose che non esistono.
  const dom = await avvia(true);          // SENZA ?demo=1: l app vera
  const D = dom.window.document;
  const K = dom.window.__kimari;

  assert.equal(Object.keys(K.state.plans).length, 0, 'sono comparsi piani dal nulla');
  assert.equal(Object.keys(K.state.people).length, 0, 'sono comparse persone dal nulla');
  const testo = D.getElementById('app').textContent;
  assert.ok(!/Marco|Sara|Cena di famiglia|Torneo di padel/.test(testo),
    'i dati finti sono ancora a schermo: ' + testo.slice(0, 80));

  // E al loro posto? Non "non hai niente" — quello sarebbe un altra bugia,
  // perche non lo sappiamo ancora. Lo scheletro.
  assert.ok(D.querySelector('.osso'),
    'senza scheletro resta uno schermo vuoto, che si legge come "non hai piani"');
});

await test('con ?demo=1 i dati finti tornano', async () => {
  // Serve a mostrare il prototipo senza database. Senza questa prova, la
  // precedente si potrebbe "superare" cancellando seed() — e si perderebbe
  // l unico modo di far vedere l app a qualcuno senza connetterla.
  const dom = await avvia(true, true);
  assert.ok(Object.keys(dom.window.__kimari.state.plans).length > 0,
    'in modalita demo i piani di esempio devono esserci');
});

await test('il suggerimento di installare distingue iPhone e Android', () => {
  // Vincenzo: "Android e Apple sono diversi, devi distinguere?". Si, e piu di
  // quanto sembri: su Android il browser puo aprire una VERA finestra di
  // installazione con un tocco; su iPhone quell API non esiste e si possono
  // solo dare istruzioni — che per giunta valgono SOLO per Safari.
  //
  // Dare istruzioni che non si possono seguire fa sembrare rotta l app invece
  // del browser.
  const src = HTML;
  assert.match(src, /beforeinstallprompt/, 'senza, su Android si danno istruzioni invece di installare');
  assert.match(src, /CriOS|FxiOS/, 'su iPhone fuori da Safari le istruzioni non si possono seguire');
  assert.match(src, /data-action="installa"/, 'manca il bottone che apre la finestra vera');

  // L invito del browser si puo usare UNA volta sola: riusarlo non fa niente,
  // e lasciare il bottone li dopo il primo tocco sembra rotto.
  assert.match(src, /invitoInstalla = null;\s*inv\.prompt\(\)/,
    'l invito va consumato, non riproposto');
});

await test('matchMedia mancante non deve far morire il render', async () => {
  // Ha fatto schermata bianca in jsdom, e avrebbe fatto lo stesso su un
  // browser vecchio: installata() chiamava matchMedia senza rete di sicurezza,
  // render() moriva, e con lui l app intera.
  assert.match(HTML, /try \{\s*return \(window\.matchMedia && window\.matchMedia/,
    'installata() deve reggere anche senza matchMedia');

  // E la prova che conta: l app si disegna lo stesso.
  const dom = await avvia(true);
  assert.ok(dom.window.document.getElementById('app').textContent.length > 0,
    'schermata vuota');
});

await test('le Novita reggono anche le voci senza piano', async () => {
  // Difetto introdotto da me stanotte, trovato da Vincenzo: "non riesco a
  // cliccare novita". Avevo aggiunto le voci "e entrato nel gruppo", che NON
  // hanno un piano — e la schermata faceva it.p.title su ogni voce. Su un
  // account con gruppi la pagina moriva, e il tocco sembrava non funzionare.
  //
  // Il sintomo non diceva niente della causa: sembrava un problema del tocco.
  const dom = await avvia(true, true);
  const K = dom.window.__kimari;

  // Una voce di feed senza piano, come quelle degli ingressi nei gruppi.
  const g = Object.values(K.state.groups)[0];
  assert.ok(g, 'senza gruppi questa prova non misura niente');
  g.entrati = [{ id: Object.keys(K.state.people)[0], il: Date.now() - 60000 }];

  // Non deve morire, e la voce deve comparire.
  K.state.lastSeenNews = 0;
  dom.window.location.hash = '#news';
  K.render();
  const testo = dom.window.document.getElementById('app').textContent;
  assert.ok(testo.length > 0, 'la schermata Novita e morta');
  assert.ok(!/undefined/.test(testo), 'a schermo compare "undefined"');
});
});

console.log(`\n${passed} passati, ${failed} falliti\n`);
process.exit(failed ? 1 : 0);
