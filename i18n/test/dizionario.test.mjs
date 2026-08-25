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

test('nessuna traduzione è rimasta uguale all\'italiano per sbaglio', () => {
  const sospette = [];
  for (const [it, v] of Object.entries(DIZIONARIO)) {
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
