-- smoke_0008.sql — domande aggiunte a un piano già in corso.
--
--   ⚠️  ALLA FINE VEDRAI UN ERRORE ROSSO. È VOLUTO, ED È IL RESOCONTO.
-- Come gli altri: annulla la prova e non lascia righe.

do $t$
declare
  a_uid uuid := gen_random_uuid();   -- Anna, organizza
  b_uid uuid := gen_random_uuid();   -- Bruno, partecipa
  c_uid uuid := gen_random_uuid();   -- Carla, estranea
  a_id uuid; b_id uuid; c_id uuid;
  v_plan uuid; v_extra uuid; v_si uuid; v_no uuid; v_ptype text; v_res jsonb;
  n integer; ok integer := 0;
  rep text := '';
begin
  begin
    insert into auth.users (id, email) values
      (a_uid, 'anna@test.invalid'), (b_uid, 'bruno@test.invalid'), (c_uid, 'carla@test.invalid');

    perform set_config('request.jwt.claims', json_build_object('sub', a_uid)::text, true);
    perform set_config('role', 'authenticated', true);
    perform public.ensure_actor(p_display_name := 'Anna');
    perform set_config('role', 'postgres', true);
    select id into a_id from public.actors where auth_user_id = a_uid;

    perform set_config('request.jwt.claims', json_build_object('sub', b_uid)::text, true);
    perform set_config('role', 'authenticated', true);
    perform public.ensure_actor(p_display_name := 'Bruno');
    perform set_config('role', 'postgres', true);
    select id into b_id from public.actors where auth_user_id = b_uid;

    perform set_config('request.jwt.claims', json_build_object('sub', c_uid)::text, true);
    perform set_config('role', 'authenticated', true);
    perform public.ensure_actor(p_display_name := 'Carla');
    perform set_config('role', 'postgres', true);
    select id into c_id from public.actors where auth_user_id = c_uid;

    -- Piano ANCORA AI VOTI: si sta decidendo quando e dove.
    select pg_catalog.format_type(p.proargtypes[0], null) into v_ptype
      from pg_proc p join pg_namespace nsp on nsp.oid = p.pronamespace
     where nsp.nspname = 'public' and p.proname = 'create_plan' limit 1;

    perform set_config('request.jwt.claims', json_build_object('sub', a_uid)::text, true);
    perform set_config('role', 'authenticated', true);
    execute format('select public.create_plan(p := $1::%s)::jsonb', v_ptype) into v_res
     using jsonb_build_object('title', 'Pizza', 'when_mode', 'deciding', 'where_mode', 'deciding',
             'when_candidates', jsonb_build_array(
               jsonb_build_object('starts_at', (now() + interval '3 days')::text, 'timezone', 'Europe/Rome'),
               jsonb_build_object('starts_at', (now() + interval '4 days')::text, 'timezone', 'Europe/Rome')),
             'where_candidates', jsonb_build_array(
               jsonb_build_object('place_name', 'Da Gino'),
               jsonb_build_object('place_name', 'Sorbillo')))::text;
    v_plan := (v_res->>'plan_id')::uuid;

    perform set_config('role', 'postgres', true);
    insert into public.participants (plan_id, actor_id, role) values (v_plan, b_id, 'member');

    ------------------------------------- 1) chiunque partecipa può chiedere
    perform set_config('request.jwt.claims', json_build_object('sub', b_uid)::text, true);
    perform set_config('role', 'authenticated', true);
    -- Bruno NON organizza: prima non avrebbe potuto.
    v_extra := public.add_plan_extra(v_plan, 'Invitiamo anche Matteo?', null, true);
    if v_extra is null then raise exception '1) la domanda non è stata creata'; end if;
    ok := ok + 1; rep := rep || E'\nok   1) un partecipante qualunque può aprire una domanda';

    ------------------------------------- 2) sul piano ancora ai voti
    perform set_config('role', 'postgres', true);
    select status into v_ptype from public.plans where id = v_plan;
    if v_ptype <> 'deciding' then raise exception '2) il piano non è più ai voti'; end if;
    select count(*) into n from public.plan_extras where plan_id = v_plan;
    if n <> 1 then raise exception '2) la domanda non risulta attaccata al piano'; end if;
    select count(*) into n from public.candidates where plan_id = v_plan;
    if n <> 4 then raise exception '2) le opzioni di quando/dove sono cambiate (% invece di 4)', n; end if;
    ok := ok + 1; rep := rep || E'\nok   2) si aggiunge a piano in corso senza toccare quando e dove';

    ------------------------------------- 3) binaria = Sì e No
    select id into v_si from public.extra_candidates where extra_id = v_extra and label = 'Sì';
    select id into v_no from public.extra_candidates where extra_id = v_extra and label = 'No';
    if v_si is null or v_no is null then raise exception '3) mancano le opzioni Sì/No'; end if;
    ok := ok + 1; rep := rep || E'\nok   3) la domanda binaria nasce con Sì e No';

    ------------------------------------- 4) IL BUG: non si vota Sì e No
    perform set_config('request.jwt.claims', json_build_object('sub', b_uid)::text, true);
    perform set_config('role', 'authenticated', true);
    begin
      perform public.submit_extra_ballot(v_extra, array[v_si, v_no]);
      raise exception '4) si è potuto votare Sì e No insieme: il conteggio non vuol dire niente';
    exception when others then
      if sqlerrm not like '%una sola%' then raise; end if;
    end;
    perform public.submit_extra_ballot(v_extra, array[v_si]);
    perform set_config('role', 'postgres', true);
    select count(*) into n from public.extra_approvals where extra_id = v_extra and actor_id = b_id;
    if n <> 1 then raise exception '4) il voto singolo non è stato registrato (%)', n; end if;
    ok := ok + 1; rep := rep || E'\nok   4) su una domanda sì/no si risponde una cosa sola';

    ------------------------------------- 5) non binaria: più risposte sì
    perform set_config('request.jwt.claims', json_build_object('sub', a_uid)::text, true);
    perform set_config('role', 'authenticated', true);
    declare v_e2 uuid; v_o1 uuid; v_o2 uuid;
    begin
      v_e2 := public.add_plan_extra(v_plan, 'Cosa portiamo?',
                                    array['Vino', 'Dolce', 'Niente'], false);
      select id into v_o1 from public.extra_candidates where extra_id = v_e2 and label = 'Vino';
      select id into v_o2 from public.extra_candidates where extra_id = v_e2 and label = 'Dolce';
      perform public.submit_extra_ballot(v_e2, array[v_o1, v_o2]);
      perform set_config('role', 'postgres', true);
      select count(*) into n from public.extra_approvals where extra_id = v_e2 and actor_id = a_id;
      if n <> 2 then raise exception '5) sulla domanda a opzioni non si possono più segnare più risposte (%)', n; end if;
    end;
    ok := ok + 1; rep := rep || E'\nok   5) sulle domande a opzioni si continuano a segnare più risposte';

    ------------------------------------- 6) estranei fuori
    perform set_config('request.jwt.claims', json_build_object('sub', c_uid)::text, true);
    perform set_config('role', 'authenticated', true);
    begin
      perform public.add_plan_extra(v_plan, 'Domanda intrusa', null, true);
      raise exception '6) un''estranea ha aggiunto una domanda al piano';
    exception when others then
      if sqlerrm not like '%non partecipi%' then raise; end if;
    end;
    ok := ok + 1; rep := rep || E'\nok   6) chi non partecipa non può aprire domande';

    ------------------------------------- 7) si resta padroni della propria
    perform set_config('request.jwt.claims', json_build_object('sub', a_uid)::text, true);
    perform set_config('role', 'authenticated', true);
    -- Anna organizza: può togliere anche la domanda di Bruno.
    perform public.remove_plan_extra(v_extra);
    perform set_config('role', 'postgres', true);
    select count(*) into n from public.plan_extras where id = v_extra;
    if n <> 0 then raise exception '7) la domanda non è stata tolta'; end if;
    select count(*) into n from public.extra_approvals where extra_id = v_extra;
    if n <> 0 then raise exception '7) i voti della domanda tolta sono rimasti orfani'; end if;
    ok := ok + 1; rep := rep || E'\nok   7) togliere una domanda porta via anche i suoi voti';

    ------------------------------------- 8) il tetto delle 5 domande
    perform set_config('request.jwt.claims', json_build_object('sub', b_uid)::text, true);
    perform set_config('role', 'authenticated', true);
    for n in 1..4 loop
      perform public.add_plan_extra(v_plan, 'Domanda ' || n, null, true);
    end loop;
    begin
      perform public.add_plan_extra(v_plan, 'Una di troppo', null, true);
      raise exception '8) sesta domanda accettata: il tetto non viene applicato';
    exception when others then
      if sqlerrm not like '%5 domande%' then raise; end if;
    end;
    ok := ok + 1; rep := rep || E'\nok   8) massimo 5 domande aperte per piano';

    rep := rep || E'\n\n====== TUTTO OK — ' || ok || E' controlli su 8 passati ======';

  exception when others then
    rep := rep || E'\n\n>>> FALLITO: ' || sqlerrm
               || E'\n(' || ok || E' controlli erano passati prima di questo)';
  end;

  raise exception E'\n--- ESITO 0008 (questo "errore" è voluto: annulla la prova) ---%\n', rep;
end
$t$;
