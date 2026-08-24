-- 0010_create_plan_full.sql — creare un piano deve essere una cosa sola.
--
-- IL PROBLEMA, visto succedere davvero il 25/8/2026 in produzione:
-- il client creava un piano in tre chiamate — create_plan, poi finalize_plan
-- per emoji/gruppo/tipo, poi una add_plan_extra per ogni domanda. Tre chiamate
-- sono tre transazioni. La seconda è fallita (0009 non era ancora applicata) e
-- il risultato è stato un piano a metà: titolo e opzioni sì, ma senza emoji,
-- senza gruppo — quindi senza i partecipanti del gruppo — e senza domande.
-- Il client intanto mostrava un errore e non lo elencava nemmeno: un piano
-- invisibile a chi l'aveva appena creato.
--
-- Non è un caso di sfortuna, è come era costruito: bastava perdere la rete fra
-- la prima e la seconda chiamata. Qui diventa una funzione sola, quindi una
-- transazione sola: o nasce tutto o non nasce niente.
--
-- create_plan (0001) resta intoccata: questa la chiama.

begin;

do $$
begin
  if not exists (
    select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public' and p.proname = 'finalize_plan'
  ) then
    raise exception 'applica prima 0009_finalize_plan.sql';
  end if;
end $$;

-- p_extras: [{"question":"...","binary":true}] oppure
--           [{"question":"...","options":["A","B"]}]
create function public.create_plan_full(p jsonb,
                                        p_emoji text default null,
                                        p_group uuid default null,
                                        p_kind text default null,
                                        p_allow_proposals boolean default true,
                                        p_extras jsonb default '[]'::jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_res   jsonb;
  v_plan  uuid;
  x       jsonb;
  v_opts  text[];
begin
  v_res  := public.create_plan(p);
  v_plan := (v_res->>'plan_id')::uuid;
  if v_plan is null then
    raise exception 'create_plan non ha reso un piano';
  end if;

  perform public.finalize_plan(v_plan, p_emoji, p_group, p_kind, p_allow_proposals);

  for x in select * from jsonb_array_elements(coalesce(p_extras, '[]'::jsonb)) loop
    if coalesce((x->>'binary')::boolean, false) then
      v_opts := null;
    else
      select array_agg(value) into v_opts
        from jsonb_array_elements_text(coalesce(x->'options', '[]'::jsonb));
    end if;
    perform public.add_plan_extra(v_plan, x->>'question', v_opts,
                                  coalesce((x->>'binary')::boolean, false));
  end loop;

  return v_res;   -- { plan_id, token } come create_plan
end;
$$;

revoke execute on function public.create_plan_full(jsonb, text, uuid, text, boolean, jsonb) from public;
grant  execute on function public.create_plan_full(jsonb, text, uuid, text, boolean, jsonb) to authenticated;

commit;
