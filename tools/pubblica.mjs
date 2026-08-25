// Un gesto solo prima di pubblicare: alza la VERSIONE di live.js all'ora
// corrente e la ricopia nell'import di index.html.
//
// La versione serve a due cose diverse e serve che siano la stessa: si vede a
// schermo (così, guardando l'app, si distingue "il codice è vecchio" da "la
// cache è vecchia") e sta nell'URL del modulo (così il browser non può
// abbinare l'index nuovo al live.js vecchio).
//
//   npm run pubblica
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const p = join(root, 'app', 'live.js');
const d = new Date();
const due = n => String(n).padStart(2, '0');
const v = `${due(d.getDate())}/${due(d.getMonth() + 1)} ${due(d.getHours())}:${due(d.getMinutes())}`;

writeFileSync(p, readFileSync(p, 'utf8').replace(/VERSIONE = '[^']*'/, `VERSIONE = '${v}'`));
console.log('versione: ' + v);
execFileSync(process.execPath, [join(root, 'tools', 'timbra-versione.mjs')], { stdio: 'inherit' });
