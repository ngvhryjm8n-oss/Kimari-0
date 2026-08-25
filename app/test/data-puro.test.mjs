// Prova le parti di data.js che non parlano con Supabase.
// Il resto è coperto da live.test.mjs, che sostituisce data.js con un finto —
// ma proprio per questo lì il vero data.js non viene mai eseguito: quello che
// sta qui è l'unico posto dove il file originale viene davvero provato.
//
//   node app/test/data-puro.test.mjs
import assert from 'node:assert/strict';

globalThis.location = { origin: 'https://esempio.test', pathname: '/Kimari-0/app/',
                        hash: '', search: '' };
globalThis.history = { replaceState() { globalThis.history.__chiamata = true; } };

const { tornandoDaLogin, pulisciUrlDopoLogin } = await import('../data.js');

let passed = 0, failed = 0;
const test = (nome, fn) => {
  try { fn(); passed++; console.log('  ok   ' + nome); }
  catch (e) { failed++; console.log('  FAIL ' + nome + '\n       ' + e.message); }
};

console.log('\ndata.js — ritorno da un login\n');

test('riconosce il ritorno da Google o Apple', () => {
  // Due forme: il token nel frammento (flusso implicito) e ?code= (PKCE).
  location.hash = '#access_token=abc&expires_in=3600'; location.search = '';
  assert.equal(tornandoDaLogin(), true, 'frammento con access_token');

  location.hash = ''; location.search = '?code=xyz';
  assert.equal(tornandoDaLogin(), true, 'ritorno PKCE');

  location.hash = '#error_description=denied'; location.search = '';
  assert.equal(tornandoDaLogin(), true, 'anche un rifiuto è un ritorno');
});

test('non scambia per login le rotte normali', () => {
  // Se sbagliasse qui, aprire un invito bloccherebbe l'app per otto secondi
  // ad aspettare una sessione che non arriverà mai.
  for (const [hash, search, cosa] of [
    ['#/p/123', '', 'un piano'],
    ['#/gi/tok', '', 'un invito a un gruppo'],
    ['', '?t=tok', 'un invito a un piano'],
    ['#/home', '', 'la home'],
    ['', '', 'apertura normale']
  ]) {
    location.hash = hash; location.search = search;
    assert.equal(tornandoDaLogin(), false, cosa + ' non è un ritorno da login');
  }
});

test('ripulisce l\'URL solo quando serve', () => {
  // Il prototipo usa il frammento per le rotte: lasciarci dentro i token
  // significa che prova a interpretare "access_token=..." come una schermata.
  history.__chiamata = false;
  location.hash = '#access_token=abc'; location.search = '';
  assert.equal(pulisciUrlDopoLogin(), true);
  assert.equal(history.__chiamata, true, 'l\'URL doveva essere ripulito');

  history.__chiamata = false;
  location.hash = '#/p/123'; location.search = '';
  assert.equal(pulisciUrlDopoLogin(), false);
  assert.equal(history.__chiamata, false, 'una rotta normale non va toccata');
});

console.log(`\n${passed} passati, ${failed} falliti\n`);
process.exit(failed ? 1 : 0);
