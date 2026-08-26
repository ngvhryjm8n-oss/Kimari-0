#!/usr/bin/env bash
# Porta su main TUTTO quello che il sito e l'app servono.
#
# Perché uno script e non tre comandi a mano: pubblicando a mano si copia il
# sottoinsieme dei file che si è appena toccati, e prima o poi ne manca uno.
# È successo il 26/8/2026 — index.html nuovo con live.js vecchio, online per
# ore. Il numero di versione a schermo diceva 16:04 mentre il file accanto
# diceva 16:28, e la marcatura di versione, che serve proprio a smascherare
# queste cose, non poteva funzionare: sta dentro il file che non era stato
# copiato.
#
#   bash tools/pubblica-su-main.sh "messaggio del commit"

set -euo pipefail

MESSAGGIO="${1:-Aggiornamento}"
RAMO="$(git rev-parse --abbrev-ref HEAD)"

if [ "$RAMO" = "main" ]; then
  echo "Sei già su main: questo script serve a portarci il lavoro da un altro ramo." >&2
  exit 1
fi

# Tutto ciò che finisce servito. Se si aggiunge un file all'app, va aggiunto qui.
FILE=(index.html app/index.html app/live.js app/data.js app/map.js
      i18n/dizionario.js manifest.json app/manifest.json)

echo "Prove prima di pubblicare…"
npm test >/dev/null

echo "Impronta di ciò che sto per pubblicare:"
ESISTENTI=()
for f in "${FILE[@]}"; do
  [ -f "$f" ] && ESISTENTI+=("$f")
done
for f in "${ESISTENTI[@]}"; do
  printf '  %-22s %s\n' "$f" "$(git hash-object "$f" | cut -c1-8)"
done

git checkout --quiet main
git checkout "$RAMO" -- "${ESISTENTI[@]}"

# Il controllo che avrebbe evitato il pasticcio: la versione dentro live.js
# deve combaciare con quella che index.html chiede nell'import.
V_LIVE="$(grep -o "VERSIONE = '[^']*'" app/live.js | sed "s/VERSIONE = '//;s/'//")"
V_HTML="$(grep -o 'live\.js?v=[^"]*' app/index.html | head -1 | sed 's/live\.js?v=//')"
V_HTML="$(printf '%b' "${V_HTML//%/\\x}")"
if [ "$V_LIVE" != "$V_HTML" ]; then
  echo "FERMO: index.html chiede live.js '$V_HTML' ma il file dice '$V_LIVE'." >&2
  echo "Gira 'npm run timbra' sul ramo di lavoro e ripubblica." >&2
  git checkout --quiet "$RAMO"
  exit 1
fi

if git diff --cached --quiet && git diff --quiet; then
  echo "Niente da pubblicare: main ha già questi file."
  git checkout --quiet "$RAMO"
  exit 0
fi

git add "${ESISTENTI[@]}"
git commit --quiet -m "$MESSAGGIO"
GIT_TERMINAL_PROMPT=0 git push origin main
git checkout --quiet "$RAMO"
echo "Pubblicato: $V_LIVE"
