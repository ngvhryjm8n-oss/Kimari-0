-- 0025 — un piano dove non c'e' niente da decidere nasce gia' deciso.
--
-- IL DIFETTO, dal primo test con persone vere (kimari-work-order-fix.md, fix 1).
-- Si crea un piano con data E luogo gia' fissi — "sabato alle 20, da Gino" —
-- e il piano nasce 'deciding'. L'organizzatore si trova il bottone "Conferma
-- il piano", lo tocca, e si apre una schermata con niente da spuntare: non
-- c'e' nessuna opzione, perche' non c'era niente da votare.
--
-- La root cause IPOTIZZATA nel work order era "il codice si aspetta entrambi i
-- campi come candidati da spuntare". La root cause VERA e' peggio, e sta nel
-- client (corretta insieme a questa migrazione, in live.js):
--
--     if (p.when.mode === 'deciding' || p.where.mode === 'deciding') {
--       await data.confirmPlan(...)        <- con tutto fisso NON viene chiamata
--     }
--     return { toast: 'Kimari! ✅' }       <- ma il successo si annuncia lo stesso
--
-- Il piano restava 'deciding' per sempre, non entrava in calendario, e l'app
-- diceva che era andato tutto bene. Uno schermo che mente: la lezione 1.
--
-- Il server, invece, sapeva gia' fare la cosa giusta — confirm_plan su un
-- piano tutto fisso funziona, verificato in produzione il 30/8. Mancava solo
-- chi lo chiamasse.
--
-- QUI si toglie il problema alla radice: se non c'e' niente da decidere, il
-- bottone non deve nemmeno esistere. Il piano nasce 'confirmed', entra subito
-- in calendario, e la vista del prototipo (che sceglie su status) mostra da
-- sola quella giusta.
--
-- SENZA FANFARA, di proposito: non si scrive nessun plan_changes 'confirmed'
-- e la versione resta 0. Il "Kimari! ✅" e' il premio per una votazione
-- chiusa; un piano che nasce deciso non ha vinto niente.
--
-- COSA RESTA VIVO dentro un piano nato deciso — e non per caso:
--   · il "ci sono": set_rsvp non guarda lo stato del piano
--   · le domande extra: submit_extra_ballot guarda lo stato della DOMANDA
--     (plan_extras.status), non quello del piano
--   · le proposte di modifica: update_plan_field VUOLE status='confirmed',
--     quindi da qui in poi funzionano, mentre prima erano bloccate
--
-- SOLO quando entrambi sono 'fixed'. Con il luogo "decidiamo dopo" qualcosa da
-- decidere c'e' ancora, e la conferma resta un gesto dell'organizzatore.

begin;

create or replace function public.create_plan_full(p jsonb,
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

  -- NUOVO nella 0025. Dentro la stessa transazione della creazione: o il piano
  -- nasce gia' deciso, o non nasce. Farlo dal client con una seconda chiamata
  -- sarebbe di nuovo il difetto del 25/8 — due passi che dovrebbero essere uno.
  update public.plans
     set status = 'confirmed', confirmed_at = now()
   where id = v_plan
     and status = 'deciding'
     and when_mode = 'fixed'
     and where_mode = 'fixed';

  return v_res;   -- { plan_id, token } come create_plan
end;
$$;

commit;
