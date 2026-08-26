#!/usr/bin/env bash
# Controlla, uno per uno, i pezzi che devono combaciare perché il dominio
# funzioni. Serve perché quando qualcosa non va il sintomo è sempre lo stesso —
# "non entra con Google" — e i punti che possono essere sbagliati sono quattro.
#
#   bash tools/controlla-dominio.sh kimariapp.com

set -uo pipefail
D="${1:-kimariapp.com}"
GH="185.199.108.153 185.199.109.153 185.199.110.153 185.199.111.153"
PAGES="ngvhryjm8n-oss.github.io"
VECCHIO="https://$PAGES/Kimari-0"

ok()   { printf '  \033[32m✓\033[0m %s\n' "$1"; }
no()   { printf '  \033[31m✗\033[0m %s\n' "$1"; PROBLEMI=$((PROBLEMI+1)); }
attesa(){ printf '  \033[33m·\033[0m %s\n' "$1"; }
PROBLEMI=0

echo
echo "1. DNS — i quattro indirizzi di GitHub"
# Solo la parte DOPO "Name:": prima di quella riga nslookup stampa l'indirizzo
# del server che sta interrogando, e prenderlo per una risposta fa segnalare un
# record sbagliato che non esiste. È successo al primo giro di questo script.
TROVATI="$(nslookup "$D" 8.8.8.8 2>/dev/null | sed -n '/^Name:/,$p' \
           | grep -oE '[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+' || true)"
if [ -z "$TROVATI" ]; then
  no "$D non risponde ancora"
else
  for ip in $GH; do
    echo "$TROVATI" | grep -q "$ip" && ok "$ip" || no "manca $ip"
  done
  for ip in $TROVATI; do
    echo "$GH" | grep -q "$ip" || attesa "c'è anche $ip, che non è di GitHub — va tolto"
  done
fi

echo
echo "2. Il sito risponde sul dominio nuovo"
C="$(curl -s -o /dev/null -w '%{http_code}' -m 15 "https://$D/" 2>/dev/null)"; C="${C:-000}"
case "$C" in
  200) ok "https://$D/ risponde 200" ;;
  000) no "https://$D/ non risponde (certificato non ancora emesso? si aspetta)" ;;
  *)   no "https://$D/ risponde $C" ;;
esac
C="$(curl -s -o /dev/null -w '%{http_code}' -m 15 "https://$D/app/" 2>/dev/null)"; C="${C:-000}"
[ "$C" = "200" ] && ok "https://$D/app/ risponde 200" || no "https://$D/app/ risponde $C"

echo
echo "3. HTTPS senza avvisi"
if curl -sI -m 15 "https://$D/" >/dev/null 2>&1; then ok "il certificato è valido"
else no "certificato non ancora pronto — GitHub ci mette da 10 minuti a 2 ore"; fi

echo
echo "4. I VECCHI LINK non si sono rotti"
# È la cosa che protegge chi ha già un invito in chat.
R="$(curl -s -o /dev/null -w '%{http_code} %{redirect_url}' -m 15 "$VECCHIO/" 2>/dev/null)"; R="${R:-000 -}"
CODICE="${R%% *}"; DOVE="${R##* }"
if [ "$CODICE" = "301" ] || [ "$CODICE" = "302" ]; then
  case "$DOVE" in
    *"$D"*) ok "il vecchio indirizzo rimanda a $D" ;;
    *)      no "rimanda a $DOVE, non a $D" ;;
  esac
elif [ "$CODICE" = "200" ]; then
  attesa "il vecchio indirizzo risponde ancora da sé (GitHub non ha ancora messo il rimando)"
else
  no "il vecchio indirizzo risponde $CODICE — CHI HA UN INVITO IN CHAT NON PUÒ PIÙ VOTARE"
fi

echo
echo "5. Il file CNAME nel repo"
if [ -f CNAME ]; then
  [ "$(cat CNAME)" = "$D" ] && ok "CNAME contiene $D" || no "CNAME contiene $(cat CNAME)"
else
  attesa "CNAME non c'è ancora — va aggiunto DOPO che il DNS risponde"
fi

echo
echo "Quello che questo script NON può controllare, e va provato a mano:"
echo "  · entrare con Google      (Supabase Redirect URLs + origini Google)"
echo "  · entrare con Apple       (Services ID → Domains)"
echo "  · aprire un link ?t= da una finestra in incognito"
echo "Sono i tre punti dove il sintomo è sempre 'non entra' e la causa è muta."
echo
[ "$PROBLEMI" -eq 0 ] && echo "Tutto a posto per la parte automatica." \
                      || echo "$PROBLEMI cose da sistemare."
echo
exit 0
