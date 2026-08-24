-- smoke_0006.sql — prova la Fase 3, con l'attenzione sui soldi.
--
--   ⚠️  ALLA FINE VEDRAI UN ERRORE ROSSO. È VOLUTO, ED È IL RESOCONTO.
-- Come l'altro test: l'eccezione è l'unico modo di mostrare il riepilogo
-- nell'editor di Supabase, e serve anche ad annullare tutto. Non lascia righe.
--
-- Il controllo che conta più di tutti è il 3: la somma di tutti i saldi deve
-- fare ESATTAMENTE zero. Se il resto della divisione viene perso o contato due
-- volte, quella somma non torna — ed è così che nei conti fra amici saltano
-- fuori i centesimi fantasma.

do $t$
declare
  a_uid uuid := gen_random_uuid();
  b_uid uuid := gen_random_uuid();
  c_uid uuid := gen_random_uuid();
  d_uid uuid := gen_random_uuid();
  a_id uuid; b_id uuid; c_id uuid; d_id uuid;
  v_plan uuid; v_exp uuid; v_ptype text; v_res jsonb;
  v_sum bigint; v_a bigint; v_b bigint; v_c bigint;
  n integer; ok integer := 0;
  rep text := '';
begin
  begin
    ---------------------------------------------------------------- fixture
    insert into auth.users (id, email) values
      (a_uid, 'anna@test.invalid'), (b_uid, 'bruno@test.invalid'),
      (c_uid, 'carla@test.invalid'), (d_uid, 'dario@test.invalid');

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

    perform set_config('request.jwt.claims', json_build_object('sub', d_uid)::text, true);
    perform set_config('role', 'authenticated', true);
    perform public.ensure_actor(p_display_name := 'Dario');
    perform set_config('role', 'postgres', true);
    select id into d_id from public.actors where auth_user_id = d_uid;

    -- Piano di Anna, con Bruno e Carla dentro. Dario resta fuori.
    select pg_catalog.format_type(p.proargtypes[0], null) into v_ptype
      from pg_proc p join pg_namespace nsp on nsp.oid = p.pronamespace
     where nsp.nspname = 'public' and p.proname = 'create_plan' limit 1;

    perform set_config('request.jwt.claims', json_build_object('sub', a_uid)::text, true);
    perform set_config('role', 'authenticated', true);
    execute format('select public.create_plan(p := $1::%s)::jsonb', v_ptype) into v_res
     using jsonb_build_object('title', 'Cena', 'when_mode', 'fixed', 'where_mode', 'fixed',
                              'place_name', 'Da Gino',
                              'starts_at', (now() + interval '2 days')::text,
                              'timezone', 'Europe/Rome')::text;
    v_plan := (v_res->>'plan_id')::uuid;

    perform set_config('role', 'postgres', true);
    insert into public.participants (plan_id, actor_id, role)
    values (v_plan, b_id, 'member'), (v_plan, c_id, 'member');

    ------------------------------------------------------------- 1) spesa
    perform set_config('request.jwt.claims', json_build_object('sub', a_uid)::text, true);
    perform set_config('role', 'authenticated', true);
    -- 10,00 € pagati da Anna, divisi in tre: 3,34 + 3,33 + 3,33
    v_exp := public.add_expense(v_plan, 1000, 'Pizza', array[a_id, b_id, c_id]);

    perform set_config('role', 'postgres', true);
    select count(*) into n from public.expense_shares where expense_id = v_exp;
    if n <> 3 then raise exception '1) le quote create sono % invece di 3', n; end if;
    ok := ok + 1; rep := rep || E'\nok   1) add_expense divide fra le persone indicate';

    ------------------------------------------------- 2) il resto non si perde
    perform set_config('request.jwt.claims', json_build_object('sub', a_uid)::text, true);
    perform set_config('role', 'authenticated', true);
    select balance_cents into v_a from public.plan_balances(v_plan) where actor_id = a_id;
    select balance_cents into v_b from public.plan_balances(v_plan) where actor_id = b_id;
    select balance_cents into v_c from public.plan_balances(v_plan) where actor_id = c_id;

    -- Anna ha anticipato 1000 e deve la sua quota: le devono 1000 meno la sua parte.
    if v_a + v_b + v_c <> 0 then
      raise exception '2) 1000 centesimi in tre: i saldi sono % / % / % e sommano % invece di 0',
        v_a, v_b, v_c, v_a + v_b + v_c;
    end if;
    if abs(v_b) not in (333, 334) or abs(v_c) not in (333, 334) then
      raise exception '2) quote sbagliate: Bruno % Carla % (attese 333 o 334)', v_b, v_c;
    end if;
    -- Le tre quote (quella di Anna è 1000 meno quanto le devono) devono
    -- ricostruire esattamente la spesa: è qui che si vede se un centesimo
    -- del resto è stato perso o contato due volte.
    if (1000 - v_a) + abs(v_b) + abs(v_c) <> 1000 then
      raise exception '2) le tre quote sommano % invece di 1000 (Anna % Bruno % Carla %)',
        (1000 - v_a) + abs(v_b) + abs(v_c), 1000 - v_a, abs(v_b), abs(v_c);
    end if;
    ok := ok + 1; rep := rep || E'\nok   2) 10,00 € in tre = 3,34 + 3,33 + 3,33, niente centesimi persi';

    --------------------------------------- 3) l'invariante: somma saldi = 0
    perform public.add_expense(v_plan, 777, 'Caffè', array[b_id, c_id]);
    perform public.add_expense(v_plan, 101, 'Coperto', null);   -- null = tutti
    select sum(balance_cents) into v_sum from public.plan_balances(v_plan);
    if v_sum <> 0 then
      raise exception '3) con tre spese la somma dei saldi fa % invece di 0', v_sum;
    end if;
    ok := ok + 1; rep := rep || E'\nok   3) somma di tutti i saldi = 0 (l''invariante dei soldi)';

    ------------------------------------------------------- 4) il rimborso
    perform set_config('request.jwt.claims', json_build_object('sub', b_uid)::text, true);
    select balance_cents into v_b from public.plan_balances(v_plan) where actor_id = b_id;
    perform public.add_settlement(v_plan, a_id, 100);
    select balance_cents into v_c from public.plan_balances(v_plan) where actor_id = b_id;
    if v_c <> v_b + 100 then
      raise exception '4) dopo aver reso 1,00 € il saldo di Bruno è % invece di %', v_c, v_b + 100;
    end if;
    select sum(balance_cents) into v_sum from public.plan_balances(v_plan);
    if v_sum <> 0 then raise exception '4) il rimborso ha rotto l''invariante: somma %', v_sum; end if;
    ok := ok + 1; rep := rep || E'\nok   4) add_settlement sposta il saldo e la somma resta 0';

    ------------------------------------------------- 5) annullare una spesa
    perform set_config('request.jwt.claims', json_build_object('sub', a_uid)::text, true);
    perform public.void_expense(v_exp);
    select sum(balance_cents) into v_sum from public.plan_balances(v_plan);
    if v_sum <> 0 then raise exception '5) dopo l''annullamento la somma fa %', v_sum; end if;
    perform set_config('role', 'postgres', true);
    select count(*) into n from public.expenses where id = v_exp and voided_at is not null;
    if n <> 1 then raise exception '5) la spesa non risulta annullata'; end if;
    ok := ok + 1; rep := rep || E'\nok   5) void_expense annulla senza cancellare, i conti restano quadrati';

    ------------------------------------------------- 6) estranei fuori
    perform set_config('request.jwt.claims', json_build_object('sub', d_uid)::text, true);
    perform set_config('role', 'authenticated', true);
    begin
      perform public.add_expense(v_plan, 500, 'Non mia', null);
      raise exception '6) un estraneo ha aggiunto una spesa al piano';
    exception when others then
      if sqlerrm not like '%non partecipi%' then raise; end if;
    end;
    select count(*) into n from public.expenses where plan_id = v_plan;
    if n <> 0 then raise exception '6) BUCO RLS: un estraneo vede le spese del piano'; end if;
    ok := ok + 1; rep := rep || E'\nok   6) estranei: niente spese, e la RLS nasconde quelle altrui';

    ------------------------------------------------- 7) limiti sui posti
    perform set_config('request.jwt.claims', json_build_object('sub', a_uid)::text, true);
    for n in 1..10 loop
      perform public.save_place('Posto ' || n, null, null);
    end loop;
    begin
      perform public.save_place('Posto 11', null, null);
      raise exception '7) l''undicesimo posto è stato salvato: il limite non viene applicato';
    exception when others then
      if sqlerrm not like '%massimo%' then raise; end if;
    end;
    ok := ok + 1; rep := rep || E'\nok   7) i limiti del piano gratuito valgono lato server';

    ------------------------------------------------- 8) posti privati
    perform set_config('request.jwt.claims', json_build_object('sub', b_uid)::text, true);
    select count(*) into n from public.places;
    if n <> 0 then raise exception '8) BUCO RLS: Bruno vede i posti salvati di Anna'; end if;
    ok := ok + 1; rep := rep || E'\nok   8) RLS: i posti salvati restano privati';

    ------------------------------- 9) cancellare non falsa i conti altrui
    perform set_config('request.jwt.claims', json_build_object('sub', c_uid)::text, true);
    perform set_config('role', 'authenticated', true);
    perform public.delete_my_account();
    perform set_config('role', 'postgres', true);
    select count(*) into n from public.expense_shares es
      join public.expenses e on e.id = es.expense_id
     where e.plan_id = v_plan and es.actor_id = c_id;
    if n = 0 then
      raise exception '9) le quote di Carla sono sparite: i conti degli altri sono cambiati sotto il naso';
    end if;
    perform set_config('request.jwt.claims', json_build_object('sub', a_uid)::text, true);
    perform set_config('role', 'authenticated', true);
    select sum(balance_cents) into v_sum from public.plan_balances(v_plan);
    if v_sum <> 0 then
      raise exception '9) dopo la cancellazione di Carla la somma dei saldi fa %', v_sum;
    end if;
    ok := ok + 1; rep := rep || E'\nok   9) chi cancella l''account non altera il conto degli altri';

    rep := rep || E'\n\n====== TUTTO OK — ' || ok || E' controlli su 9 passati ======';

  exception when others then
    rep := rep || E'\n\n>>> FALLITO: ' || sqlerrm
               || E'\n(' || ok || E' controlli erano passati prima di questo)';
  end;

  raise exception E'\n--- ESITO FASE 3 (questo "errore" è voluto: annulla la prova) ---%\n', rep;
end
$t$;
