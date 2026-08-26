-- 0017_notifiche_push.sql — dove vivono le iscrizioni alle notifiche.
--
-- Web Push, non push native: funziona sull'app aggiunta alla schermata Home,
-- su Android da sempre e su iPhone da iOS 16.4. Nessun Capacitor, nessun Mac,
-- nessuna revisione di Apple. Le native serviranno quando l'app sara' negli
-- store; questo tavolo regge anche quelle, perche' un endpoint e' un endpoint.
--
-- Una riga per DISPOSITIVO, non per persona: la stessa persona ha il telefono
-- e il tablet, e disiscriversi da uno non deve zittire l'altro.

create table if not exists public.push_subscriptions (
  id          uuid        primary key default gen_random_uuid(),
  actor_id    uuid        not null references public.actors(id) on delete cascade,
  -- L'indirizzo a cui il servizio del browser consegna la notifica. E' unico
  -- per dispositivo+app, e cambia se l'utente reinstalla.
  endpoint    text        not null unique,
  -- Le due chiavi con cui il messaggio viene cifrato: senza, il servizio di
  -- Google o Apple potrebbe leggere il contenuto delle notifiche.
  p256dh      text        not null,
  auth        text        not null,
  -- A cosa serve saperlo: se una notifica viene rifiutata perche' l'iscrizione
  -- e' morta, la si cancella. Tenere endpoint defunti vuol dire ritentare per
  -- sempre verso dispositivi che non esistono piu'.
  -- La lingua di QUESTO dispositivo, non della persona: la notifica compare
  -- li', e chi ha il telefono in inglese e il tablet in italiano si aspetta
  -- ciascuno nella propria. Il server non puo' saperla in altro modo — e
  -- senza, dopo aver tolto l'italiano da ogni schermata, tornerebbe dalla
  -- finestra proprio nelle notifiche.
  lingua      text        not null default 'it'
              check (lingua in ('it','en','es','de','ja')),
  ultimo_ok   timestamptz,
  errori      integer     not null default 0,
  created_at  timestamptz not null default now()
);

create index if not exists push_subscriptions_actor_idx
  on public.push_subscriptions (actor_id);

alter table public.push_subscriptions enable row level security;

-- Le iscrizioni sono affari propri: nessuno deve poter sapere su quali
-- dispositivi sta un'altra persona, e nemmeno che ne ha.
drop policy if exists push_subscriptions_read on public.push_subscriptions;
create policy push_subscriptions_read on public.push_subscriptions
  for select using (actor_id = public.kimari_actor_id());

-- ------------------------------------------------------------------ RPC

-- Iscriversi. Se l'endpoint c'e' gia' si aggiorna: il browser puo' rinnovarlo
-- da solo, e ritrovarselo due volte significherebbe due notifiche identiche.
create or replace function public.save_push_subscription(
  p_endpoint text, p_p256dh text, p_auth text, p_lingua text default 'it')
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_actor uuid := public.kimari_actor_id();
  v_id    uuid;
begin
  if v_actor is null then
    raise exception 'serve un profilo per ricevere notifiche';
  end if;
  if p_endpoint is null or btrim(p_endpoint) = '' then
    raise exception 'iscrizione senza indirizzo';
  end if;
  -- Solo https: un endpoint http non esiste in Web Push, e accettarlo
  -- significherebbe tenere righe che non funzioneranno mai.
  if btrim(p_endpoint) !~* '^https://' then
    raise exception 'indirizzo di notifica non valido';
  end if;
  if p_p256dh is null or p_auth is null then
    raise exception 'iscrizione senza chiavi: le notifiche sarebbero in chiaro';
  end if;

  insert into public.push_subscriptions (actor_id, endpoint, p256dh, auth, lingua)
  values (v_actor, btrim(p_endpoint), p_p256dh, p_auth,
          case when p_lingua in ('it','en','es','de','ja') then p_lingua else 'it' end)
  on conflict (endpoint) do update
     set actor_id = excluded.actor_id,
         p256dh   = excluded.p256dh,
         auth     = excluded.auth,
         lingua   = excluded.lingua,
         errori   = 0
  returning id into v_id;

  return v_id;
end;
$$;

-- Disiscriversi da QUESTO dispositivo. Non da tutti: spegnere le notifiche sul
-- tablet non deve spegnerle sul telefono.
create or replace function public.delete_push_subscription(p_endpoint text)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare v_actor uuid := public.kimari_actor_id();
begin
  if v_actor is null then return; end if;
  delete from public.push_subscriptions
   where endpoint = btrim(p_endpoint) and actor_id = v_actor;
end;
$$;

revoke all on function public.save_push_subscription(text, text, text, text) from public;
revoke all on function public.delete_push_subscription(text) from public;
grant execute on function public.save_push_subscription(text, text, text, text) to anon, authenticated;
grant execute on function public.delete_push_subscription(text) to anon, authenticated;

-- ------------------------------------------------------------------ prova
do $prova$
declare v_ok boolean;
begin
  select count(*) = 1 into v_ok from information_schema.tables
   where table_schema = 'public' and table_name = 'push_subscriptions';
  if not v_ok then raise exception '0017: manca push_subscriptions'; end if;

  -- La RLS DEVE essere accesa: senza, chiunque potrebbe leggere gli endpoint
  -- di tutti — e un endpoint e' sufficiente a mandare notifiche a quel
  -- dispositivo, se si hanno anche le chiavi.
  select relrowsecurity into v_ok from pg_class
   where oid = 'public.push_subscriptions'::regclass;
  if not v_ok then raise exception '0017: RLS spenta su push_subscriptions'; end if;

  select count(*) = 2 into v_ok
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
   where n.nspname = 'public'
     and p.proname in ('save_push_subscription', 'delete_push_subscription');
  if not v_ok then raise exception '0017: mancano le RPC'; end if;

  raise notice '0017: ok — le iscrizioni alle notifiche hanno dove stare';
end $prova$;
