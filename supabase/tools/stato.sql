-- stato.sql — cosa è già applicato e cosa no.
--
-- Da lanciare quando non si è sicuri a che punto si è. Non modifica niente.
-- Una istruzione sola, così l'editor la mostra senza storie.

select 'migrazione ' || m.nome as cosa,
       case when exists (
              select 1 from pg_proc p
                join pg_namespace n on n.oid = p.pronamespace
               where n.nspname = 'public' and p.proname = m.prova
            ) or exists (
              select 1 from pg_class c
                join pg_namespace n on n.oid = c.relnamespace
               where n.nspname = 'public' and c.relname = m.prova
            )
            then 'APPLICATA' else 'da applicare' end as stato,
       m.prova as si_riconosce_da
  from (values
    ('0003 gruppi',                'groups'),
    ('0004 cancellazione account', 'delete_my_account'),
    ('0005 domande/commenti/proposte', 'plan_extras'),
    ('0006 media/spese/posti',     'expenses'),
    ('0007 correzione saldi',      'plan_balances'),
    ('0008 domande a piano avviato', 'remove_plan_extra'),
    ('0009 finalize_plan',         'finalize_plan'),
    ('0010 creazione atomica',     'create_plan_full'),
    ('0011 ritardi/amici/resto',   'friendships'),
    ('0012 politica ingresso',     'set_join_policy')
  ) as m(nome, prova)

union all

-- 0013 non crea niente di nuovo: riscrive join_plan. Si riconosce da come
-- decide se un nome è rivendicabile.
select 'migrazione 0013 falla del claim' as cosa,
       case when exists (
         select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
          where n.nspname = 'public' and p.proname = 'join_plan'
            and pg_get_functiondef(p.oid) like '%auth_user_id is null) into v_libero%'
       ) then 'APPLICATA' else 'DA APPLICARE — falla aperta' end,
       'join_plan controlla v_libero'

union all

select 'dati di prova: piani', count(*)::text, 'titolo PROVA-CLAUDE%'
  from public.plans where title like 'PROVA-CLAUDE%'

union all

select 'dati di prova: profili', count(*)::text, 'nome PROVA%CLAUDE%'
  from public.actors where display_name like 'PROVA%CLAUDE%'

order by 1;
