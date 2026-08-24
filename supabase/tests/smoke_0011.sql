-- smoke_0011.sql — ritardi, assenze, amici, silenziati, moderazione.
--
--   ⚠️  ALLA FINE VEDRAI UN ERRORE ROSSO. È VOLUTO, ED È IL RESOCONTO.
-- Come gli altri: annulla la prova e non lascia righe.

do $t$
declare
  a_uid uuid := gen_random_uuid();   -- Anna, organizza
  b_uid uuid := gen_random_uuid();   -- Bruno, partecipa
  c_uid uuid := gen_random_uuid();   -- Carla, estranea
  a_id uuid; b_id uuid; c_id uuid;
  v_plan uuid; v_group uuid; v_com uuid; v_sys uuid;
  v_ptype text; v_res jsonb; v_bool boolean;
  v_min integer; v_rsvp text;
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

    select pg_catalog.format_type(p.proargtypes[0], null) into v_ptype
      from pg_proc p join pg_namespace nsp on nsp.oid = p.pronamespace
     where nsp.nspname = 'public' and p.proname = 'create_plan' limit 1;

    perform set_config('request.jwt.claims', json_build_object('sub', a_uid)::text, true);
    perform set_config('role', 'authenticated', true);
    v_group := public.create_group('Cena', '🍕', '#FF9500');
    execute format('select public.create_plan(p := $1::%s)::jsonb', v_ptype) into v_res
     using jsonb_build_object('title','Pizza','when_mode','fixed','where_mode','fixed',
             'place_name','Da Gino','starts_at',(now() + interval '2 days')::text,
             'timezone','Europe/Rome')::text;
    v_plan := (v_res->>'plan_id')::uuid;

    perform set_config('role', 'postgres', true);
    insert into public.participants (plan_id, actor_id, role) values (v_plan, b_id, 'member');

    ------------------------------------------------- 1) ritardo
    perform set_config('request.jwt.claims', json_build_object('sub', b_uid)::text, true);
    perform set_config('role', 'authenticated', true);
    perform public.set_my_late(v_plan, 20, 'sono in tangenziale');

    perform set_config('role', 'postgres', true);
    select late_minutes, rsvp::text into v_min, v_rsvp
      from public.participants where plan_id = v_plan and actor_id = b_id;
    if v_min <> 20 then raise exception '1) i minuti di ritardo sono % invece di 20', v_min; end if;
    -- Dire "arrivo tardi" vuol dire che vieni: il forse deve diventare sì.
    if v_rsvp is distinct from 'yes' then
      raise exception '1) il ritardo non ha messo la risposta a sì (è %)', v_rsvp;
    end if;
    ok := ok + 1; rep := rep || E'\nok   1) il ritardo si salva in minuti e implica che vieni';

    ------------------------------------------------- 2) assenza
    perform set_config('request.jwt.claims', json_build_object('sub', b_uid)::text, true);
    perform set_config('role', 'authenticated', true);
    perform public.set_my_absence(v_plan, 'mi è saltato fuori un impegno');

    perform set_config('role', 'postgres', true);
    select late_minutes, rsvp::text into v_min, v_rsvp
      from public.participants where plan_id = v_plan and actor_id = b_id;
    if v_rsvp is distinct from 'no' then raise exception '2) la risposta non è "no" (è %)', v_rsvp; end if;
    if v_min is not null then
      raise exception '2) è rimasto un ritardo su chi non viene più: le due cose insieme non stanno';
    end if;
    select count(*) into n from public.comments
     where plan_id = v_plan and is_system and kind = 'absent';
    if n <> 1 then raise exception '2) il gruppo non è stato avvisato'; end if;
    ok := ok + 1; rep := rep || E'\nok   2) non venire più cancella il ritardo e avvisa il gruppo';

    ------------------------------------------------- 3) amici solo se conosciuti
    perform set_config('request.jwt.claims', json_build_object('sub', c_uid)::text, true);
    perform set_config('role', 'authenticated', true);
    begin
      perform public.add_friend(a_id);
      raise exception '3) un''estranea ha aggiunto Anna: la rubrica è diventata un elenco del telefono';
    exception when others then
      if sqlerrm not like '%condiviso%' then raise; end if;
    end;
    ok := ok + 1; rep := rep || E'\nok   3) si diventa amici solo dopo un piano o un gruppo insieme';

    perform set_config('request.jwt.claims', json_build_object('sub', b_uid)::text, true);
    perform public.add_friend(a_id);
    perform set_config('role', 'postgres', true);
    select count(*) into n from public.friendships where actor_id = b_id and friend_id = a_id;
    if n <> 1 then raise exception '3b) Bruno non è riuscito ad aggiungere Anna'; end if;
    ok := ok + 1; rep := rep || E'\nok   4) chi ha condiviso un piano può aggiungere';

    ------------------------------------------------- 5) la rubrica è privata
    perform set_config('request.jwt.claims', json_build_object('sub', a_uid)::text, true);
    perform set_config('role', 'authenticated', true);
    select count(*) into n from public.friendships;
    if n <> 0 then raise exception '5) BUCO RLS: Anna vede la rubrica di Bruno'; end if;
    ok := ok + 1; rep := rep || E'\nok   5) RLS: la rubrica non la vede nessun altro';

    ------------------------------------------------- 6) silenziare
    perform set_config('request.jwt.claims', json_build_object('sub', a_uid)::text, true);
    v_bool := public.toggle_group_mute(v_group);
    if v_bool is not true then raise exception '6) il primo tocco doveva silenziare'; end if;
    v_bool := public.toggle_group_mute(v_group);
    if v_bool is not false then raise exception '6) il secondo tocco doveva riattivare'; end if;
    ok := ok + 1; rep := rep || E'\nok   6) toggle_group_mute torna il nuovo stato, non quello vecchio';

    ------------------------------------------------- 7) commenti
    perform set_config('request.jwt.claims', json_build_object('sub', b_uid)::text, true);
    v_com := public.add_comment(v_plan, 'porto io il vino');
    perform set_config('role', 'postgres', true);
    select id into v_sys from public.comments
     where plan_id = v_plan and is_system limit 1;

    -- Un estraneo non tocca niente
    perform set_config('request.jwt.claims', json_build_object('sub', c_uid)::text, true);
    perform set_config('role', 'authenticated', true);
    begin
      perform public.delete_comment(v_com);
      raise exception '7) un''estranea ha cancellato il commento di Bruno';
    exception when others then
      if sqlerrm not like '%solo i tuoi%' then raise; end if;
    end;

    -- I messaggi di sistema non si toccano, nemmeno da organizzatore
    perform set_config('request.jwt.claims', json_build_object('sub', a_uid)::text, true);
    begin
      perform public.delete_comment(v_sys);
      raise exception '7) cancellato un messaggio di sistema: la storia del piano si può riscrivere';
    exception when others then
      if sqlerrm not like '%storia del piano%' then raise; end if;
    end;

    -- L'organizzatore modera quelli veri
    perform public.delete_comment(v_com);
    perform set_config('role', 'postgres', true);
    select count(*) into n from public.comments where id = v_com;
    if n <> 0 then raise exception '7) l''organizzatore non è riuscito a moderare'; end if;
    ok := ok + 1; rep := rep || E'\nok   7) commenti: solo i propri, o l''organizzatore; il sistema mai';

    ------------------------------------------------- 8) sciogliere il gruppo
    perform set_config('role', 'postgres', true);
    update public.plans set group_id = v_group, status = 'deciding' where id = v_plan;

    perform set_config('request.jwt.claims', json_build_object('sub', a_uid)::text, true);
    perform set_config('role', 'authenticated', true);
    perform public.delete_group(v_group);

    perform set_config('role', 'postgres', true);
    select count(*) into n from public.groups where id = v_group;
    if n <> 0 then raise exception '8) il gruppo non è stato sciolto'; end if;
    -- Il punto: i piani NON spariscono. Contengono voti, commenti e spese di
    -- altre persone, e un admin non deve poterli far sparire con un bottone.
    select count(*) into n from public.plans where id = v_plan;
    if n <> 1 then raise exception '8) sciogliere il gruppo ha cancellato il piano e la storia di tutti'; end if;
    select status::text into v_rsvp from public.plans where id = v_plan;
    if v_rsvp <> 'cancelled' then
      raise exception '8) il piano ancora ai voti doveva essere annullato (è %)', v_rsvp;
    end if;
    ok := ok + 1; rep := rep || E'\nok   8) sciogliere un gruppo annulla i piani, non li cancella';

    rep := rep || E'\n\n====== TUTTO OK — ' || ok || E' controlli su 8 passati ======';

  exception when others then
    rep := rep || E'\n\n>>> FALLITO: ' || sqlerrm
               || E'\n(' || ok || E' controlli erano passati prima di questo)';
  end;

  raise exception E'\n--- ESITO 0011 (questo "errore" è voluto: annulla la prova) ---%\n', rep;
end
$t$;
