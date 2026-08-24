-- 0008_domande_in_corso.sql — "Invitiamo anche Matteo?" su un piano già avviato.
--
-- Tre cose:
--
--   1. BUG: una domanda Sì/No accettava ENTRAMBE le risposte.
--      submit_extra_ballot è approval voting (si segnano tutte le opzioni che
--      vanno bene), giusto per "Cosa portiamo?", assurdo per "Invitiamo
--      Matteo?": si poteva votare Sì e No insieme, e il conteggio diventava
--      carta straccia. Ora su una domanda binaria si sceglie una risposta sola.
--
--   2. Una domanda la può aggiungere ogni PARTECIPANTE, non solo chi organizza.
--      "Invitiamo anche Matteo?" è precisamente il tipo di cosa che viene in
--      mente a chiunque, non all'organizzatore. Con due argini: massimo 5
--      domande aperte per piano (come le 5 opzioni per campo del trigger di
--      0001) e si resta padroni della propria — chi l'ha aperta la può togliere.
--
--   3. Si vede CHI ha chiesto cosa. Senza, in un gruppo da dieci una domanda
--      spuntata dal nulla non si sa a chi attribuirla.
--
-- Il piano non deve essere in nessuno stato particolare: la domanda si può
-- aggiungere mentre si vota su quando e dove, ed è il caso d'uso di partenza.

begin;

do $$
begin
  if to_regclass('public.plan_extras') is null then
    raise exception 'applica prima 0005_extras_comments_proposals.sql';
  end if;
  if exists (
    select 1 from information_schema.columns
     where table_schema = 'public' and table_name = 'plan_extras'
       and column_name = 'created_by'
  ) then
    raise exception '0008 è già applicata: plan_extras.created_by esiste.';
  end if;
end $$;

-- Chi ha aperto la domanda. Resta anche se cancella l'account: la domanda è
-- del piano, non sua, e il nome diventa 'Account eliminato' come altrove.
alter table public.plan_extras
  add column created_by uuid references public.actors(id) on delete set null;

-- ---------------------------------------------------------------- 1 + 2 + 3
create or replace function public.add_plan_extra(p_plan uuid, p_question text,
                                                 p_options text[], p_binary boolean default false)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_actor   uuid := public.kimari_actor_id();
  v_extra   uuid;
  v_options text[];
  v_label   text;
  v_i       integer := 0;
  v_aperte  integer;
begin
  -- Cambiato: partecipa = può chiedere. Prima serviva essere l'organizzatore.
  if v_actor is null or not public.kimari_is_participant(p_plan) then
    raise exception 'non partecipi a questo piano';
  end if;
  if coalesce(btrim(p_question), '') = '' then
    raise exception 'la domanda non può essere vuota';
  end if;

  select count(*) into v_aperte
    from public.plan_extras
   where plan_id = p_plan and status = 'deciding';
  if v_aperte >= 5 then
    raise exception 'ci sono già 5 domande aperte su questo piano: chiudetene una prima';
  end if;

  v_options := case when p_binary then array['Sì', 'No'] else coalesce(p_options, '{}') end;
  if array_length(v_options, 1) is null or array_length(v_options, 1) < 2 then
    raise exception 'servono almeno due opzioni';
  end if;
  if array_length(v_options, 1) > 5 then
    raise exception 'massimo 5 opzioni per domanda';
  end if;

  insert into public.plan_extras (plan_id, question, is_binary, position, created_by)
  values (p_plan, btrim(p_question), coalesce(p_binary, false),
          coalesce((select max(position) + 1 from public.plan_extras where plan_id = p_plan), 0),
          v_actor)
  returning id into v_extra;

  foreach v_label in array v_options loop
    if btrim(v_label) <> '' then
      insert into public.extra_candidates (extra_id, label, position)
      values (v_extra, btrim(v_label), v_i);
      v_i := v_i + 1;
    end if;
  end loop;

  return v_extra;
end;
$$;

-- Su una domanda Sì/No si risponde una cosa sola.
create or replace function public.submit_extra_ballot(p_extra uuid, p_candidates uuid[])
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_actor  uuid := public.kimari_actor_id();
  v_plan   uuid;
  v_binary boolean;
  v_status text;
  v_n      integer := coalesce(array_length(p_candidates, 1), 0);
begin
  select plan_id, is_binary, status into v_plan, v_binary, v_status
    from public.plan_extras where id = p_extra;
  if v_plan is null then
    raise exception 'domanda non trovata';
  end if;
  if v_actor is null or not public.kimari_is_participant(v_plan) then
    raise exception 'non partecipi a questo piano';
  end if;
  if v_status <> 'deciding' then
    raise exception 'questa domanda è già stata decisa';
  end if;

  -- Il punto: Sì e No insieme non vogliono dire niente.
  if v_binary and v_n > 1 then
    raise exception 'è una domanda sì o no: scegline una sola';
  end if;

  delete from public.extra_approvals where extra_id = p_extra and actor_id = v_actor;

  insert into public.extra_approvals (extra_id, candidate_id, actor_id)
  select p_extra, c.id, v_actor
    from public.extra_candidates c
   where c.extra_id = p_extra
     and c.id = any(coalesce(p_candidates, '{}'));
end;
$$;

-- Chi l'ha aperta la ritira; chi organizza fa pulizia. Solo finché è aperta:
-- una domanda già decisa fa parte della storia del piano.
create function public.remove_plan_extra(p_extra uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_actor uuid := public.kimari_actor_id();
  v_plan  uuid;
  v_by    uuid;
  v_status text;
begin
  select plan_id, created_by, status into v_plan, v_by, v_status
    from public.plan_extras where id = p_extra;
  if v_plan is null then
    raise exception 'domanda non trovata';
  end if;
  if v_status <> 'deciding' then
    raise exception 'questa domanda è già stata decisa: resta nella storia del piano';
  end if;
  if v_by is distinct from v_actor and not public.kimari_is_organizer(v_plan) then
    raise exception 'puoi togliere solo le domande che hai aperto tu';
  end if;

  delete from public.plan_extras where id = p_extra;   -- opzioni e voti a cascata
end;
$$;

revoke execute on function public.remove_plan_extra(uuid) from public;
grant  execute on function public.remove_plan_extra(uuid) to authenticated;

commit;
