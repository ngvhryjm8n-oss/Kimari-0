// genera-legale.mjs — da PRIVACY.md e TERMINI.md alle pagine pubblicate.
//
//   node tools/genera-legale.mjs
//
// I .md restano la sorgente: si modificano quelli e si rigenera. Le pagine
// sono autosufficienti — nessun font esterno, nessuno script, nessuna
// richiesta di rete — perché una pagina legale deve aprirsi sempre, anche
// dietro a un blocco pubblicitario o su una connessione pessima.
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

const CSS = `:root{--bg:#F2F2F7;--card:#fff;--fg:#000;--sub:#6B6B70;--line:#E5E5EA;--blue:#007AFF}
@media (prefers-color-scheme:dark){:root{--bg:#000;--card:#1C1C1E;--fg:#fff;--sub:#98989D;--line:#38383A}}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--fg);font:16px/1.6 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;padding:24px 16px 64px}
main{max-width:680px;margin:0 auto;background:var(--card);border-radius:16px;padding:28px 24px}
h1{font-size:26px;margin:0 0 4px}
h2{font-size:19px;margin:30px 0 10px;border-top:1px solid var(--line);padding-top:22px}
h2:first-of-type{border-top:0;padding-top:0;margin-top:24px}
p{margin:0 0 14px}ul{margin:0 0 14px;padding-left:22px}li{margin:0 0 8px}
.sub{color:var(--sub);font-size:14px;margin:0 0 20px}
a{color:var(--blue)}
em.todo{background:#FFD60A33;color:var(--sub);font-style:normal;padding:1px 7px;border-radius:5px;font-size:14px}
.nota{background:var(--bg);border-radius:10px;padding:14px 16px;font-size:14px;color:var(--sub);margin:0 0 8px}
footer{max-width:680px;margin:20px auto 0;text-align:center;font-size:14px;color:var(--sub)}`;

const esc = t => t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function inline(t) {
  return esc(t)
    // I segnaposto si sostituiscono DOPO esc(), altrimenti il tag che
    // inseriamo viene sfuggito e finisce a schermo come testo.
    .replace(/`?\[SOLO VINCENZO:[^\]]*\]`?/g, '<em class="todo">da completare</em>')
    .replace(/\*\*(.+?)\*\*/g, '<b>$1</b>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\[([^\]]+)\]\(PRIVACY\.md\)/g, '<a href="./privacy.html">$1</a>')
    .replace(/\[([^\]]+)\]\(TERMINI\.md\)/g, '<a href="./termini.html">$1</a>')
    .replace(/\[([^\]]+)\]\((https?:[^)]+)\)/g, '<a href="$2" rel="noopener">$1</a>');
}

function corpo(md) {
  let testo = readFileSync(join(root, md), 'utf8');
  testo = testo.split('Ultimo aggiornamento')[1].split('\n').slice(1).join('\n');

  const out = [];
  // Un blocco = testo fra due righe vuote. Unire le righe DENTRO un blocco è
  // giusto (sono a capo del markdown); unire due blocchi no, sono paragrafi
  // distinti.
  for (const blocco of testo.split(/\n\s*\n/)) {
    let righe = blocco.split('\n').map(r => r.trimEnd())
      .filter(r => r.trim() && !r.startsWith('> ') && !r.startsWith('---'));
    if (!righe.length) continue;

    if (righe[0].startsWith('## ')) {
      out.push('<h2>' + inline(righe[0].slice(3)) + '</h2>');
      righe = righe.slice(1);
      if (!righe.length) continue;
    }
    if (righe[0].startsWith('#')) continue;

    // Un blocco può essere misto: una riga di introduzione e poi l'elenco.
    // Trattarlo tutto come paragrafo appiattirebbe le voci in una frase sola
    // separata da trattini.
    const primaVoce = righe.findIndex(r => r.startsWith('- '));

    if (primaVoce !== 0) {
      const testa = (primaVoce === -1 ? righe : righe.slice(0, primaVoce));
      out.push('<p>' + inline(testa.map(r => r.trim()).join(' ')) + '</p>');
    }
    if (primaVoce !== -1) {
      const voci = [];
      for (const r of righe.slice(primaVoce)) {
        if (r.startsWith('- ')) voci.push(r.slice(2));
        else if (voci.length) voci[voci.length - 1] += ' ' + r.trim();
      }
      out.push('<ul>' + voci.map(v => '<li>' + inline(v) + '</li>').join('') + '</ul>');
    }
  }
  return out.join('\n');
}

const PAGINE = [
  { file: 'privacy.html', titolo: 'Informativa privacy', md: 'PRIVACY.md',
    altro: 'termini.html', altroT: 'Termini di servizio' },
  { file: 'termini.html', titolo: 'Termini di servizio', md: 'TERMINI.md',
    altro: 'privacy.html', altroT: 'Informativa privacy' }
];

const data = new Date().toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' });

for (const p of PAGINE) {
  const html = `<!doctype html>
<html lang="it">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="referrer" content="no-referrer">
<title>${p.titolo} — Kimari</title>
<style>
${CSS}
</style>
</head>
<body>
<main>
<h1>${p.titolo}</h1>
<p class="sub">Kimari · ultimo aggiornamento ${data}</p>
<p class="nota"><b>Bozza in revisione.</b> Il testo definitivo è in preparazione con un legale. Nel frattempo questa pagina descrive onestamente come funziona il servizio.</p>
${corpo(p.md)}
</main>
<footer><a href="./${p.altro}">${p.altroT}</a> · <a href="./">Kimari</a></footer>
</body>
</html>
`;
  writeFileSync(join(root, p.file), html);
  const daFare = (html.match(/class="todo"/g) || []).length;
  console.log(`  ${p.file}  ${String(html.length).padStart(5)} byte` +
              (daFare ? `  · ${daFare} da completare` : '  · completa'));
}
