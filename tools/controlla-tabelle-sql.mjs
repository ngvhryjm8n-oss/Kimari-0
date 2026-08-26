// Verifica che ogni tabella nominata in un file .sql esista DAVVERO.
//
// Il 26/8/2026 pulizia_prove.sql si è fermato su
//     relation "public.group_invites" does not exist
// perché il nome vero è group_invite_links. L'avevo scritto a memoria.
//
// Postgres si ferma alla prima istruzione sbagliata: tutto quello che veniva
// dopo — la maggior parte del file — non è stato eseguito. Un nome sbagliato a
// metà di uno script di cancellazione non è un refuso, è metà lavoro non fatto.
//
// Non basta guardare le migrazioni nel repo: le tabelle della 0001 sono in
// produzione ma quel file non c'è. L'unica fonte che non mente è il database.
//
//   node tools/controlla-tabelle-sql.mjs supabase/tools/pulizia_prove.sql
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const URL_SB = 'https://fnafzokgkbhhjircrogy.supabase.co';
const CHIAVE = 'sb_publishable_f-CLx2j5Ht-ydkoh7iC-qQ_iacbBYW_';

const file = process.argv[2] || join('supabase', 'tools', 'pulizia_prove.sql');
const sql = readFileSync(join(root, file), 'utf8');

// Via i commenti: dentro ci sono nomi di tabelle citati a parole, e segnalarli
// riempirebbe l'elenco di falsi allarmi.
const pulito = sql.replace(/--[^\n]*/g, ' ').replace(/\/\*[\s\S]*?\*\//g, ' ');

// Una migrazione crea le tabelle che poi usa — e le migrazioni precedenti ne
// hanno create altre che questa usa a sua volta. Segnalarle come inesistenti
// è gridare al lupo, e un controllo che grida al lupo viene ignorato: è
// successo oggi con questo stesso strumento sulla 0017 e sulla 0019.
//
// Ma questo sconto vale SOLO per i file che stanno in supabase/migrations.
// Il 27/8/2026 lo strumento, lanciato su pulizia_prove.sql, controllava 10
// tabelle su 19: il confronto "migrazioni fino a questa" era alfabetico, e
// '0021_...' < 'pulizia_prove.sql', quindi OGNI tabella nata in una migrazione
// del repo veniva saltata. Proprio il difetto che pulizia_prove.sql descrive
// al suo fondo: un controllo che guarda meno di quello che il file cancella.
const nascono = new Set();
const dir = join(root, 'supabase', 'migrations');
const eMigrazione = /[\\/]migrations[\\/][^\\/]+$/.test(join(root, file));
if (eMigrazione) try {
  const qui = file.split(/[\\/]/).pop();
  for (const f of readdirSync(dir).sort()) {
    // Solo le migrazioni FINO a questa: se una tabella nasce dopo, usarla
    // prima è un errore vero e va detto.
    if (f > qui) break;
    for (const m of readFileSync(join(dir, f), 'utf8')
           .matchAll(/create table (?:if not exists )?public\.([a-z_][a-z0-9_]*)/gi)) {
      nascono.add(m[1].toLowerCase());
    }
  }
} catch { /* senza la cartella delle migrazioni non c'è niente da sapere */ }

const nomi = [...new Set(
  [...pulito.matchAll(/\b(?:from|into|update|join)\s+public\.([a-z_][a-z0-9_]*)/gi)]
    .map(m => m[1].toLowerCase())
)].filter(t => !nascono.has(t)).sort();

console.log('\n' + file + ': ' + nomi.length + ' tabelle nominate\n');

let mancanti = 0;
for (const t of nomi) {
  let stato;
  try {
    const r = await fetch(URL_SB + '/rest/v1/' + t + '?select=count', {
      headers: { apikey: CHIAVE }, signal: AbortSignal.timeout(15000)
    });
    stato = r.status;
  } catch { stato = 0; }

  // 200 = esiste e si può leggere. 401/403 = esiste, ma la RLS la nasconde:
  // va bene lo stesso, la domanda qui è solo se il nome è giusto.
  if (stato === 200 || stato === 401 || stato === 403) {
    console.log('  ok   ' + t);
  } else if (stato === 404) {
    console.log('  NON ESISTE  ' + t);
    mancanti++;
  } else {
    console.log('  ?    ' + t + ' (risposta ' + stato + ': non so dire)');
  }
}

console.log('\n' + (mancanti ? mancanti + ' nomi sbagliati: lo script si fermerebbe lì'
                             : 'tutti i nomi esistono') + '\n');
process.exit(mancanti ? 1 : 0);
