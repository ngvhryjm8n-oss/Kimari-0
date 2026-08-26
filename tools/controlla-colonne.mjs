// Verifica che ogni colonna che il client LEGGE esista davvero in produzione.
//
// Il 26/8/2026 ho pubblicato un client che leggeva actors.avatar_path prima
// che la migrazione 0018 fosse applicata. loadState e' fallita, e con lei
// l'avvio dell'app: schermo d'errore per tutti, finche' Vincenzo non ha
// applicato la migrazione.
//
// Le prove non potevano vederlo: girano contro un finto, e un finto risponde a
// qualunque colonna gli si chieda. L'unica fonte che non mente e' il database.
//
//   node tools/controlla-colonne.mjs
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const URL_SB = 'https://fnafzokgkbhhjircrogy.supabase.co';
const CHIAVE = 'sb_publishable_f-CLx2j5Ht-ydkoh7iC-qQ_iacbBYW_';

const BR = String.fromCharCode(10);

const src = readFileSync(join(root, 'app', 'data.js'), 'utf8');

// .from('tabella').select('a, b, c') — anche quando fra i due c'è dell'altro.
const letture = new Map();
for (const m of src.matchAll(/\.from\('([a-z_]+)'\)\s*\.select\(\s*'([^']*)'/g)) {
  const [, tabella, campi] = m;
  if (!letture.has(tabella)) letture.set(tabella, new Set());
  for (const c of campi.split(',').map(x => x.trim()).filter(Boolean)) {
    if (c === '*') continue;                       // * prende quello che c'è
    letture.get(tabella).add(c.split(':')[0].trim());
  }
}

// Colonne che possono mancare perché il client sa cavarsela senza. L'elenco è
// corto apposta, e ogni voce deve indicare il pezzo di codice che la regge: se
// la ricaduta sparisce, l'eccezione cade con lei. Senza questo controllo una
// riga qui dentro diventerebbe il modo comodo per far tacere lo strumento.
const RICADUTE = {
  'actors.avatar_path': /COLONNE_ATTORE = 'id, display_name'/,
  // Una TABELLA intera puo' mancare: e' il caso di una vista nuova che arriva
  // con una migrazione non ancora applicata.
  'persone_visibili': /ELENCO_NOMI = 'actors'/
};

console.log('\ncolonne che il client legge, contro il database vero\n');

let mancanti = 0;
let coperte = 0;
let irraggiungibili = 0;
for (const [tabella, campi] of [...letture].sort()) {
  // Una riga sola basta a farsi dire se le colonne esistono: se una manca,
  // PostgREST risponde 400 col nome di quella sbagliata.
  const q = [...campi].join(',');
  // Due tentativi. Un singhiozzo di rete faceva fallire piu' tabelle in una
  // volta sola, e lo strumento lo raccontava come "manca una colonna". Il
  // 27/8/2026 ha bloccato una pubblicazione dando la colpa al database, e due
  // secondi dopo passava tutto. Uno strumento che dice il falso e' peggio di
  // nessuno strumento, perche' gli si crede lo stesso.
  let stato = 0, messaggio = '';
  for (let tentativo = 0; tentativo < 2; tentativo++) {
    stato = 0; messaggio = '';
    try {
      const r = await fetch(`${URL_SB}/rest/v1/${tabella}?select=${encodeURIComponent(q)}&limit=1`,
        { headers: { apikey: CHIAVE }, signal: AbortSignal.timeout(15000) });
      stato = r.status;
      if (stato >= 400) messaggio = (await r.text()).slice(0, 120);
    } catch (e) { messaggio = String(e && e.message); }
    if (stato) break;                 // ha risposto: la risposta vale, giusta o storta
    await new Promise(f => setTimeout(f, 1500));
  }

  // Nessuna risposta non e' "la colonna non c'e'": e' "non ho potuto guardare".
  // Ferma comunque la pubblicazione, ma dicendo la cosa vera.
  if (!stato) {
    console.log('  ?    ' + tabella + '  non raggiunto: ' + messaggio);
    irraggiungibili++;
    continue;
  }

  if (stato === 200 || stato === 401 || stato === 403) {
    console.log('  ok   ' + tabella + ' (' + campi.size + ')');
    continue;
  }

  // Quale colonna — o quale tabella intera — manca, per cercarne la ricaduta.
  const quale = (messaggio.match(/column ([a-z_]+\.[a-z_]+) does not exist/) || [])[1]
             || (/PGRST205|Could not find the table/.test(messaggio) ? tabella : null);
  const ricaduta = quale && RICADUTE[quale];

  if (ricaduta && ricaduta.test(src)) {
    console.log('  ~    ' + tabella + ' → ' + quale + ' non c\'è ancora, ma il client regge');
    coperte++;
  } else if (ricaduta) {
    console.log('  NO   ' + tabella + ' → ' + quale + ': l\'eccezione c\'è ma LA RICADUTA NON PIÙ');
    mancanti++;
  } else {
    console.log('  NO   ' + tabella + ' → ' + messaggio);
    mancanti++;
  }
}

if (coperte) {
  console.log('\n' + coperte + ' lettura' + (coperte === 1 ? '' : 'e') +
    ' che il database rifiuta ma che il client gestisce.');
  console.log('Non blocca la pubblicazione. Sparisce quando la migrazione è applicata.');
}

if (irraggiungibili) {
  console.log(BR + irraggiungibili + ' tabelle non raggiunte: il database non ha risposto.');
  console.log('NON vuol dire che manchi una colonna. Riprova fra un minuto.' + BR);
  process.exit(2);
}

console.log('\n' + (mancanti
  ? mancanti + ' letture che romperebbero l\'avvio: NON pubblicare'
  : 'niente che possa rompere l\'avvio') + '\n');
process.exit(mancanti ? 1 : 0);
