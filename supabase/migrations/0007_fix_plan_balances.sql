-- 0007_fix_plan_balances.sql — correzione di un errore in 0006.
--
-- IL BUG: plan_balances() leggeva l'elenco delle persone da `participants`.
-- Quando qualcuno lascia il piano o cancella l'account, la sua riga in
-- participants sparisce — ma le sue quote in expense_shares restano, perché
-- devono restare (toglierle ridividerebbe il conto fra gli altri).
--
-- Risultato: il suo debito continuava a pesare sulle quote altrui, ma il suo
-- saldo non compariva più nel riepilogo. La somma dei saldi smetteva di fare
-- zero, e i soldi che quella persona doveva sparivano dallo schermo senza che
-- nessuno li avesse pagati.
--
-- LA CORREZIONE: l'elenco si costruisce da chi compare DAVVERO nei conti —
-- partecipanti attuali, chi ha pagato, chi era in una divisione, chi ha
-- rimborsato o è stato rimborsato. Chi ha saldo zero e non partecipa più esce
-- da solo, perché il suo saldo è zero.
--
-- Se stai applicando le migrazioni da zero, 0006 contiene già la versione
-- giusta e questo file è un innocuo create-or-replace identico.

begin;

do $$
begin
  if to_regclass('public.expenses') is null then
    raise exception 'applica prima 0006_media_expenses_places.sql';
  end if;
end $$;

create or replace function public.plan_balances(p_plan uuid)
returns table (actor_id uuid, balance_cents bigint)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  with quote as (
    select es.expense_id,
           es.actor_id,
           e.paid_by,
           e.amount_cents,
           count(*)     over (partition by es.expense_id) as n,
           row_number() over (partition by es.expense_id order by es.actor_id) as rn
      from public.expense_shares es
      join public.expenses e on e.id = es.expense_id
     where e.plan_id = p_plan
       and e.voided_at is null
  ),
  dovuto as (
    select actor_id,
           sum(amount_cents / n + case when rn <= amount_cents % n then 1 else 0 end) as cents
      from quote group by actor_id
  ),
  pagato as (
    select paid_by as actor_id, sum(amount_cents) as cents
      from public.expenses
     where plan_id = p_plan and voided_at is null
     group by paid_by
  ),
  reso as (
    select from_actor as actor_id, sum(amount_cents) as cents
      from public.settlements where plan_id = p_plan group by from_actor
  ),
  ricevuto as (
    select to_actor as actor_id, sum(amount_cents) as cents
      from public.settlements where plan_id = p_plan group by to_actor
  ),
  -- Il punto della correzione: chi compare nei conti, non chi è nel piano.
  attori as (
    select actor_id from public.participants where plan_id = p_plan
    union
    select paid_by from public.expenses where plan_id = p_plan and voided_at is null
    union
    select es.actor_id from public.expense_shares es
      join public.expenses e on e.id = es.expense_id
     where e.plan_id = p_plan and e.voided_at is null
    union
    select from_actor from public.settlements where plan_id = p_plan
    union
    select to_actor   from public.settlements where plan_id = p_plan
  )
  select p.actor_id,
         ( coalesce((select cents from pagato   where actor_id = p.actor_id), 0)
         - coalesce((select cents from dovuto   where actor_id = p.actor_id), 0)
         + coalesce((select cents from reso     where actor_id = p.actor_id), 0)
         - coalesce((select cents from ricevuto where actor_id = p.actor_id), 0)
         )::bigint
    from attori p
   where public.kimari_is_participant(p_plan);
$$;

revoke execute on function public.plan_balances(uuid) from public;
grant  execute on function public.plan_balances(uuid) to authenticated;

commit;
