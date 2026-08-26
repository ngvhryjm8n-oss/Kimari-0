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

globalThis.localStorage = {
  _m: {},
  getItem(k) { return Object.prototype.hasOwnProperty.call(this._m, k) ? this._m[k] : null; },
  setItem(k, v) { this._m[k] = String(v); },
  removeItem(k) { delete this._m[k]; }
};

const { tornandoDaLogin, pulisciUrlDopoLogin, haIdentitaVera,
        init, signInWithProvider } = await import('../data.js');

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

test('riconosce chi ha collegato un account senza fidarsi di is_anonymous', () => {
  // È IL BUG del 26/8/2026. Dopo linkIdentity l'utente non è più anonimo, ma
  // il token che si ha in mano continua a dire is_anonymous: true finché non
  // viene rinnovato. Chi si fida di quel campo non si accorge mai che
  // l'accesso è avvenuto: il profilo non viene creato, l'utente resta
  // 'ospite' e si vede ricomparire la schermata d'ingresso dopo essere
  // entrato — che è esattamente quello che succedeva.
  assert.equal(haIdentitaVera({
    is_anonymous: true,                                    // ← token vecchio
    identities: [{ provider: 'anonymous' }, { provider: 'google' }]
  }), true, 'ha collegato Google: va riconosciuto anche col token vecchio');

  assert.equal(haIdentitaVera({
    is_anonymous: true, identities: [{ provider: 'apple' }]
  }), true, 'vale anche per Apple');

  assert.equal(haIdentitaVera({
    is_anonymous: true, identities: [{ provider: 'anonymous' }]
  }), false, 'un ospite vero resta un ospite');

  // Ricaduta quando identities non arriva: un anonimo non ha email.
  assert.equal(haIdentitaVera({ email: 'v@example.com' }), true);
  assert.equal(haIdentitaVera({}), false);
  assert.equal(haIdentitaVera(null), false);
});

/* ---------------------------------------------------------------------- */
/* entrare con Apple o Google da un dispositivo nuovo                      */

// Il difetto del 26/8/2026, trovato da Vincenzo sul dominio nuovo: si tocca
// "Continua con Apple" e si torna alla schermata d'ingresso, senza un
// messaggio. Riprovando succede sempre lo stesso — un vicolo cieco.
//
// Il motivo: su un dispositivo (o un indirizzo) nuovo l'app apre una sessione
// ospite VUOTA, poi prova a COLLEGARLE l'identita' Apple. Ma quell'identita' e'
// gia' legata all'account che quella persona ha altrove, e Supabase rifiuta di
// legarla a due utenti.
//
// Collegare serve a non perdere quello che si e' fatto da ospite. Se da ospite
// non si e' fatto niente, non c'e' niente da perdere e si deve semplicemente
// ENTRARE.

function finto({ anonimo = true, conProfilo = false } = {}) {
  const fatte = [];
  init({
    auth: {
      getSession: async () => ({ data: { session: { user: { id: 'u', is_anonymous: anonimo } } }, error: null }),
      linkIdentity:    async o => { fatte.push('linkIdentity:' + o.provider); return { error: null }; },
      signInWithOAuth: async o => { fatte.push('signInWithOAuth:' + o.provider); return { error: null }; }
    },
    from: () => ({
      select: () => ({ eq: async () => ({ data: conProfilo ? [{ id: 'a1' }] : [], error: null }) })
    })
  });
  return fatte;
}

await test('da un dispositivo nuovo si ENTRA, non si collega', async () => {
  const fatte = finto({ anonimo: true, conProfilo: false });
  await signInWithProvider('apple', 'https://esempio.test/');
  assert.deepEqual(fatte, ['signInWithOAuth:apple'],
    'la sessione ospite e vuota: collegare la farebbe rifiutare da Supabase');
});

await test('chi ha gia votato da ospite invece collega, per non perdere i piani', async () => {
  const fatte = finto({ anonimo: true, conProfilo: true });
  await signInWithProvider('google', 'https://esempio.test/');
  assert.deepEqual(fatte, ['linkIdentity:google'],
    'con un profilo c e qualcosa da salvare: qui collegare e giusto');
});

await test('chi ha gia un account vero fa un login normale', async () => {
  const fatte = finto({ anonimo: false, conProfilo: true });
  await signInWithProvider('apple', 'https://esempio.test/');
  assert.deepEqual(fatte, ['signInWithOAuth:apple']);
});

await test('il provider si ricorda, per poter riprovare al ritorno', async () => {
  // Nell URL di ritorno quell informazione non c e: senza ricordarla, il
  // recupero dovrebbe indovinare fra Apple e Google.
  finto({ anonimo: true, conProfilo: false });
  await signInWithProvider('apple', 'https://esempio.test/');
  assert.equal(localStorage.getItem('kimari_provider'), 'apple');
});


console.log(`\n${passed} passati, ${failed} falliti\n`);
process.exit(failed ? 1 : 0);
