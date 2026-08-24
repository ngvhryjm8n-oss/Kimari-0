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

---

## Applicare le migrazioni nuove

`0003`, `0004` e `0005` sono scritte ma **mai eseguite**: qui non c'è nessun
Postgres. Sono validate solo col parser (il DDL esterno), non nei corpi plpgsql.

**Fallo prima su un progetto Supabase di prova**, non su `fnafzokgkbhhjircrogy`.

Ordine, una alla volta, dal SQL Editor:

| | File | Cosa fa |
|---|---|---|
| 1 | `0003_groups.sql` | gruppi, membri, sezioni private, inviti di gruppo |
| 2 | `0004_account_deletion.sql` | `delete_my_account()` — richiesta da Apple |
| 3 | `0005_extras_comments_proposals.sql` | domande extra, commenti, proposte |
| 4 | `0006_media_expenses_places.sql` | media su Storage, spese e saldi, posti salvati |
| 5 | `0007_fix_plan_balances.sql` | correzione a `plan_balances()` di 0006 |

Ognuna gira in una transazione e comincia con un blocco di preflight: se
un'assunzione sullo schema non regge, **fallisce senza lasciare niente a metà**
e ti dice esattamente cosa non torna. Un errore lì non è un guasto: è la
migrazione che fa il suo lavoro. Copiami il messaggio e correggo.

Le cose che più probabilmente si lamenteranno per prime:

- `participants ha colonne obbligatorie che join_group non valorizza: …`
- `queste tabelle puntano ad actors e delete_my_account non le gestisce: …`
- `actors.auth_user_id è NOT NULL` oppure `ha ON DELETE CASCADE verso auth.users`

Dopo `0004`, il giro di prova da fare a mano è in fondo a quel file.

### Se il preflight di 0004 si lamenta di una tabella

Vuol dire che punta ad `actors` e `delete_my_account()` non la conosce. Invece
di scoprirle una alla volta, tirale fuori tutte:

```sql
select cl.relname as tabella, a.attname as colonna,
       case c.confdeltype when 'a' then 'no action' when 'r' then 'restrict'
                          when 'c' then 'cascade'   when 'n' then 'set null'
                          when 'd' then 'set default' end as on_delete
  from pg_constraint c
  join pg_class cl     on cl.oid = c.conrelid
  join pg_namespace n  on n.oid = cl.relnamespace
  join unnest(c.conkey) as k(attnum) on true
  join pg_attribute a  on a.attrelid = c.conrelid and a.attnum = k.attnum
 where c.contype = 'f'
   and c.confrelid = 'public.actors'::regclass
   and n.nspname = 'public'
 order by 1, 2;
```

Per ognuna la domanda è una sola: **è un dato personale di quella persona, o è
roba condivisa di cui lei è solo l'autore?**

- *Personale* (voti, preferenze, appartenenze, sue impostazioni) → si cancella.
- *Condivisa* (ha creato il piano, ha proposto un'opzione, ha creato il gruppo)
  → si tiene: l'anonimizzazione dell'actor la copre già, e cancellarla
  romperebbe i piani di chi resta.

**Ogni migrazione futura che aggiunge una tabella con una FK verso `actors` deve
aggiornare `delete_my_account()`.** 0005 lo fa in fondo al file: usalo da modello.

## Provare che funzionino

Le migrazioni si applicano senza errori anche se le funzioni dentro sbagliano:
il DDL è una cosa, i corpi plpgsql un'altra. Per quelli ci sono i test in
`supabase/tests/`, da incollare interi nel SQL Editor.

| File | Cosa prova |
|---|---|
| `smoke_0003_0005.sql` | gruppi, inviti, RLS, domande extra, commenti, cancellazione account — 13 controlli |
| `smoke_0006.sql` | media, spese, saldi, rimborsi, limiti, posti — 9 controlli |

**Finiscono di proposito con un errore rosso: quello è il resoconto.** L'editor
di Supabase non mostra i `RAISE NOTICE`, quindi il riepilogo arriva come
messaggio d'eccezione — che serve anche ad annullare la prova. Non lasciano
righe, si possono rilanciare quante volte si vuole.

Leggi il messaggio: ogni riga `ok` è un controllo passato, una riga `FALLITO`
dice cosa non va.
