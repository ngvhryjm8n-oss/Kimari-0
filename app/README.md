# app/ — l'app nativa

Progetto separato dal sito. Il sito (`../index.html`) resta un file solo,
trascinabile ovunque: è quello che rende i link `?t=` apribili senza installare
niente. Qui invece il build step è ammesso, perché push, login Google nativo e
deep link non si fanno altrimenti. Vedi `../PIANO_V1.md`.

## Cosa c'è, e cosa manca

| | |
|---|---|
| `map.js` | traduce le righe del database nelle forme che le viste del prototipo già leggono. Funzioni pure, nessun I/O |
| `data.js` | l'unico punto che parla con Supabase: `loadState()` più un'azione per ogni RPC |
| `test/` | 13 prove sulla traduzione, 29 sul contratto dei parametri RPC |
| **manca** | l'interfaccia: le 16 viste e i 20 sheet del prototipo, da staccare dal suo stato in memoria e attaccare a `loadState()` |

## Perché è diviso così

Il prototipo (`kimari_app_prototipo.html`, fuori dal repo) tiene tutto in un
oggetto `state` in memoria che si azzera a ogni ricarica. Le sue viste sono già
scritte e funzionano: leggono `state.plans`, `state.groups`, `state.people`.

Quindi `loadState()` non inventa una forma nuova — **ricostruisce esattamente
quella**, dalle righe vere. Se la traduzione è fedele, le viste vengono dietro
senza essere riscritte. È il motivo per cui `map.js` è tutto funzioni pure e ha
tredici prove addosso: è il pezzo su cui poggia tutto il resto.

Le traduzioni che è facile sbagliare, e che i test presidiano:

- `starts_at` / `all_day` → `start` / `allDay` (`fmtWhen()` legge quelli)
- `place_name` / `place_address` → `name` / `address` (`candText()` legge `name`)
- `label` → `name` per le opzioni delle domande extra
- lo stato `approved` delle proposte → `ready`, che è come lo chiama il prototipo
- le schede di voto, che nel database stanno sparse fra `ballots`, `approvals`
  ed `extra_approvals` e vanno ricomposte in `ballots[actorId][campo]`
- gli importi restano **centesimi interi**: `balances()` lavora su interi

## Le due regole ereditate da V0

1. Si **legge** dalle tabelle e decide la RLS; si **scrive** solo via RPC.
   Nessuna insert, update o delete diretta. Mai.
2. Gli errori mostrano il dettaglio vero di Supabase. In `data.js` ogni chiamata
   passa da un wrapper che lo garantisce: un errore non diventa mai un `null`
   silenzioso più avanti nel codice.

## Prove

```bash
npm test
```

`test:map` non tocca né rete né database. `test:rpc` confronta i nomi dei
parametri passati da `data.js` con le funzioni definite nelle migrazioni: oggi
29 combaciano e 12 non sono verificabili perché definite in 0001/0002, che nel
repo non ci sono ancora.
