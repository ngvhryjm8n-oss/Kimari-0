# schema/ — quello che c'era già

Non sono migrazioni da applicare: è il sorgente **estratto dal database di
produzione** il 24 agosto 2026 con `../tools/dump_schema.sql`. Prima esisteva
solo dentro Supabase.

| File | Contenuto |
|---|---|
| `funzioni_v0_ESTRATTE_non_applicare.sql` | tutte le funzioni di V0, verbatim |

Serve a due cose concrete: poter **rileggere e rivedere** il codice che regge la
sicurezza, e far verificare a `npm run test:rpc` anche le RPC di V0 — che prima
il controllo saltava, perché non aveva le firme da confrontare.

**Se le cambi dalla dashboard, riesporta e aggiorna questo file**, altrimenti
torna a divergere e il controllo di contratto mente.

Manca ancora: tabelle, policy, vincoli e indici. Le query per tirarli fuori sono
in `../tools/dump_schema.sql` (numeri 2-5).
