// P0.5 — prova sul campo che la RLS regga: un estraneo non deve leggere
// niente di nessuno.
//
// Non legge le policy (quelle dicono cosa DOVREBBE succedere): apre una
// sessione anonima nuova, che non partecipa a niente, e prova a leggere OGNI
// tabella che il client nomina. Una tabella che risponde con delle righe a
// uno che non c'entra niente e' una fuga di dati, e non la si vede leggendo
// il codice del client: il client semplicemente non prova.
//
//   node tools/controlla-rls.mjs
//
// Zero scritture: solo select. Puo' girare contro la produzione quando si
// vuole, e va rilanciato ogni volta che nasce una tabella (regola: ogni
// tabella nuova nasce con le sue policy — P0.5 della ROADMAP-V1).
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const URL_SB = 'https://fnafzokgkbhhjircrogy.supabase.co';
const CHIAVE = 'sb_publishable_f-CLx2j5Ht-ydkoh7iC-qQ_iacbBYW_';

// Le tabelle le si chiede al client, non a un elenco scritto a mano: cosi'
// una tabella nuova entra nel controllo da sola.
const src = readFileSync(join(root, 'app', 'data.js'), 'utf8');
const tabelle = [...new Set([...src.matchAll(/\.from\('([a-z_]+)'\)/g)].map(m => m[1]))].sort();

// Un estraneo vero: sessione anonima appena creata, che non ha votato niente,
// non e' in nessun gruppo, non conosce nessun token.
const r = await fetch(URL_SB + '/auth/v1/signup', {
  method: 'POST',
  headers: { apikey: CHIAVE, 'Content-Type': 'application/json' },
  body: JSON.stringify({ data: {} })
});
let token = null;
if (r.ok) token = (await r.json()).access_token;
if (!token) {
  const r2 = await fetch(URL_SB + '/auth/v1/token?grant_type=password', { method: 'POST' });
  console.log('non riesco ad aprire una sessione anonima (', r.status, '): provo da non autenticato\n');
}

const intestazioni = token
  ? { apikey: CHIAVE, Authorization: 'Bearer ' + token }
  : { apikey: CHIAVE };

console.log('\nRLS — cosa vede un estraneo appena arrivato\n');
console.log(token ? '(sessione anonima nuova)\n' : '(senza sessione)\n');

let fughe = 0, chiuse = 0, dubbie = 0;
for (const t of tabelle) {
  let stato, righe = null, errore = '';
  try {
    const res = await fetch(`${URL_SB}/rest/v1/${t}?select=*&limit=3`, {
      headers: intestazioni, signal: AbortSignal.timeout(15000)
    });
    stato = res.status;
    const corpo = await res.text();
    if (stato === 200) { try { righe = JSON.parse(corpo).length; } catch { righe = -1; } }
    else errore = corpo.slice(0, 90);
  } catch (e) { stato = 0; errore = String(e.message || e); }

  if (stato === 200 && righe === 0) { console.log('  ok        ' + t.padEnd(20) + 'nessuna riga'); chiuse++; }
  else if (stato === 401 || stato === 403) { console.log('  ok        ' + t.padEnd(20) + 'negata (' + stato + ')'); chiuse++; }
  else if (stato === 200 && righe > 0) {
    console.log('  FUGA      ' + t.padEnd(20) + righe + ' righe leggibili da un estraneo');
    fughe++;
  } else { console.log('  ?         ' + t.padEnd(20) + stato + ' ' + errore); dubbie++; }
}

console.log('\n' + chiuse + ' chiuse · ' + fughe + ' fughe · ' + dubbie + ' da guardare\n');
if (fughe) console.log('Una tabella leggibile da un estraneo va chiusa PRIMA di lanciare.\n');
process.exit(fughe ? 1 : 0);
