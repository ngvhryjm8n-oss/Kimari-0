// index.html importa live.js. Se l'import non porta una versione, dopo una
// pubblicazione il browser tiene il live.js vecchio fino a 10 minuti e si
// ritrova l'HTML nuovo con la logica vecchia: uno stato ibrido che non esiste
// in nessun commit e che è impossibile da diagnosticare guardando il codice.
//
// Questo copia la VERSIONE di live.js nell'import.  npm run timbra
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const v = readFileSync(join(root, 'app', 'live.js'), 'utf8')
            .match(/VERSIONE = '([^']*)'/)?.[1];
if (!v) { console.error('live.js non ha una VERSIONE'); process.exit(1); }

const p = join(root, 'app', 'index.html');
const prima = readFileSync(p, 'utf8');
const dopo = prima.replace(/src="\.\/live\.js(\?v=[^"]*)?"/,
                           `src="./live.js?v=${encodeURIComponent(v)}"`);
if (prima === dopo) { console.log('già timbrato: ' + v); process.exit(0); }
writeFileSync(p, dopo);
console.log('timbrato: ' + v);
