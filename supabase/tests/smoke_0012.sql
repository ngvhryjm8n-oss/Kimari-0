-- smoke_0012.sql — si può falsificare una votazione?
--
--   ⚠️  ALLA FINE VEDRAI UN ERRORE ROSSO. È VOLUTO, ED È IL RESOCONTO.
--
-- Questa è la prova più importante di tutte quelle scritte finora: non
-- verifica che una funzione faccia il suo mestiere, verifica che NON si possa
-- fare una cosa. E il modo di sbagliare è subdolo — una politica che sembra
-- attiva ma lascia passare, e nessuno se ne accorge finché non conta.

do $t$
declare
  a_uid uuid := gen_random_uuid();   -- Anna, organizza
  b_uid uuid := gen_random_uuid();   -- Bruno, ospite onesto
  c_uid uuid := gen_random_uuid();   -- Carla, secondo ospite
  d_uid uuid := gen_random_uuid();   -- Dario, ha un account vero
  a_id uuid; b_id uuid;
  v_plan uuid; v_token text; v_res jsonb; v_ptype text;
  v_seg1 uuid; v_seg2 uuid;
  n integer; ok integer := 0;
  rep text := '';
begin
  begin
    -- Bruno e Carla anonimi come chi apre un link; Dario con account vero.
    insert into auth.users (id, email, is_anonymous) values
      (a_uid, 'anna@test.invalid',  false),
      (b_uid, null,                 true),
      (c_uid, null,                 true),
      (d_uid, 'dario@test.invalid', false);

    perform set_config('request.jwt.claims', json_build_object('sub', a_uid)::text, true);
    perform set_config('role', 'authenticated', true);
    perform public.ensure_actor(p_display_name := 'Anna');
    perform set_config('role', 'postgres', true);
    select id into a_id from public.actors where auth_user_id = a_uid;

    select pg_catalog.format_type(p.proargtypes[0], null) into v_ptype
      from pg_proc p join pg_namespace nsp on nsp.oid = p.pronamespace
     where nsp.nspname = 'public' and p.proname = 'create_plan' limit 1;

    perform set_config('request.jwt.claims', json_build_object('sub', a_uid)::text, true);
    perform set_config('role', 'authenticated', true);
    execute format('select public.create_plan(p := $1::%s)::jsonb', v_ptype) into v_res
     using jsonb_build_object('title','Pizza','when_mode','fixed','where_mode','fixed',
             'place_name','Da Gino','starts_at',(now() + interval '2 days')::text,
             'timezone','Europe/Rome')::text;
    v_plan  := (v_res->>'plan_id')::uuid;
    v_token := v_res->>'token';

    ------------------------------------------------- 1) aperto: si entra
    perform set_config('request.jwt.claims', json_build_object('sub', b_uid)::text, true);
    perform set_config('role', 'authenticated', true);
    perform public.join_plan(v_token, 'Bruno', null);
    perform set_config('role', 'postgres', true);
    select count(*) into n from public.participants where plan_id = v_plan;
    if n <> 2 then raise exception '1) con la politica aperta Bruno doveva entrare (% partecipanti)', n; end if;
    ok := ok + 1; rep := rep || E'\nok   1) aperto: chi ha il link entra scrivendo un nome';

    ------------------------------------------------- 2) il tetto sul link
    perform set_config('request.jwt.claims', json_build_object('sub', a_uid)::text, true);
    perform set_config('role', 'authenticated', true);
    perform public.set_invite_limits(v_plan, 1, null);   -- uno solo, ed è già usato

    perform set_config('request.jwt.claims', json_build_object('sub', c_uid)::text, true);
    begin
      perform public.join_plan(v_token, 'Carla', null);
      raise exception '2) il tetto sul link non ferma nessuno: la difesa è finta';
    exception when others then
      if sqlerrm not like '%exhausted%' then raise; end if;
    end;
    ok := ok + 1; rep := rep || E'\nok   2) tetto sul link: il secondo non entra';

    -- e non deve poter essere abbassato sotto chi è già entrato
    perform set_config('request.jwt.claims', json_build_object('sub', a_uid)::text, true);
    perform public.set_invite_limits(v_plan, 10, null);   -- si riapre per il resto della prova

    ------------------------------------------------- 3) chi è dentro rientra
    perform set_config('request.jwt.claims', json_build_object('sub', a_uid)::text, true);
    perform public.set_join_policy(v_plan, 'roster');

    perform set_config('request.jwt.claims', json_build_object('sub', b_uid)::text, true);
    -- Bruno è già dentro: stringere le regole non deve buttarlo fuori.
    perform public.join_plan(v_token, 'Bruno', null);
    ok := ok + 1; rep := rep || E'\nok   3) chi è già dentro rientra anche dopo che si stringe';

    ------------------------------ 4) IL PUNTO: elenco chiuso, niente nomi liberi
    perform set_config('request.jwt.claims', json_build_object('sub', c_uid)::text, true);
    begin
      perform public.join_plan(v_token, 'Carla', null);
      raise exception '4) FALSIFICABILE: con l''elenco chiuso si è entrati con un nome inventato';
    exception when others then
      if sqlerrm not like '%elenco%' then raise; end if;
    end;
    ok := ok + 1; rep := rep || E'\nok   4) elenco chiuso: un nome inventato non entra';

    ------------------------------------------------- 5) rivendicare un nome
    perform set_config('request.jwt.claims', json_build_object('sub', a_uid)::text, true);
    v_seg1 := public.add_plan_placeholder(v_plan, 'Carla');
    v_seg2 := public.add_plan_placeholder(v_plan, 'Giò');

    perform set_config('role', 'postgres', true);
    select count(*) into n from public.actors where id = v_seg1 and auth_user_id is null;
    if n <> 1 then raise exception '5) il segnaposto non è rivendicabile'; end if;

    perform set_config('request.jwt.claims', json_build_object('sub', c_uid)::text, true);
    perform set_config('role', 'authenticated', true);
    perform public.join_plan(v_token, null, v_seg1);

    perform set_config('role', 'postgres', true);
    select count(*) into n from public.actors where id = v_seg1 and auth_user_id = c_uid;
    if n <> 1 then raise exception '5) Carla non si è presa il suo nome'; end if;
    ok := ok + 1; rep := rep || E'\nok   5) chi si riconosce nell''elenco entra e prende quel nome';

    ------------------------------------------------- 6) un nome, una volta
    perform set_config('request.jwt.claims', json_build_object('sub', d_uid)::text, true);
    perform set_config('role', 'authenticated', true);
    begin
      perform public.join_plan(v_token, null, v_seg1);   -- lo stesso nome di Carla
      raise exception '6) FALSIFICABILE: due persone si sono prese lo stesso nome';
    exception when others then
      if sqlerrm not like '%claim not allowed%' then raise; end if;
    end;
    ok := ok + 1; rep := rep || E'\nok   6) un nome dell''elenco si prende una volta sola';

    ------------------------------------------------- 7) serve un account
    perform set_config('request.jwt.claims', json_build_object('sub', a_uid)::text, true);
    perform public.set_join_policy(v_plan, 'account');

    -- Dario ha un account vero: entra.
    perform set_config('request.jwt.claims', json_build_object('sub', d_uid)::text, true);
    perform public.join_plan(v_token, 'Dario', null);
    perform set_config('role', 'postgres', true);
    select count(*) into n from public.participants pa
      join public.actors ac on ac.id = pa.actor_id
     where pa.plan_id = v_plan and ac.auth_user_id = d_uid;
    if n <> 1 then raise exception '7) chi ha un account vero doveva entrare'; end if;
    ok := ok + 1; rep := rep || E'\nok   7) account: chi ne ha uno vero entra';

    ------------------------------------------------- 8) niente ospiti
    perform set_config('role', 'postgres', true);
    delete from public.participants where plan_id = v_plan and actor_id = v_seg2;
    declare e_uid uuid := gen_random_uuid();
    begin
      insert into auth.users (id, email, is_anonymous) values (e_uid, null, true);
      perform set_config('request.jwt.claims', json_build_object('sub', e_uid)::text, true);
      perform set_config('role', 'authenticated', true);
      begin
        perform public.join_plan(v_token, 'Intruso', null);
        raise exception '8) FALSIFICABILE: un ospite anonimo è entrato in un piano che richiede l''account';
      exception when others then
        if sqlerrm not like '%account%' then raise; end if;
      end;
    end;
    ok := ok + 1; rep := rep || E'\nok   8) account: un ospite anonimo non entra';

    ------------------------------------------------- 9) solo l'organizzatore
    perform set_config('request.jwt.claims', json_build_object('sub', b_uid)::text, true);
    perform set_config('role', 'authenticated', true);
    begin
      perform public.set_join_policy(v_plan, 'open');
      raise exception '9) un partecipante ha riaperto il piano: chiunque può disattivare la difesa';
    exception when others then
      if sqlerrm not like '%organizza%' then raise; end if;
    end;
    begin
      perform public.set_invite_limits(v_plan, 99, null);
      raise exception '9) un partecipante ha alzato il tetto sul link';
    exception when others then
      if sqlerrm not like '%organizza%' then raise; end if;
    end;
    ok := ok + 1; rep := rep || E'\nok   9) solo chi organizza cambia politica e limiti';

    rep := rep || E'\n\n====== TUTTO OK — ' || ok || E' controlli su 9 passati ======';

  exception when others then
    rep := rep || E'\n\n>>> FALLITO: ' || sqlerrm
               || E'\n(' || ok || E' controlli erano passati prima di questo)';
  end;

  raise exception E'\n--- ESITO 0012 (questo "errore" è voluto: annulla la prova) ---%\n', rep;
end
$t$;
