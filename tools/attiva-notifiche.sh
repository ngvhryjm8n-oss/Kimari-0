#!/usr/bin/env bash
# Distribuisce la parte server delle notifiche.
#
# La chiave privata VAPID non viene mai stampata: si legge dal file in
# D:\Kimari\segreti\ e si passa direttamente a Supabase. Chi ce l'ha può
# mandare notifiche a nome di Kimari, quindi non deve finire in una chat, in un
# log, né nella cronologia dei comandi.
#
#   bash tools/attiva-notifiche.sh
#
# Prima serve essere entrati una volta sola:
#   npx supabase login

set -uo pipefail

PROGETTO="fnafzokgkbhhjircrogy"
SEGRETI="/d/Kimari/segreti/vapid.txt"

if [ ! -f "$SEGRETI" ]; then
  echo "Non trovo $SEGRETI — le chiavi VAPID sono state generate il 26/8/2026." >&2
  exit 1
fi

PUB="$(awk '/^PUBBLICA/ {print $2}' "$SEGRETI")"
PRI="$(awk '/^PRIVATA/  {print $2}' "$SEGRETI")"

if [ -z "$PUB" ] || [ -z "$PRI" ]; then
  echo "Il file dei segreti non ha il formato atteso (PUBBLICA / PRIVATA)." >&2
  exit 1
fi

# Un controllo prima di spedire: se la pubblica nel file non è quella dentro
# l'app, le notifiche partirebbero firmate con una chiave che i telefoni non
# riconoscono — e fallirebbero tutte, in silenzio, senza un errore visibile.
NELL_APP="$(grep -o "const VAPID = '[^']*'" app/data.js | sed "s/const VAPID = '//;s/'//")"
if [ "$PUB" != "$NELL_APP" ]; then
  echo "FERMO: la chiave pubblica nel file non è quella dentro app/data.js." >&2
  echo "Le notifiche partirebbero firmate con una chiave che i telefoni rifiutano," >&2
  echo "e fallirebbero tutte senza dire perché." >&2
  exit 1
fi
echo "✓ la chiave pubblica nel file e quella nell'app combaciano"

echo
echo "1/2 · metto i segreti su Supabase…"
npx --yes supabase secrets set \
  VAPID_PUBBLICA="$PUB" \
  VAPID_PRIVATA="$PRI" \
  VAPID_CONTATTO="mailto:kimariapp@gmail.com" \
  --project-ref "$PROGETTO" || { echo "non riuscito" >&2; exit 1; }

echo
echo "2/2 · distribuisco la funzione che consegna…"
npx --yes supabase functions deploy svuota-coda \
  --project-ref "$PROGETTO" --no-verify-jwt || { echo "non riuscito" >&2; exit 1; }

cat <<'FINE'

Fatto. Resta un passo solo, da fare nel SQL Editor di Supabase — una volta
sola. Serve a far girare la consegna ogni minuto:

  create extension if not exists pg_cron;
  create extension if not exists pg_net;

  -- La chiave di servizio come impostazione del database, NON dentro il
  -- comando di cron: li' finirebbe in chiaro in una tabella leggibile da
  -- chiunque abbia accesso al database.
  alter database postgres set app.chiave_servizio = 'INCOLLA-QUI-LA-SERVICE-ROLE';

  select cron.schedule('kimari-notifiche', '* * * * *', $$
    select net.http_post(
      url     := 'https://fnafzokgkbhhjircrogy.supabase.co/functions/v1/svuota-coda',
      headers := jsonb_build_object(
                   'Content-Type', 'application/json',
                   'Authorization', 'Bearer ' || current_setting('app.chiave_servizio', true))
    );
  $$);

La chiave service_role sta in Supabase → Project Settings → API → service_role.
NON va mai nel repo e mai in una chat: chi ce l'ha puo' leggere e scrivere
tutto, scavalcando ogni permesso.

Per verificare che giri:
  select * from cron.job_run_details order by start_time desc limit 5;
FINE
