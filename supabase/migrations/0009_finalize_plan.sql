-- 0009_finalize_plan.sql — quello che create_plan non sa fare.
--
-- create_plan viene da 0001 e riempie titolo, quando, dove, opzioni e invito.
-- Non tocca le colonne aggiunte dopo: group_id (0003), emoji, kind e
-- allow_proposals (0005). Il client le imposterebbe con una update diretta,
-- ma le scritture passano solo per RPC: quindi ci vuole questa.
--
-- Fa anche la cosa che nel prototipo succede alla creazione: se il piano
-- nasce dentro un gruppo, i membri del gruppo diventano partecipanti. Senza,
-- un piano di gruppo lo vedrebbe solo chi l'ha creato.

begin;

do $$
begin
  if to_regclass('public.groups') is null then
    raise exception 'applica prima 0003_groups.sql';
  end if;
  if not exists (
    select 1 from information_schema.columns
     where table_schema = 'public' and table_name = 'plans' and column_name = 'allow_proposals'
  ) then
    raise exception 'applica prima 0005_extras_comments_proposals.sql';
  end if;
end $$;

create function public.finalize_plan(p_plan uuid,
                                     p_emoji text default null,
                                     p_group uuid default null,
                                     p_kind text default null,
                                     p_allow_proposals boolean default null)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_actor uuid := public.kimari_actor_id();
begin
  if not public.kimari_is_organizer(p_plan) then
    raise exception 'solo chi organizza può sistemare il piano';
  end if;
  if p_kind is not null and p_kind not in ('plan', 'decision') then
    raise exception 'tipo di piano non valido';
  end if;
  -- Il gruppo si sceglie alla creazione: spostare dopo un piano già votato
  -- cambierebbe chi ha diritto di voto a partita in corso.
  if p_group is not null then
    if not public.kimari_is_group_member(p_group) then
      raise exception 'non sei in questo gruppo';
    end if;
    if exists (select 1 from public.plans where id = p_plan and group_id is not null
                                            and group_id <> p_group) then
      raise exception 'il piano è già di un altro gruppo';
    end if;
  end if;

  update public.plans
     set emoji           = coalesce(nullif(btrim(p_emoji), ''), emoji),
         kind            = coalesce(p_kind, kind),
         allow_proposals = coalesce(p_allow_proposals, allow_proposals),
         group_id        = coalesce(p_group, group_id)
   where id = p_plan;

  -- I membri del gruppo entrano nel piano. Come in join_group, solo finché si
  -- sta ancora votando: su un piano confermato cambierebbe i conteggi.
  if p_group is not null then
    insert into public.participants (plan_id, actor_id, role)
    select p_plan, gm.actor_id, 'member'
      from public.group_members gm
     where gm.group_id = p_group
       and gm.actor_id <> v_actor
       and exists (select 1 from public.plans where id = p_plan and status = 'deciding')
       and not exists (select 1 from public.participants pa
                        where pa.plan_id = p_plan and pa.actor_id = gm.actor_id);
  end if;
end;
$$;

revoke execute on function public.finalize_plan(uuid, text, uuid, text, boolean) from public;
grant  execute on function public.finalize_plan(uuid, text, uuid, text, boolean) to authenticated;

commit;
