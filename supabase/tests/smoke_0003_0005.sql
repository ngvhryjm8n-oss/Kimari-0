-- smoke_0003_0005.sql — prova i corpi plpgsql di 0003, 0004 e 0005.
--
-- Il parser di Postgres valida solo il DDL esterno: i corpi delle funzioni sono
-- stringhe e nessuno li guarda finché non girano. Questo file li fa girare.
--
-- Simula tre persone:
--   Anna  — crea il gruppo, organizza il piano
--   Bruno — entra con l'invito, vota
--   Carla — estranea: non deve vedere niente
--
-- TUTTO dentro una transazione che finisce in ROLLBACK: non resta una riga.
-- Incollalo nel SQL Editor e lancialo intero. Se arrivi in fondo e leggi
-- "TUTTO OK", le funzioni fanno quello che devono.
--
-- Se fallisce, il messaggio dice quale controllo e cosa si aspettava.

begin;

do $t$
declare
  a_uid uuid := gen_random_uuid();
  b_uid uuid := gen_random_uuid();
  c_uid uuid := gen_random_uuid();
  a_id  uuid; b_id uuid; c_id uuid;
  v_group uuid; v_token text; v_prev json;
  v_plan  uuid; v_extra uuid; v_cand uuid; v_prop uuid;
  v_ptype text; v_res jsonb; v_status text;
  n integer; ok integer := 0;
begin
  ---------------------------------------------------------------- fixture
  begin
    insert into auth.users (id, email) values
      (a_uid, 'anna@test.invalid'),
      (b_uid, 'bruno@test.invalid'),
      (c_uid, 'carla@test.invalid');
  exception when others then
    raise exception 'Non riesco a creare utenti di prova in auth.users: %. Questa versione di Supabase vuole altre colonne — mandami il messaggio e adatto il file.', sqlerrm;
  end;

  -- Anna
  perform set_config('request.jwt.claims', json_build_object('sub', a_uid)::text, true);
  perform set_config('role', 'authenticated', true);
  perform public.ensure_actor(p_display_name := 'Anna');
  perform set_config('role', 'postgres', true);
  select id into a_id from public.actors where auth_user_id = a_uid;

  -- Bruno
  perform set_config('request.jwt.claims', json_build_object('sub', b_uid)::text, true);
  perform set_config('role', 'authenticated', true);
  perform public.ensure_actor(p_display_name := 'Bruno');
  perform set_config('role', 'postgres', true);
  select id into b_id from public.actors where auth_user_id = b_uid;

  -- Carla
  perform set_config('request.jwt.claims', json_build_object('sub', c_uid)::text, true);
  perform set_config('role', 'authenticated', true);
  perform public.ensure_actor(p_display_name := 'Carla');
  perform set_config('role', 'postgres', true);
  select id into c_id from public.actors where auth_user_id = c_uid;

  if a_id is null or b_id is null or c_id is null then
    raise exception 'ensure_actor non ha creato gli actor: a=% b=% c=%', a_id, b_id, c_id;
  end if;
  raise notice 'fixture: tre persone create';

  ---------------------------------------------------------- 0003 gruppi
  perform set_config('request.jwt.claims', json_build_object('sub', a_uid)::text, true);
  perform set_config('role', 'authenticated', true);

  v_group := public.create_group('Padel', '🎾', '#34C759');

  select count(*) into n from public.group_members
   where group_id = v_group and actor_id = a_id and role = 'admin';
  if n <> 1 then raise exception '1) chi crea il gruppo deve restarne admin (trovato %)', n; end if;
  ok := ok + 1; raise notice 'ok  1) create_group: chi crea è admin';

  v_token := public.create_group_invite(v_group);
  if v_token is null or length(v_token) < 32 then
    raise exception '2) token d''invito troppo corto o nullo: %', v_token;
  end if;
  perform set_config('role', 'postgres', true);
  select count(*) into n from public.group_invite_links
   where group_id = v_group and token_hash = v_token;
  if n <> 0 then raise exception '2) il token è finito in chiaro nel database'; end if;
  select count(*) into n from public.group_invite_links
   where group_id = v_group and token_hash = encode(sha256(v_token::bytea), 'hex');
  if n <> 1 then raise exception '2) l''hash del token non è stato salvato'; end if;
  ok := ok + 1; raise notice 'ok  2) create_group_invite: in tabella c''è solo lo sha256';

  -- Bruno entra
  perform set_config('request.jwt.claims', json_build_object('sub', b_uid)::text, true);
  perform set_config('role', 'authenticated', true);
  v_prev := public.preview_group_invite(v_token);
  if (v_prev->>'ok')::boolean is not true or v_prev->>'name' <> 'Padel' then
    raise exception '3) preview_group_invite non torna il gruppo: %', v_prev;
  end if;
  ok := ok + 1; raise notice 'ok  3) preview_group_invite funziona col token in chiaro';

  perform public.join_group(v_token, 'Bruno');
  perform set_config('role', 'postgres', true);
  select count(*) into n from public.group_members
   where group_id = v_group and actor_id = b_id and role = 'member';
  if n <> 1 then raise exception '4) join_group non ha aggiunto Bruno come member'; end if;
  ok := ok + 1; raise notice 'ok  4) join_group aggiunge il membro';

  -- Carla, estranea, non deve vedere il gruppo
  perform set_config('request.jwt.claims', json_build_object('sub', c_uid)::text, true);
  perform set_config('role', 'authenticated', true);
  select count(*) into n from public.groups where id = v_group;
  if n <> 0 then raise exception '5) BUCO RLS: un''estranea vede il gruppo'; end if;
  select count(*) into n from public.group_members where group_id = v_group;
  if n <> 0 then raise exception '5) BUCO RLS: un''estranea vede i membri del gruppo'; end if;
  ok := ok + 1; raise notice 'ok  5) RLS: chi non è nel gruppo non lo vede';

  -- le sezioni sono private anche fra membri
  perform set_config('request.jwt.claims', json_build_object('sub', a_uid)::text, true);
  perform public.create_section('Roma');
  perform set_config('request.jwt.claims', json_build_object('sub', b_uid)::text, true);
  select count(*) into n from public.sections;
  if n <> 0 then raise exception '6) BUCO RLS: Bruno vede le sezioni di Anna'; end if;
  ok := ok + 1; raise notice 'ok  6) RLS: le sezioni restano private';

  -- l'ultimo admin non può uscire
  perform set_config('request.jwt.claims', json_build_object('sub', a_uid)::text, true);
  begin
    perform public.leave_group(v_group);
    raise exception '7) l''ultimo admin è riuscito a uscire, lasciando il gruppo senza nessuno';
  exception when others then
    if sqlerrm not like '%ultimo admin%' then raise; end if;
  end;
  ok := ok + 1; raise notice 'ok  7) l''ultimo admin non può abbandonare il gruppo';

  ------------------------------------------------- piano + 0005
  -- create_plan: il tipo del parametro (json o jsonb) non lo conosco, lo leggo.
  perform set_config('role', 'postgres', true);
  select pg_catalog.format_type(p.proargtypes[0], null) into v_ptype
    from pg_proc p join pg_namespace nsp on nsp.oid = p.pronamespace
   where nsp.nspname = 'public' and p.proname = 'create_plan' limit 1;

  perform set_config('request.jwt.claims', json_build_object('sub', a_uid)::text, true);
  perform set_config('role', 'authenticated', true);
  execute format('select public.create_plan(p := $1::%s)::jsonb', v_ptype)
    into v_res
   using jsonb_build_object(
      'title', 'Torneo',
      'when_mode', 'deciding',
      'where_mode', 'fixed',
      'place_name', 'Padel Club',
      'when_candidates', jsonb_build_array(
        jsonb_build_object('starts_at', (now() + interval '7 days')::text, 'timezone', 'Europe/Rome'))
   )::text;
  v_plan := (v_res->>'plan_id')::uuid;
  if v_plan is null then raise exception '8) create_plan non ha reso un plan_id: %', v_res; end if;
  ok := ok + 1; raise notice 'ok  8) create_plan (parametro di tipo %)', v_ptype;

  -- domanda extra
  v_extra := public.add_plan_extra(v_plan, 'Chi porta le palline?',
                                   array['Anna', 'Bruno', 'Nessuno'], false);
  select id into v_cand from public.extra_candidates
   where extra_id = v_extra and label = 'Bruno';
  perform public.submit_extra_ballot(v_extra, array[v_cand]);
  -- rivotare deve sostituire, non sommare
  perform public.submit_extra_ballot(v_extra, array[v_cand]);
  perform set_config('role', 'postgres', true);
  select count(*) into n from public.extra_approvals
   where extra_id = v_extra and actor_id = a_id;
  if n <> 1 then raise exception '9) rivotare ha accumulato le preferenze invece di sostituirle (%)', n; end if;
  ok := ok + 1; raise notice 'ok  9) submit_extra_ballot sostituisce il voto precedente';

  -- Carla non partecipa: non deve poter votare né vedere
  perform set_config('request.jwt.claims', json_build_object('sub', c_uid)::text, true);
  perform set_config('role', 'authenticated', true);
  begin
    perform public.submit_extra_ballot(v_extra, array[v_cand]);
    raise exception '10) un''estranea è riuscita a votare una domanda extra';
  exception when others then
    if sqlerrm not like '%non partecipi%' then raise; end if;
  end;
  select count(*) into n from public.v_extra_results where extra_id = v_extra;
  if n <> 0 then raise exception '10) BUCO RLS: v_extra_results mostra i conteggi a un''estranea'; end if;
  ok := ok + 1; raise notice 'ok 10) estranei: niente voto e niente conteggi (v_extra_results rispetta la RLS)';

  -- commenti
  perform set_config('request.jwt.claims', json_build_object('sub', a_uid)::text, true);
  perform public.add_comment(v_plan, 'Porto io le palline');
  perform set_config('role', 'postgres', true);
  select count(*) into n from public.comments where plan_id = v_plan and not is_system;
  if n <> 1 then raise exception '11) il commento non è stato salvato'; end if;
  ok := ok + 1; raise notice 'ok 11) add_comment';

  ------------------------------------------------- 0004 cancellazione
  perform set_config('request.jwt.claims', json_build_object('sub', b_uid)::text, true);
  perform set_config('role', 'authenticated', true);
  perform public.delete_my_account();
  perform set_config('role', 'postgres', true);

  select display_name into v_status from public.actors where id = b_id;
  if v_status <> 'Account eliminato' then
    raise exception '12) l''actor di Bruno non è stato anonimizzato (nome: %)', v_status;
  end if;
  select count(*) into n from public.actors where id = b_id and auth_user_id is not null;
  if n <> 0 then raise exception '12) auth_user_id non azzerato'; end if;
  select count(*) into n from auth.users where id = b_uid;
  if n <> 0 then raise exception '12) l''utente auth di Bruno esiste ancora: potrebbe rientrare'; end if;
  select count(*) into n from public.group_members where actor_id = b_id;
  if n <> 0 then raise exception '12) Bruno risulta ancora nel gruppo'; end if;
  ok := ok + 1; raise notice 'ok 12) delete_my_account: anonimizza, sgancia l''auth, toglie dai gruppi';

  -- il gruppo di Anna deve essere sopravvissuto
  select count(*) into n from public.groups where id = v_group;
  if n <> 1 then raise exception '13) cancellare Bruno ha portato via il gruppo'; end if;
  select count(*) into n from public.comments where plan_id = v_plan;
  if n <> 1 then raise exception '13) cancellare Bruno ha toccato i commenti di Anna'; end if;
  ok := ok + 1; raise notice 'ok 13) i dati di chi resta sono intatti';

  perform set_config('role', 'postgres', true);
  raise notice '';
  raise notice '======  TUTTO OK — % controlli passati  ======', ok;
end
$t$;

rollback;

-- Il rollback qui sopra è voluto: la prova non deve lasciare niente.
-- Se vuoi guardare i dati creati, sostituiscilo con COMMIT — ma poi il progetto
-- resta sporco di gruppi e piani finti, quindi fallo solo su quello di prova.
