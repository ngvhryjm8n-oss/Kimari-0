// apple-secret.mjs — genera il "client secret" di Sign in with Apple.
//
// Apple non ti dà un secret: te lo fai tu, ed è un JWT firmato con la chiave
// .p8 che scarichi dal portale. Le guide in giro suggeriscono generatori
// online. NON usarli: gli incolli dentro la tua chiave privata, cioè
// esattamente la cosa che non deve uscire dal tuo computer. Con Node ci vogliono
// trenta righe, e questa è quella.
//
//   node tools/apple-secret.mjs AuthKey_ABC123.p8 TEAM_ID KEY_ID it.kimari.web
//
//   AuthKey_....p8   il file scaricato da Certificates → Keys (una volta sola!)
//   TEAM_ID          10 caratteri, in alto a destra nel portale Apple
//   KEY_ID           10 caratteri, accanto alla chiave che hai creato
//   it.kimari.web    il tuo Services ID
//
// SCADE. Apple non accetta secret validi più di 6 mesi: questo li fa a 6 mesi
// meno un giorno e ti scrive la data. Segnatela — quando scade, l'accesso con
// Apple smette di funzionare e il messaggio d'errore non dice perché.
import { readFileSync } from 'node:fs';
import { createPrivateKey, sign } from 'node:crypto';

const [p8, teamId, keyId, servicesId] = process.argv.slice(2);

if (!p8 || !teamId || !keyId || !servicesId) {
  console.error(`
uso: node tools/apple-secret.mjs <chiave.p8> <TEAM_ID> <KEY_ID> <SERVICES_ID>

esempio:
  node tools/apple-secret.mjs AuthKey_9ABCD12345.p8 A1B2C3D4E5 9ABCD12345 it.kimari.web
`);
  process.exit(1);
}

const b64 = o => Buffer.from(JSON.stringify(o)).toString('base64url');

const ora = Math.floor(Date.now() / 1000);
const scadenza = ora + 15552000;          // 180 giorni: sotto il massimo di Apple

const testa = b64({ alg: 'ES256', kid: keyId });
const corpo = b64({
  iss: teamId,
  iat: ora,
  exp: scadenza,
  aud: 'https://appleid.apple.com',
  sub: servicesId
});

let chiave;
try {
  chiave = createPrivateKey(readFileSync(p8, 'utf8'));
} catch (e) {
  console.error('Non riesco a leggere la chiave: ' + e.message);
  console.error('Deve essere il file AuthKey_XXXXXXXXXX.p8 scaricato da Apple, non convertito.');
  process.exit(1);
}

// ES256 vuole la firma in formato grezzo r||s, non DER: senza dsaEncoding
// Node produce DER e Apple risponde "invalid_client" senza spiegare altro.
const firma = sign('sha256', Buffer.from(`${testa}.${corpo}`), {
  key: chiave,
  dsaEncoding: 'ieee-p1363'
}).toString('base64url');

console.log('\n--- client secret (incollalo in Supabase) ---\n');
console.log(`${testa}.${corpo}.${firma}`);
console.log(`\nScade il ${new Date(scadenza * 1000).toLocaleDateString('it-IT', {
  day: 'numeric', month: 'long', year: 'numeric'
})} — segnatelo, dopo l'accesso con Apple smette di funzionare.\n`);
