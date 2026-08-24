// Confronta le chiamate RPC di data.js con le funzioni davvero definite nelle
// migrazioni. Un parametro scritto male (p_group invece di p_group_id) non lo
// vede né il parser SQL né il controllo di sintassi JS: salta fuori a runtime,
// addosso all'utente. Qui salta fuori adesso.
//
//   node app/test/rpc-contract.test.mjs
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

/* ---------- le funzioni definite nelle migrazioni ---------- */
function sqlFunctions() {
  // migrations/ = quello che ho scritto io; schema/ = V0, estratto dal
  // database di produzione. Servono entrambi per coprire tutte le RPC.
  const dirs = [join(root, 'supabase', 'migrations'), join(root, 'supabase', 'schema')];
  const out = new Map();
  for (const dir of dirs)
  for (const f of readdirSync(dir).filter(n => n.endsWith('.sql'))) {
    const sql = readFileSync(join(dir, f), 'utf8');
    const re = /create\s+(?:or\s+replace\s+)?function\s+public\.(\w+)\s*\(([\s\S]*?)\)\s*\r?\n\s*returns/gi;
    let m;
    while ((m = re.exec(sql))) {
      const params = [...m[2].matchAll(/\b(p_\w+)\s+/g)].map(x => x[1]);
      out.set(m[1], { params: new Set(params), file: f });
    }
  }
  return out;
}

/* ---------- le chiamate presenti in data.js ---------- */
function rpcCalls() {
  const src = readFileSync(join(root, 'app', 'data.js'), 'utf8');
  const calls = [];
  const re = /rpc\(\s*'(\w+)'\s*(,)?/g;
  let m;
  while ((m = re.exec(src))) {
    const name = m[1];
    if (!m[2]) { calls.push({ name, args: [] }); continue; }
    // scorre fino alla graffa chiusa corrispondente
    let i = src.indexOf('{', re.lastIndex);
    const close = src.indexOf(')', re.lastIndex);
    if (i === -1 || (close !== -1 && close < i)) { calls.push({ name, args: [] }); continue; }
    let depth = 0, end = i;
    for (; end < src.length; end++) {
      if (src[end] === '{') depth++;
      else if (src[end] === '}') { depth--; if (!depth) break; }
    }
    const body = src.slice(i + 1, end);
    calls.push({ name, args: [...body.matchAll(/(?:^|[{,\s])(p_\w+)\s*:/g)].map(x => x[1]) });
  }
  return calls;
}

/* ------------------------------------------------------------------ */
console.log('\ndata.js ↔ migrazioni — i nomi dei parametri combaciano?\n');

const defined = sqlFunctions();
const calls = rpcCalls();
let passed = 0, failed = 0, skipped = [];

for (const call of calls) {
  const def = defined.get(call.name);
  if (!def) {
    // Non dovrebbe più capitare: dopo l'export del 24/8/2026 ci sono tutte.
    if (!skipped.includes(call.name)) skipped.push(call.name);
    continue;
  }
  try {
    const extra = call.args.filter(a => !def.params.has(a));
    assert.deepEqual(extra, [],
      `${call.name}(): ${extra.join(', ')} non esiste in ${def.file}. ` +
      `Accetta: ${[...def.params].join(', ') || '(nessun parametro)'}`);
    passed++;
    console.log(`  ok   ${call.name}(${call.args.join(', ')})`);
  } catch (e) {
    failed++;
    console.log(`  FAIL ${e.message}`);
  }
}

console.log('');
if (skipped.length) {
  console.log(`  ${skipped.length} non verificabili, definite in 0001/0002 che non sono nel repo:`);
  console.log('    ' + skipped.join(', '));
  console.log('    (si potranno controllare dopo l\'export dello schema)');
}

// Il senso inverso: funzioni scritte in SQL che nessuno chiama ancora.
const chiamate = new Set(calls.map(c => c.name));
const mai = [...defined.keys()].filter(n => !chiamate.has(n) && !n.startsWith('kimari_'));
if (mai.length) {
  console.log(`\n  scritte in SQL ma non ancora usate dal client: ${mai.join(', ')}`);
}

console.log(`\n${passed} passati, ${failed} falliti\n`);
process.exit(failed ? 1 : 0);
