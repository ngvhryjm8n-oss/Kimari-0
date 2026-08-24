-- dump_schema.sql — esporta lo schema senza Docker e senza pg_dump.
--
-- Sei query INDIPENDENTI. Lanciane UNA alla volta: seleziona il blocco e premi
-- Run (oppure incolla solo quello nell'editor). Non lanciarle tutte insieme.
--
-- Non modificano niente: sono solo select sul catalogo di Postgres, e non
-- serve la password del database perché il SQL Editor è già autenticato.
--
-- La più importante è la 1: senza le firme delle funzioni il controllo
-- `npm run test:rpc` non può verificare le 12 RPC di V0 che il client chiama.
-- Se hai poco tempo, lancia quella e basta.
--
-- Per ciascuna: Download CSV, e salva in D:\Kimari\Kimari-0\supabase\
-- con il nome indicato.


-- ============================================================ 1. FUNZIONI
-- salva come: schema_funzioni.csv
select p.proname || '(' || pg_get_function_identity_arguments(p.oid) || ')' as funzione,
       pg_get_functiondef(p.oid) as ddl
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
 where n.nspname = 'public'
 order by 1;


-- ============================================================== 2. POLICY
-- salva come: schema_policy.csv
select tablename, policyname, cmd, permissive,
       array_to_string(roles, ', ') as ruoli,
       qual       as using_clause,
       with_check as with_check_clause
  from pg_policies
 where schemaname = 'public'
 order by tablename, policyname;


-- ====================================================== 3. TABELLE E RLS
-- salva come: schema_tabelle.csv
-- rls_attiva = false su una tabella con dati personali è un problema.
select c.relname as tabella,
       c.relrowsecurity as rls_attiva,
       c.relforcerowsecurity as rls_forzata,
       (select count(*) from pg_policies pp
         where pp.schemaname = 'public' and pp.tablename = c.relname) as n_policy
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
 where n.nspname = 'public' and c.relkind = 'r'
 order by 1;


-- ============================================================= 4. COLONNE
-- salva come: schema_colonne.csv
select table_name  as tabella,
       column_name as colonna,
       data_type   as tipo,
       is_nullable as ammette_null,
       column_default as valore_predefinito
  from information_schema.columns
 where table_schema = 'public'
 order by table_name, ordinal_position;


-- ============================================================= 5. VINCOLI
-- salva come: schema_vincoli.csv
select cl.relname as tabella,
       co.conname as vincolo,
       pg_get_constraintdef(co.oid) as definizione
  from pg_constraint co
  join pg_class cl     on cl.oid = co.conrelid
  join pg_namespace n  on n.oid = cl.relnamespace
 where n.nspname = 'public'
 order by 1, 2;


-- =============================================================== 6. VISTE
-- salva come: schema_viste.csv
-- opzioni deve contenere security_invoker=true, altrimenti la vista
-- scavalca la RLS e mostra a chiunque i dati di tutti.
select c.relname as vista,
       array_to_string(c.reloptions, ', ') as opzioni,
       pg_get_viewdef(c.oid, true) as definizione
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
 where n.nspname = 'public' and c.relkind = 'v'
 order by 1;
