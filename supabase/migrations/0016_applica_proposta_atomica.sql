-- 0016_applica_proposta_atomica.sql — applicare una proposta erano due passi.
--
-- Il client faceva:
--     update_plan_field(...)   → il piano cambia
--     close_proposal(...)      → la proposta si chiude
--
-- Due transazioni separate. Se la seconda non arriva — rete che cade, telefono
-- che si blocca, app chiusa nel mezzo — il piano è cambiato e la proposta resta
-- aperta. Il gruppo vede una proposta in attesa per una modifica già fatta, e
-- se qualcuno la riapplica il piano fa un'altra versione identica alla
-- precedente, con una voce di storia che dice "cambiato" senza che sia
-- cambiato niente.
--
-- Non è teoria: la stessa struttura, sulla creazione di un piano, ha lasciato
-- un piano a metà in produzione il 25/8/2026 — ed è per questo che esiste la
-- 0010. Qui si fa la stessa cosa: un passo solo, che riesce o non fa niente.

create or replace function public.apply_proposal(p_proposal uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_prop  public.proposals%rowtype;
  v_actor uuid := public.kimari_actor_id();
begin
  select * into v_prop from public.proposals where id = p_proposal;
  if not found then
    raise exception 'proposta non trovata';
  end if;

  -- Il controllo sta QUI e non nel client: è l'unico posto dove non si può
  -- aggirare. update_plan_field lo rifà per conto suo, ed è giusto così —
  -- deve reggere anche se chiamata da sola.
  -- kimari_is_organizer, non is_organizer: nel database esistono entrambi i
  -- nomi in punti diversi, e sbagliarlo qui avrebbe dato "function does not
  -- exist" solo al primo uso vero, non applicando la migrazione.
  if not public.kimari_is_organizer(v_prop.plan_id) then
    raise exception 'solo chi organizza può applicare una proposta';
  end if;

  if v_prop.status not in ('open', 'approved') then
    raise exception 'questa proposta è già stata chiusa';
  end if;

  -- Un passo solo: se una delle due parti fallisce, non è successo niente.
  perform public.update_plan_field(
    v_prop.plan_id, v_prop.field, v_prop.new_value,
    coalesce(nullif(btrim(v_prop.reason), ''), null));

  update public.proposals
     set status = 'applied', closed_at = now(), closed_by = v_actor
   where id = p_proposal;
end;
$$;

revoke all on function public.apply_proposal(uuid) from public;
grant execute on function public.apply_proposal(uuid) to anon, authenticated;

-- ------------------------------------------------------------------ prova
do $prova$
declare
  v_ok boolean;
begin
  select count(*) = 1 into v_ok
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
   where n.nspname = 'public' and p.proname = 'apply_proposal';
  if not v_ok then raise exception '0016: apply_proposal non e stata creata'; end if;

  -- Le colonne che la funzione scrive devono esistere: se proposals non ha
  -- closed_at o closed_by, l'errore uscirebbe solo al primo uso vero.
  select count(*) = 2 into v_ok from information_schema.columns
   where table_schema = 'public' and table_name = 'proposals'
     and column_name in ('closed_at', 'closed_by');
  if not v_ok then
    raise exception '0016: proposals non ha closed_at e closed_by';
  end if;

  -- Anche la funzione che si chiama deve esistere col nome giusto: e' il tipo
  -- di errore che altrimenti esce solo quando qualcuno applica una proposta
  -- vera, cioe' il piu' tardi possibile.
  select count(*) >= 1 into v_ok
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
   where n.nspname = 'public' and p.proname = 'kimari_is_organizer';
  if not v_ok then raise exception '0016: manca kimari_is_organizer'; end if;

  raise notice '0016: ok — applicare una proposta e un passo solo';
end $prova$;
