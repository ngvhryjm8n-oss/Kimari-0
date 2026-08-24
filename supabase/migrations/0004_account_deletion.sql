-- 0004_account_deletion.sql — Fase 0: cancellazione account dall'app.
--
-- Obbligatoria per pubblicare su App Store (linea guida 5.1.1 v): chi può
-- creare un account deve poterlo cancellare dall'app, non "disattivare".
--
-- SCELTA DI PRODOTTO, da confermare: l'actor NON viene cancellato, viene
-- ANONIMIZZATO. Il motivo è che il nome di chi ha organizzato o votato compare
-- nella storia dei piani altrui: cancellare la riga romperebbe i piani di chi
-- resta. Dopo la chiamata:
--   - l'utente auth è eliminato: non si può più entrare, con nessun metodo;
--   - display_name diventa 'Account eliminato', email svuotata;
--   - voti, preferenze, partecipazioni, appartenenze ai gruppi e dati privati
--     (sezioni, posti) sono cancellati davvero;
--   - i piani ancora ai voti di cui era organizzatore vengono annullati.
-- Quello che resta è una riga senza dati personali, non riconducibile a nessuno.
--
-- Se invece vuoi la cancellazione totale, va deciso prima cosa succede ai piani
-- altrui che dipendono da quelle righe: non è una modifica al SQL, è una
-- decisione di prodotto.

begin;

-- ---------------------------------------------------------------- preflight
-- Cancellare dati in produzione senza aver visto 0001/0002 è la cosa più
-- delicata di tutto il progetto: qui si verifica ogni assunzione, e al primo
-- dubbio si rifiuta di installarsi.
do $$
declare
  v_unknown text;
  v_nullable text;
  v_action   char;
begin
  if exists (
    select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public' and p.proname = 'delete_my_account'
  ) then
    raise exception '0004 è già applicata: delete_my_account esiste.';
  end if;
  if to_regclass('public.actors') is null then
    raise exception 'manca public.actors: schema inatteso, non applicare';
  end if;

  -- 1. Qualunque tabella punti ad actors e non sia gestita qui sotto
  --    lascerebbe dati personali orfani. Meglio fallire e farsi dire quali.
  select string_agg(distinct cl.relname, ', ' order by cl.relname)
    into v_unknown
    from pg_constraint c
    join pg_class cl on cl.oid = c.conrelid
    join pg_namespace n on n.oid = cl.relnamespace
   where c.contype = 'f'
     and c.confrelid = 'public.actors'::regclass
     and n.nspname = 'public'
     and cl.relname not in (
       -- Cancellate: sono dati personali di chi se ne va.
       'participants', 'ballots', 'approvals',
       'group_members', 'sections', 'group_sections',
       -- Tenute: puntano all'actor come AUTORE di roba condivisa (chi ha
       -- creato il piano, chi ha proposto un'opzione, chi ha creato il
       -- gruppo). Non c'è niente da cancellare: l'anonimizzazione dell'actor
       -- le copre già, e il nome diventa 'Account eliminato' ovunque compaia.
       -- Cancellarle romperebbe i piani di chi resta.
       'plans', 'candidates', 'plan_changes', 'groups',
       'invite_links', 'invite_uses', 'funnel_events', 'group_invite_links'
     );

  if v_unknown is not null then
    raise exception
      'queste tabelle puntano ad actors e delete_my_account non le gestisce: %. Aggiungile alla funzione prima di applicare.',
      v_unknown;
  end if;

  -- 2. L'anonimizzazione azzera auth_user_id: deve essere nullable.
  select is_nullable into v_nullable
    from information_schema.columns
   where table_schema = 'public' and table_name = 'actors'
     and column_name = 'auth_user_id';

  if v_nullable = 'NO' then
    raise exception
      'actors.auth_user_id è NOT NULL: l''anonimizzazione non può funzionare. Rendila nullable, oppure cambia strategia.';
  end if;

  -- 3. Se quella FK cancella a cascata, eliminare l'utente auth porterebbe via
  --    anche l'actor, e con lui i piani di chi resta.
  select c.confdeltype into v_action
    from pg_constraint c
   where c.contype = 'f'
     and c.conrelid = 'public.actors'::regclass
     and c.confrelid = 'auth.users'::regclass
   limit 1;

  if v_action = 'c' then
    raise exception
      'actors.auth_user_id ha ON DELETE CASCADE verso auth.users: cancellare l''utente porterebbe via l''actor. Passa a ON DELETE SET NULL prima di applicare.';
  end if;
end $$;

-- ---------------------------------------------------------------- funzione
create function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_uid   uuid := auth.uid();
  v_actor uuid;
begin
  if v_uid is null then
    raise exception 'non sei autenticato';
  end if;

  select a.id into v_actor from public.actors a where a.auth_user_id = v_uid;

  if v_actor is not null then
    -- I piani ancora ai voti di cui era organizzatore non hanno più un padrone:
    -- annullarli è più onesto che lasciarli aperti per sempre. Quelli già
    -- confermati restano: la gente ci si è organizzata sopra.
    update public.plans
       set status = 'cancelled'
     where organizer_id = v_actor
       and status = 'deciding';

    -- Dati privati e appartenenze: via davvero.
    delete from public.group_sections     where actor_id = v_actor;
    delete from public.sections           where actor_id = v_actor;
    delete from public.group_members      where actor_id = v_actor;
    delete from public.approvals          where actor_id = v_actor;
    delete from public.ballots            where actor_id = v_actor;
    delete from public.participants       where actor_id = v_actor;

    -- La riga resta, ma senza niente che sia riconducibile a una persona.
    update public.actors
       set display_name = 'Account eliminato',
           auth_user_id = null
     where id = v_actor;

    -- L'email c'è solo se 0001/0002 l'hanno prevista (set_my_email lo lascia
    -- pensare, ma non l'ho vista): si svuota solo se la colonna esiste.
    if exists (
      select 1 from information_schema.columns
       where table_schema = 'public' and table_name = 'actors'
         and column_name = 'email'
    ) then
      execute 'update public.actors set email = null where id = $1' using v_actor;
    end if;
  end if;

  -- Ultimo passo: senza utente auth non si rientra più, con nessun provider.
  delete from auth.users where id = v_uid;
end;
$$;

revoke execute on function public.delete_my_account() from public;
grant  execute on function public.delete_my_account() to authenticated;

commit;

-- ---------------------------------------------------------------------------
-- DOPO AVERLA APPLICATA, da verificare a mano su un account di prova:
--   1. crea un account, entra in un gruppo, vota un piano, salva l'email;
--   2. chiama delete_my_account();
--   3. controlla che il login con lo stesso Google NON riporti ai vecchi dati
--      (deve creare un actor nuovo);
--   4. controlla che i piani altrui a cui aveva partecipato si aprano ancora
--      e mostrino 'Account eliminato' al posto del nome.
-- Il punto 4 è quello che si rompe più facilmente.
-- ---------------------------------------------------------------------------
