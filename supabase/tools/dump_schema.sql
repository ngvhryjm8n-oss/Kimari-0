-- dump_schema.sql — esporta lo schema senza Docker e senza pg_dump.
--
-- `supabase db dump` gira il dump dentro un container, quindi pretende Docker
-- Desktop. Questo no: è una query normale che ricostruisce il DDL usando le
-- funzioni di Postgres (pg_get_functiondef, pg_get_viewdef,
-- pg_get_constraintdef) e il catalogo.
--
-- COME SI USA
--   1. incolla tutto nel SQL Editor di Supabase e lancia;
--   2. clicca "Download CSV" sul risultato;
--   3. salva il file in D:\Kimari\Kimari-0\supabase\
--
-- Il risultato ha tre colonne: ord (ordinamento), oggetto, ddl.
-- Non modifica niente: sono solo select sul catalogo.

with

/* ---------------------------------------------------- 1. tabelle */
colonne as (
  select c.relname as tab,
         string_agg(
           '  ' || a.attname || ' ' || pg_catalog.format_type(a.atttypid, a.atttypmod)
           || case when a.attnotnull then ' not null' else '' end
           || coalesce(' default ' || pg_get_expr(d.adbin, d.adrelid), ''),
           E',\n' order by a.attnum) as cols
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    join pg_attribute a on a.attrelid = c.oid and a.attnum > 0 and not a.attisdropped
    left join pg_attrdef d on d.adrelid = c.oid and d.adnum = a.attnum
   where n.nspname = 'public' and c.relkind = 'r'
   group by c.relname
),
vincoli as (
  select cl.relname as tab,
         string_agg('alter table public.' || cl.relname || ' add constraint '
                    || co.conname || ' ' || pg_get_constraintdef(co.oid) || ';',
                    E'\n' order by co.conname) as defs
    from pg_constraint co
    join pg_class cl on cl.oid = co.conrelid
    join pg_namespace n on n.oid = cl.relnamespace
   where n.nspname = 'public'
   group by cl.relname
),
tabelle as (
  select 1 as ord, 'tabella: ' || c.tab as oggetto,
         'create table public.' || c.tab || E' (\n' || c.cols || E'\n);'
         || coalesce(E'\n' || v.defs, '')
         || case when cl.relrowsecurity
                 then E'\nalter table public.' || c.tab || ' enable row level security;'
                 else E'\n-- ATTENZIONE: RLS NON attiva su ' || c.tab end as ddl
    from colonne c
    left join vincoli v on v.tab = c.tab
    join pg_class cl on cl.relname = c.tab
    join pg_namespace n on n.oid = cl.relnamespace and n.nspname = 'public'
),

/* ---------------------------------------------------- 2. indici */
indici as (
  select 2 as ord, 'indice: ' || indexname as oggetto, indexdef || ';' as ddl
    from pg_indexes where schemaname = 'public'
),

/* ---------------------------------------------------- 3. policy RLS */
policy as (
  select 3 as ord,
         'policy: ' || tablename || '.' || policyname as oggetto,
         'create policy ' || quote_ident(policyname) || ' on public.' || quote_ident(tablename)
         || case when permissive = 'PERMISSIVE' then '' else ' as restrictive' end
         || ' for ' || lower(cmd)
         || coalesce(' to ' || array_to_string(roles, ', '), '')
         || coalesce(E'\n  using (' || qual || ')', '')
         || coalesce(E'\n  with check (' || with_check || ')', '') || ';' as ddl
    from pg_policies where schemaname = 'public'
),

/* ---------------------------------------------------- 4. viste */
viste as (
  select 4 as ord, 'vista: ' || c.relname as oggetto,
         'create view public.' || c.relname
         || coalesce(' with (' || array_to_string(c.reloptions, ', ') || ')', '')
         || E' as\n' || pg_get_viewdef(c.oid, true) as ddl
    from pg_class c join pg_namespace n on n.oid = c.relnamespace
   where n.nspname = 'public' and c.relkind = 'v'
),

/* ------------------------------------- 5. funzioni: il pezzo che serve */
funzioni as (
  select 5 as ord,
         'funzione: ' || p.proname || '(' || pg_get_function_identity_arguments(p.oid) || ')' as oggetto,
         pg_get_functiondef(p.oid) || ';' as ddl
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
   where n.nspname = 'public' and p.prokind = 'f'
),

/* ---------------------------------------------------- 6. permessi */
permessi as (
  select 6 as ord,
         'grant: ' || table_name as oggetto,
         'grant ' || string_agg(distinct lower(privilege_type), ', ')
         || ' on public.' || table_name || ' to ' || grantee || ';' as ddl
    from information_schema.role_table_grants
   where table_schema = 'public' and grantee in ('anon', 'authenticated', 'service_role')
   group by table_name, grantee
)

select * from (
  select * from tabelle
  union all select * from indici
  union all select * from policy
  union all select * from viste
  union all select * from funzioni
  union all select * from permessi
) t
order by ord, oggetto;
