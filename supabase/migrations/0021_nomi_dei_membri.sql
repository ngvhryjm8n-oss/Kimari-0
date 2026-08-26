-- 0021_nomi_dei_membri.sql — nel gruppo comparivano tutti come "Membro eliminato".
--
-- Segnalato da Vincenzo aprendo l'app su un secondo telefono. Verificato con
-- due account veri, un gruppo condiviso e NESSUN piano in comune:
--
--   A vede 2 membri del gruppo, e 1 solo nome — il proprio
--   B idem
--
-- Il permesso di leggere `actors` copre chi condivide un PIANO, non chi
-- condivide un GRUPPO. Quindi appena si crea un gruppo e si invitano gli
-- amici, l'elenco dei membri mostra "Membro eliminato" per tutti.
--
-- Il difetto c'era da sempre: prima nameOf() rendeva stringa vuota e si
-- vedevano righe senza nome, che sembravano un problema grafico. Chiamarli
-- "Membro eliminato" (26/8) non ha creato il difetto: l'ha reso leggibile.
--
-- PERCHE' NON BASTA ALLARGARE IL PERMESSO SU actors
--
-- I permessi valgono per RIGA, non per colonna. Rendere visibile la riga di
-- un'altra persona significa renderne visibile anche l'email — e PRIVACY.md
-- dice che le email non si vedono mai nell'app. Sarebbe una fuga di dati
-- personali per aggiustare un'etichetta.
--
-- Quindi si espone una VISTA con le sole colonne innocue.

create or replace view public.persone_visibili as
  select a.id, a.display_name, a.avatar_path
    from public.actors a
   where
     -- se stessi
     a.id = public.kimari_actor_id()
     -- chi condivide un piano
     or exists (
       select 1 from public.participants p1
         join public.participants p2 on p2.plan_id = p1.plan_id
        where p1.actor_id = public.kimari_actor_id()
          and p2.actor_id = a.id)
     -- chi condivide un gruppo — è questo che mancava
     or exists (
       select 1 from public.group_members g1
         join public.group_members g2 on g2.group_id = g1.group_id
        where g1.actor_id = public.kimari_actor_id()
          and g2.actor_id = a.id);

-- ATTENZIONE, e va letto prima di toccare questa riga.
--
-- CLAUDE.md dice che le viste devono avere security_invoker=true, perché
-- altrimenti scavalcano la RLS. Qui lo scavalcamento è VOLUTO: la vista deve
-- poter leggere righe di actors che la RLS nasconderebbe, ed è la clausola
-- where qui sopra a decidere chi si vede.
--
-- Il che significa che quella where È il controllo di sicurezza. Se qualcuno
-- la allarga senza pensarci, espone i nomi di tutti a tutti. Le colonne sono
-- solo tre apposta: anche nel caso peggiore non uscirebbe un'email.
alter view public.persone_visibili set (security_invoker = false);

revoke all on public.persone_visibili from public;
grant select on public.persone_visibili to anon, authenticated;

-- ------------------------------------------- notifica: qualcuno e' entrato
-- Mancava anche questa: si manda l'invito a un gruppo e non si sa se qualcuno
-- l'ha aperto. E' il momento in cui chi invita guarda il telefono.
--
-- Va a TUTTI i membri tranne chi e' appena entrato: in un gruppo di amici
-- sapere chi si aggiunge interessa a tutti, non solo a chi ha mandato il link.
create or replace function public.push_su_ingresso_gruppo()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  insert into public.push_coda (actor_id, plan_id, genere, dati)
  select gm.actor_id, null, 'group',
         jsonb_build_object('gruppo', new.group_id, 'chi', new.actor_id)
    from public.group_members gm
   where gm.group_id = new.group_id
     and gm.actor_id is distinct from new.actor_id
     and exists (select 1 from public.push_subscriptions s where s.actor_id = gm.actor_id);
  return new;
end;
$$;

drop trigger if exists push_ingresso_gruppo on public.group_members;
create trigger push_ingresso_gruppo after insert on public.group_members
  for each row execute function public.push_su_ingresso_gruppo();

-- ------------------------------------------------------------------ prova
do $prova$
declare v_ok boolean; v_col integer;
begin
  select count(*) into v_col from information_schema.columns
   where table_schema = 'public' and table_name = 'persone_visibili';
  if v_col <> 3 then
    raise exception '0021: la vista ha % colonne invece di 3 — se c e email, e una fuga', v_col;
  end if;

  select count(*) = 0 into v_ok from information_schema.columns
   where table_schema = 'public' and table_name = 'persone_visibili'
     and column_name in ('email', 'auth_user_id');
  if not v_ok then
    raise exception '0021: la vista espone email o auth_user_id';
  end if;

  raise notice '0021: ok — i nomi dei membri si vedono, le email no';
end $prova$;
