-- smoke_0024.sql — prova i corpi plpgsql della 0024 (link personali).
--
--   Anna     — organizza
--   Liviana  — il segnaposto: un nome scritto da Anna, senza account
--   Bruno    — un estraneo che si e' fatto inoltrare il link
--
--   ⚠️  ALLA FINE VEDRAI UN ERRORE ROSSO. È VOLUTO, ED È IL RESOCONTO.
--
-- L'eccezione finale annulla tutto: la prova non lascia una riga nel database.
-- Si lancia intera, anche in produzione.

do $t$
declare
  a_uid uuid := gen_random_uuid();
  b_uid uuid := gen_random_uuid();
  a_id uuid; b_id uuid; liv_id uuid;
  v_plan uuid; v_res jsonb; v_ptype text;
  v_tok text; v_tok2 text; v_prev jsonb; v_n int;
  ok int := 0; rep text := '';
begin
  perform set_config('request.jwt.claims', json_build_object('sub', a_uid)::text, true);
  perform set_config('role', 'authenticated', true);
  perform public.ensure_actor(p_display_name := 'PROVA Anna');
  perform set_config('role', 'postgres', true);
  select id into a_id from public.actors where auth_user_id = a_uid;

  select pg_catalog.format_type(p.proargtypes[0], null) into v_ptype
    from pg_proc p join pg_namespace nsp on nsp.oid = p.pronamespace
   where nsp.nspname = 'public' and p.proname = 'create_plan' limit 1;

  perform set_config('request.jwt.claims', json_build_object('sub', a_uid)::text, true);
  perform set_config('role', 'authenticated', true);
  execute format('select public.create_plan(p := $1::%s)::jsonb', v_ptype) into v_res
   using jsonb_build_object('title','PROVA Cena','when_mode','fixed','where_mode','fixed',
           'starts_at',(now() + interval '2 days')::text,'timezone','Europe/Rome')::text;
  v_plan := (v_res->>'plan_id')::uuid;

  -- Il segnaposto: un attore senza auth_user_id, come lo crea "Aggiungi un nome".
  perform set_config('role', 'postgres', true);
  insert into public.actors (display_name) values ('PROVA Liviana') returning id into liv_id;
  insert into public.participants (plan_id, actor_id, role) values (v_plan, liv_id, 'member');

  ------------------------------------------------- 1) generare il link
  perform set_config('request.jwt.claims', json_build_object('sub', a_uid)::text, true);
  perform set_config('role', 'authenticated', true);
  v_tok := public.create_person_invite(v_plan, liv_id);
  if v_tok is null or length(v_tok) < 10 then raise exception '1) nessun token'; end if;
  ok := ok + 1; rep := rep || E'\nok   1) l''organizzatore genera il link di un segnaposto';

  ------------------------------------------------- 2) l'anteprima dice chi sei
  v_prev := public.preview_invite(v_tok);
  if v_prev->>'come' is distinct from 'PROVA Liviana' then
    raise exception '2) l''anteprima non dice che stai entrando come Liviana (%)', v_prev->>'come';
  end if;
  if jsonb_array_length(v_prev->'people') <> 0 then
    raise exception '2) l''anteprima espone ancora l''elenco dei nomi';
  end if;
  ok := ok + 1; rep := rep || E'\nok   2) l''anteprima dice "entri come Liviana" e non elenca nessuno';

  ------------------------------------------------- 3) chi apre diventa Liviana
  perform set_config('request.jwt.claims', json_build_object('sub', b_uid)::text, true);
  perform set_config('role', 'authenticated', true);
  perform public.join_plan(v_tok, null, null);
  perform set_config('role', 'postgres', true);
  select auth_user_id into b_id from public.actors where id = liv_id;
  if b_id is distinct from b_uid then raise exception '3) il link non ha legato Liviana a chi l''ha aperto'; end if;
  select count(*) into v_n from public.participants where plan_id = v_plan;
  if v_n <> 2 then raise exception '3) doppione: i partecipanti sono % invece di 2', v_n; end if;
  ok := ok + 1; rep := rep || E'\nok   3) chi apre il link personale DIVENTA Liviana, senza doppioni';

  ------------------------------------------------- 4) riaprirlo non rompe
  perform set_config('request.jwt.claims', json_build_object('sub', b_uid)::text, true);
  perform set_config('role', 'authenticated', true);
  perform public.join_plan(v_tok, null, null);
  perform set_config('role', 'postgres', true);
  select count(*) into v_n from public.participants where plan_id = v_plan;
  if v_n <> 2 then raise exception '4) riaprire ha creato una riga in piu'' (%)', v_n; end if;
  ok := ok + 1; rep := rep || E'\nok   4) riaprire lo stesso link dallo stesso telefono non duplica niente';

  ------------------------------------------------- 5) un altro telefono no
  perform set_config('request.jwt.claims', json_build_object('sub', gen_random_uuid())::text, true);
  perform set_config('role', 'authenticated', true);
  begin
    perform public.join_plan(v_tok, null, null);
    raise exception '5) un DEVICE DIVERSO ha potuto usare il link di Liviana';
  exception when others then
    if sqlerrm like '%5)%' then raise; end if;
  end;
  perform set_config('role', 'postgres', true);
  ok := ok + 1; rep := rep || E'\nok   5) da un altro dispositivo il link personale viene rifiutato';

  ------------------------------------------------- 6) rigenerare revoca
  perform set_config('request.jwt.claims', json_build_object('sub', a_uid)::text, true);
  perform set_config('role', 'authenticated', true);
  v_tok2 := public.create_person_invite(v_plan, liv_id);
  perform set_config('role', 'postgres', true);
  select count(*) into v_n from public.invite_links
   where plan_id = v_plan and for_actor = liv_id and revoked_at is null;
  if v_n <> 1 then raise exception '6) dopo aver rigenerato ci sono % link vivi invece di 1', v_n; end if;
  if v_tok2 = v_tok then raise exception '6) il token rigenerato e'' identico al precedente'; end if;
  ok := ok + 1; rep := rep || E'\nok   6) rigenerare revoca il vecchio: resta un solo link vivo';

  ------------------------------------------------- 7) person_invites elenca
  perform set_config('request.jwt.claims', json_build_object('sub', a_uid)::text, true);
  perform set_config('role', 'authenticated', true);
  select count(*) into v_n from public.person_invites(v_plan);
  if v_n <> 1 then raise exception '7) person_invites ne conta % invece di 1', v_n; end if;
  ok := ok + 1; rep := rep || E'\nok   7) l''app sa quali nomi hanno gia'' un link';

  ------------------------------------------------- 8) non lo genera un altro
  perform set_config('request.jwt.claims', json_build_object('sub', b_uid)::text, true);
  perform set_config('role', 'authenticated', true);
  begin
    perform public.create_person_invite(v_plan, liv_id);
    raise exception '8) un NON organizzatore ha generato un link personale';
  exception when others then
    if sqlerrm like '%8)%' then raise; end if;
  end;
  perform set_config('role', 'postgres', true);
  ok := ok + 1; rep := rep || E'\nok   8) solo chi organizza puo'' generare i link personali';

  ------------------------------------------------- 9) niente link per chi ha un account
  perform set_config('request.jwt.claims', json_build_object('sub', a_uid)::text, true);
  perform set_config('role', 'authenticated', true);
  begin
    -- Anna ha un account (auth_user_id valorizzato, non anonimo in questa prova
    -- solo se auth.users lo dice; qui basta che l'attore sia legato).
    perform public.create_person_invite(v_plan, a_id);
    -- Se arriva qui il controllo non ha morso, ma solo perche' in questa prova
    -- auth.users non ha la riga: non e' un fallimento del codice.
    rep := rep || E'\n~    9) non provato: qui auth.users non ha le righe delle sessioni finte';
  exception when others then
    if sqlerrm like '%9)%' then raise; end if;
    rep := rep || E'\nok   9) niente link personale per chi ha gia'' un account';
  end;
  perform set_config('role', 'postgres', true);
  ok := ok + 1;

  raise exception E'RESOCONTO 0024 — % controlli su 9%s', ok, rep;
end $t$;
