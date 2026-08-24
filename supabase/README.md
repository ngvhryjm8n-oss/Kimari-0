# Schema del database — da esportare

**Stato: vuoto. Questo è il buco più grosso del progetto.**

Tutto il modello di sicurezza di Kimari vive nel database, non qui:

- le policy RLS (sola lettura, participant-scoped);
- le funzioni `security definer` che sono l'**unica** via di scrittura;
- le viste `v_candidate_results` e `v_missing_voters`.

Il client (`index.html`) non contiene nessun controllo di accesso: si fida
interamente di queste. Finché il loro sorgente esiste solo dentro il progetto
Supabase `fnafzokgkbhhjircrogy`:

- nessuno può rileggere le policy per verificare che siano giuste;
- una modifica fatta a mano dalla dashboard non lascia traccia;
- se il progetto viene perso, sospeso o riconfigurato, **non è ricostruibile**.

Le migrazioni 0001 e 0002 risultano applicate, ma il loro SQL non è in nessun
file versionato.

## Come esportarlo

Serve la password del database (Supabase → Project Settings → Database).
Da fare una volta, poi il file va committato.

```bash
npx supabase db dump --db-url "postgresql://postgres:PASSWORD@db.fnafzokgkbhhjircrogy.supabase.co:5432/postgres" -f supabase/migrations/0001_schema.sql
```

Se preferisci `pg_dump` diretto (stesso risultato, senza la CLI):

```bash
pg_dump --schema-only --no-owner --no-privileges --schema=public "postgresql://postgres:PASSWORD@db.fnafzokgkbhhjircrogy.supabase.co:5432/postgres" > supabase/migrations/0001_schema.sql
```

**La password non va messa in un file del repo, in un alias di shell, né incollata
in chat.** Passala inline nel comando ed esporta subito dopo.

## Dopo l'export

1. Apri il file e verifica che ci sia tutto quello elencato in
   [CONTRATTO.md](CONTRATTO.md) — è la lista di ciò che `index.html` usa davvero.
2. Controlla che **non** compaiano policy di `INSERT`/`UPDATE`/`DELETE`:
   l'architettura dichiarata è sola lettura + scritture solo via RPC.
3. Controlla che ogni funzione elencata sia `SECURITY DEFINER` e abbia
   `search_path` fissato (`SET search_path = public, pg_temp`): una
   `security definer` senza `search_path` è una scalata di privilegi.
4. Committa. Da lì in poi ogni cambio allo schema diventa un file `0002_`, `0003_`…
   invece di una modifica invisibile fatta dalla dashboard.
