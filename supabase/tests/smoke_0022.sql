-- smoke_0022.sql — prova i corpi plpgsql della 0022 (preferenze delle notifiche).
--
-- Simula due persone:
--   Anna  — organizza il piano
--   Bruno — partecipa, ha un dispositivo, e cambia idea sulle notifiche
--
--
--   ⚠️  ALLA FINE VEDRAI UN ERRORE ROSSO. È VOLUTO, ED È IL RESOCONTO.
--
-- L'editor SQL di Supabase non mostra i RAISE NOTICE, quindi il riepilogo
-- arriva come messaggio d'eccezione. In più l'eccezione annulla tutto, così la
-- prova non lascia una riga nel database.
--
--   ogni riga "ok"   = controllo passato
--   riga "FALLITO"   = c'è qualcosa da sistemare, e dice cosa
--
-- Si lancia intero, anche in produzione: non scrive niente di permanente.

do $t$
declare
  a_uid uuid := gen_random_uuid();
  b_uid uuid := gen_random_uuid();
  a_id  uuid; b_id uuid;
  v_group uuid; v_plan uuid; v_res jsonb; v_ptype text;
  v_n integer; v_b boolean;
  ok integer := 0; rep text := '';
begin
  ------------------------------------------------------------ preparazione
  perform set_config('request.jwt.claims', json_build_object('sub', a_uid)::text, true);
  perform set_config('role', 'authenticated', true);
  perform public.ensure_actor(p_display_name := 'PROVA Anna');
  perform set_config('role', 'postgres', true);
  select id into a_id from public.actors where auth_user_id = a_uid;

  perform set_config('request.jwt.claims', json_build_object('sub', b_uid)::text, true);
  perform set_config('role', 'authenticated', true);
  perform public.ensure_actor(p_display_name := 'PROVA Bruno');
  perform set_config('role', 'postgres', true);
  select id into b_id from public.actors where auth_user_id = b_uid;

  select pg_catalog.format_type(p.proargtypes[0], null) into v_ptype
    from pg_proc p join pg_namespace nsp on nsp.oid = p.pronamespace
   where nsp.nspname = 'public' and p.proname = 'create_plan' limit 1;

  perform set_config('request.jwt.claims', json_build_object('sub', a_uid)::text, true);
  perform set_config('role', 'authenticated', true);
  v_group := public.create_group('PROVA Cena', '🍕', '#FF9500');
  execute format('select public.create_plan(p := $1::%s)::jsonb', v_ptype) into v_res
   using jsonb_build_object('title','PROVA Pizza','when_mode','fixed','where_mode','fixed',
           'place_name','Da Gino','starts_at',(now() + interval '2 days')::text,
           'timezone','Europe/Rome','group_id',v_group)::text;
  v_plan := (v_res->>'plan_id')::uuid;

  perform set_config('role', 'postgres', true);
  insert into public.participants (plan_id, actor_id, role)
  values (v_plan, b_id, 'member') on conflict do nothing;
  -- Bruno ha un dispositivo: senza, push_accoda lo salterebbe comunque e la
  -- prova direbbe "ok" per il motivo sbagliato.
  insert into public.push_subscriptions (actor_id, endpoint, p256dh, auth, lingua)
  values (b_id, 'https://esempio.invalid/prova-0022', 'x', 'y', 'it');

  ------------------------------------------------- 1) i valori di partenza
  if public.push_default('comment') is not false then
    raise exception '1) i commenti dovrebbero partire spenti';
  end if;
  if public.push_default('confirm') is not true then
    raise exception '1) la conferma dovrebbe partire accesa';
  end if;
  ok := ok + 1; rep := rep || E'\nok   1) i valori di partenza sono quelli del client';

  ------------------------------------------------- 2) senza preferenze, accoda
  delete from public.push_coda where plan_id = v_plan;
  v_n := public.push_accoda(v_plan, 'confirm', a_id);
  if v_n <> 1 then
    raise exception '2) chi non ha toccato niente doveva ricevere la conferma (accodate %)', v_n;
  end if;
  ok := ok + 1; rep := rep || E'\nok   2) chi non ha espresso preferenze riceve i valori di partenza';

  ------------------------------------------------- 3) categoria spenta ferma
  perform set_config('request.jwt.claims', json_build_object('sub', b_uid)::text, true);
  perform set_config('role', 'authenticated', true);
  perform public.set_push_pref('confirm', false);
  perform set_config('role', 'postgres', true);

  delete from public.push_coda where plan_id = v_plan;
  v_n := public.push_accoda(v_plan, 'confirm', a_id);
  if v_n <> 0 then
    raise exception '3) la categoria spenta non ha fermato niente (accodate %)', v_n;
  end if;
  ok := ok + 1; rep := rep || E'\nok   3) spegnere una categoria ferma davvero la notifica';

  ------------------------------------------------- 4) le altre continuano
  delete from public.push_coda where plan_id = v_plan;
  v_n := public.push_accoda(v_plan, 'change', a_id);
  if v_n <> 1 then
    raise exception '4) spegnere la conferma ha spento anche le modifiche (accodate %)', v_n;
  end if;
  ok := ok + 1; rep := rep || E'\nok   4) spegnerne una non spegne le altre';

  ------------------------------------------------- 5) tornare indietro pulisce
  perform set_config('request.jwt.claims', json_build_object('sub', b_uid)::text, true);
  perform set_config('role', 'authenticated', true);
  perform public.set_push_pref('confirm', true);
  perform set_config('role', 'postgres', true);
  if exists (select 1 from public.push_prefs where actor_id = b_id and genere = 'confirm') then
    raise exception '5) tornare al valore di partenza doveva togliere la riga, non riscriverla';
  end if;
  ok := ok + 1; rep := rep || E'\nok   5) tornare al valore di partenza non lascia righe inutili';

  ------------------------------------------------- 6) il gruppo silenziato
  insert into public.mutes (actor_id, group_id) values (b_id, v_group)
    on conflict do nothing;
  delete from public.push_coda where plan_id = v_plan;
  v_n := public.push_accoda(v_plan, 'confirm', a_id);
  if v_n <> 0 then
    raise exception '6) il gruppo silenziato ha comunque accodato (%)', v_n;
  end if;
  delete from public.mutes where actor_id = b_id and group_id = v_group;
  ok := ok + 1; rep := rep || E'\nok   6) silenziare un gruppo ferma anche le push, non solo Novità';

  ------------------------------------------------- 7) il voto all'organizzatore
  -- Il voto non passa da push_accoda: ha il suo trigger, e prima della 0022
  -- era l'unica notifica che ignorava le preferenze.
  perform set_config('role', 'postgres', true);
  insert into public.push_subscriptions (actor_id, endpoint, p256dh, auth, lingua)
  values (a_id, 'https://esempio.invalid/prova-0022-anna', 'x', 'y', 'it');

  perform set_config('request.jwt.claims', json_build_object('sub', a_uid)::text, true);
  perform set_config('role', 'authenticated', true);
  perform public.set_push_pref('vote', false);
  perform set_config('role', 'postgres', true);

  delete from public.push_coda where plan_id = v_plan;
  insert into public.ballots (plan_id, actor_id) values (v_plan, b_id)
    on conflict (plan_id, actor_id) do update set created_at = now();
  select count(*) into v_n from public.push_coda
   where plan_id = v_plan and genere = 'vote' and actor_id = a_id;
  if v_n <> 0 then
    raise exception '7) l''organizzatore aveva spento i voti e gliene è arrivato uno lo stesso';
  end if;
  ok := ok + 1; rep := rep || E'\nok   7) anche il voto rispetta le preferenze';

  ------------------------------------------------- 8) nessuno scrive per altri
  perform set_config('request.jwt.claims', json_build_object('sub', b_uid)::text, true);
  perform set_config('role', 'authenticated', true);
  perform public.set_push_pref('media', true);
  perform set_config('role', 'postgres', true);
  select count(*) into v_n from public.push_prefs where actor_id = a_id and genere = 'media';
  if v_n <> 0 then
    raise exception '8) Bruno ha scritto una preferenza nella riga di Anna';
  end if;
  ok := ok + 1; rep := rep || E'\nok   8) set_push_pref tocca solo le proprie righe';

  raise exception E'RESOCONTO 0022 — % controlli passati su 8%s', ok, rep;
end $t$;
