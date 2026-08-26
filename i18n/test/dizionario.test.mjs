// Prova il dizionario: scelta della lingua, ricadute, e che le traduzioni
// esistenti siano sane. Funzioni pure, nessun DOM.
//
//   node i18n/test/dizionario.test.mjs
import assert from 'node:assert/strict';
import { DIZIONARIO, LINGUE, scegliLingua, traduttore, quanteMancano } from '../dizionario.js';

let passed = 0, failed = 0;
const test = (nome, fn) => {
  try { fn(); passed++; console.log('  ok   ' + nome); }
  catch (e) { failed++; console.log('  FAIL ' + nome + '\n       ' + e.message); }
};

console.log('\ndizionario — cinque lingue\n');

test('la lingua si prende da quelle del dispositivo', () => {
  assert.equal(scegliLingua(['de-DE', 'en']), 'de');
  assert.equal(scegliLingua(['ja-JP']), 'ja');
  assert.equal(scegliLingua(['pt-BR', 'es-ES']), 'es', 'salta quelle che non abbiamo');
  assert.equal(scegliLingua(['pt-BR']), 'it', 'nessuna nostra: si resta in italiano');
  assert.equal(scegliLingua([]), 'it');
  assert.equal(scegliLingua(undefined), 'it');
});

test('una lingua scelta a mano vince su quella del dispositivo', () => {
  assert.equal(scegliLingua(['de-DE'], 'ja'), 'ja');
  assert.equal(scegliLingua(['de-DE'], 'klingon'), 'de', 'una lingua inventata si ignora');
});

test('traduce', () => {
  const t = traduttore('en');
  assert.equal(t('Crea un piano'), 'Create a plan');
  assert.equal(traduttore('ja')('Crea un piano'), '予定をつくる');
  assert.equal(traduttore('it')('Crea un piano'), 'Crea un piano');
});

test('se manca la traduzione esce l\'italiano, mai una chiave a video', () => {
  const t = traduttore('de');
  // Una frase che nel dizionario non c'è: deve tornare identica.
  assert.equal(t('Una frase mai tradotta da nessuno'), 'Una frase mai tradotta da nessuno');
  assert.notEqual(t('Una frase mai tradotta da nessuno'), undefined);
  assert.notEqual(t('Una frase mai tradotta da nessuno'), '');
});

test('gli a capo dei template non fanno perdere la voce', () => {
  // Nel codice le frasi lunghe vanno a capo dentro i backtick: la ricerca deve
  // normalizzare gli spazi, altrimenti metà dizionario non verrebbe mai usato.
  const t = traduttore('en');
  assert.equal(t('Segna tutte le opzioni che ti vanno bene.\n    Vince quella compatibile con più persone.'),
               t('Segna tutte le opzioni che ti vanno bene. Vince quella compatibile con più persone.'));
  assert.match(t('Segna tutte le opzioni\n  che ti vanno bene. Vince quella compatibile con più persone.'),
               /^Tick every option/);
});

test('i segnaposto si riempiono, e ogni lingua li mette dove vuole', () => {
  const ja = traduttore('ja');
  assert.equal(ja('{nome} chiede al gruppo', { nome: 'Anna' }), 'Annaさんがみんなに聞いています');
  assert.equal(traduttore('de')('{n} hanno già votato', { n: 3 }),
               '3 Personen haben schon abgestimmt');
  // In italiano il segnaposto va riempito lo stesso, altrimenti a schermo
  // comparirebbe "{n} hanno già votato".
  assert.equal(traduttore('it')('{n} hanno già votato', { n: 3 }), '3 hanno già votato');
});

test('nessuna voce lascia un segnaposto senza corrispondenza', () => {
  // Se l'italiano dice {nome} e il tedesco no, in tedesco il nome sparisce.
  const rotte = [];
  for (const [it, v] of Object.entries(DIZIONARIO)) {
    const attesi = [...it.matchAll(/\{(\w+)\}/g)].map(m => m[1]).sort();
    if (!attesi.length) continue;
    for (const l of ['en', 'es', 'de', 'ja']) {
      const dati = [...String(v[l] || '').matchAll(/\{(\w+)\}/g)].map(m => m[1]).sort();
      if (dati.join() !== attesi.join()) rotte.push(`${l}: ${it}`);
    }
  }
  assert.deepEqual(rotte, []);
});

test('apostrofo dritto e tipografico trovano la stessa voce', () => {
  // Nel codice si scrive un'opinione con l'apostrofo della tastiera; in un
  // testo curato viene naturale scrivere un’opinione. Sono due caratteri
  // diversi: senza normalizzarli la voce non si trova mai, e non se ne accorge
  // nessuno perché esce l'italiano e sembra solo "non ancora tradotto".
  const en = traduttore('en');
  assert.equal(en("Tutti hanno un'opinione."), 'Everyone has an opinion.');
  assert.equal(en('Tutti hanno un’opinione.'), 'Everyone has an opinion.');
  assert.equal(en("Serve il link d'invito"), 'You need the invite link');
  assert.equal(en('Serve il link d’invito'), 'You need the invite link');
});

test('ogni voce ha tutte e quattro le lingue', () => {
  const buchi = [];
  for (const [it, v] of Object.entries(DIZIONARIO)) {
    for (const l of Object.keys(LINGUE)) {
      if (l === 'it') continue;
      if (!v[l] || !String(v[l]).trim()) buchi.push(`${l}: ${it.slice(0, 40)}`);
    }
  }
  assert.deepEqual(buchi, [], 'traduzioni mancanti');
});

// Nomi propri e cose che non sono parole: restano identiche in ogni lingua, e
// non è una dimenticanza. L'elenco è esplicito e corto apposta — se si
// allunga, vuol dire che lo si sta usando per far tacere la prova invece che
// per dire la verità.
const NON_SI_TRADUCONO = new Set(['Kimari!', 'Kimari Unlimited', 'Unlimited', 'https://…']);

test('l\'elenco di quelle che non si traducono non cresce di nascosto', () => {
  assert.ok(NON_SI_TRADUCONO.size <= 6,
    'troppe eccezioni: probabilmente ne stanno passando di vere');
  for (const x of NON_SI_TRADUCONO) {
    assert.ok(DIZIONARIO[x], 'eccezione per una voce che non esiste più: ' + x);
  }
});

test('nessuna traduzione è rimasta uguale all\'italiano per sbaglio', () => {
  const sospette = [];
  for (const [it, v] of Object.entries(DIZIONARIO)) {
    if (NON_SI_TRADUCONO.has(it)) continue;
    for (const l of ['en', 'es', 'de', 'ja']) {
      // Alcune coincidono davvero fra lingue vicine; il giapponese mai.
      if (v[l] === it && l === 'ja') sospette.push(`${l}: ${it}`);
    }
  }
  assert.deepEqual(sospette, []);
});

test('il giapponese non contiene lettere accentate italiane', () => {
  // Il segno più comune di un copia-incolla sbagliato.
  const sbagliate = Object.entries(DIZIONARIO)
    .filter(([, v]) => /[àèéìòù]/i.test(v.ja || ''))
    .map(([it]) => it);
  assert.deepEqual(sbagliate, []);
});

test('quanteMancano conta i buchi', () => {
  for (const l of ['en', 'es', 'de', 'ja']) {
    assert.equal(quanteMancano(l), 0, l + ' ha ancora buchi');
  }
});

console.log(`\n${Object.keys(DIZIONARIO).length} voci · ${Object.keys(LINGUE).length} lingue`);
console.log(`${passed} passati, ${failed} falliti\n`);
process.exit(failed ? 1 : 0);
