// index.html importa live.js, che importa data.js, che importa map.js. Il
// browser mette in cache ogni file per conto suo: senza una versione
// nell'URL può abbinare un live.js nuovo a un map.js vecchio. È successo il
// 26/8/2026 e mi ha fatto credere due volte che una correzione non fosse
// partita — mentre era pubblicata e funzionante.
//
// Quindi la versione va messa su TUTTA la catena, non solo sull'ingresso.
//   npm run timbra
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const v = readFileSync(join(root, 'app', 'live.js'), 'utf8')
            .match(/VERSIONE = '([^']*)'/)?.[1];
if (!v) { console.error('live.js non ha una VERSIONE'); process.exit(1); }
const q = encodeURIComponent(v);

// Node accetta il ?v= negli import di file, quindi le prove girano uguale.
const moduli = ['live.js', 'data.js'];
let toccati = [];

for (const f of moduli) {
  const p = join(root, 'app', f);
  const prima = readFileSync(p, 'utf8');
  const dopo = prima.replace(/(from '\.\/[a-z]+\.js)(\?v=[^']*)?'/g, `$1?v=${q}'`);
  if (prima !== dopo) { writeFileSync(p, dopo); toccati.push(f); }
}

const p = join(root, 'app', 'index.html');
const prima = readFileSync(p, 'utf8');
const dopo = prima.replace(/src="\.\/live\.js(\?v=[^"]*)?"/, `src="./live.js?v=${q}"`);
if (prima !== dopo) { writeFileSync(p, dopo); toccati.push('index.html'); }

console.log(toccati.length ? `timbrato ${v}: ${toccati.join(', ')}` : `già timbrato: ${v}`);
