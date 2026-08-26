-- 0015_link_nei_piani.sql — un link attaccato a un piano spariva al ricaricamento.
--
-- Nell'app "Aggiungi link" funzionava benissimo: il link compariva fra gli
-- allegati, arrivava il "Link aggiunto", e poi al ricaricamento non c'era più.
-- Scriveva solo in memoria, perché sotto non c'era dove metterlo:
--
--   media.kind  check (kind in ('photo','file'))
--   media.path  not null unique          -- un percorso nel bucket
--
-- Un link non ha un file nel bucket: ha un indirizzo. Per i POSTI il disegno
-- giusto c'era già dalla 0011 (place_media, con kind 'link' e una colonna url);
-- qui si porta lo stesso sui piani, invece di infilare l'URL dentro `path` —
-- che avrebbe funzionato oggi e rotto delete_media domani, quando prova a
-- togliere dal bucket un file che non è mai esistito.
--
-- Trovato il 26/8/2026 col controllo che confronta le capacità di data.js con
-- quelle che qualcuno chiama davvero.

-- ------------------------------------------------------------ la tabella
alter table public.media add column if not exists url text;

-- `path` resta obbligatorio per foto e file, e diventa facoltativo per i link.
do $$
begin
  if exists (select 1 from information_schema.columns
              where table_schema = 'public' and table_name = 'media'
                and column_name = 'path' and is_nullable = 'NO') then
    alter table public.media alter column path drop not null;
  end if;
end $$;

alter table public.media drop constraint if exists media_kind_check;
alter table public.media add constraint media_kind_check
  check (kind in ('photo', 'file', 'link'));

-- Ogni riga deve avere ciò che le serve, e non l'altra cosa: una foto senza
-- percorso è irrecuperabile, un link senza indirizzo non porta da nessuna
-- parte. Senza questo vincolo il difetto tornerebbe come riga vuota invece
-- che come dato perso.
alter table public.media drop constraint if exists media_ha_dove_sta;
alter table public.media add constraint media_ha_dove_sta
  check ((kind in ('photo', 'file') and path is not null)
      or (kind = 'link' and url is not null));

-- ------------------------------------------------------------ la RPC
-- Non si estende register_media: quella carica un file e ha tutta la
-- contabilità dello spazio. Un link non occupa spazio, e mescolarli
-- significherebbe passarle un p_path finto.
create or replace function public.add_plan_link(p_plan uuid, p_name text, p_url text)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_actor uuid := public.kimari_actor_id();
  v_n     integer;
  v_id    uuid;
begin
  if v_actor is null or not public.kimari_is_participant(p_plan) then
    raise exception 'non partecipi a questo piano';
  end if;
  if p_url is null or btrim(p_url) = '' then
    raise exception 'il link è vuoto';
  end if;
  -- Solo http/https: un javascript: incollato qui diventerebbe un href
  -- cliccabile per tutti gli altri.
  if btrim(p_url) !~* '^https?://' then
    raise exception 'il link deve cominciare con http:// o https://';
  end if;
  if length(btrim(p_url)) > 2000 then
    raise exception 'link troppo lungo';
  end if;

  -- Stesso spirito del massimo 5 opzioni: un tetto perché una schermata di
  -- link non diventi una bacheca.
  select count(*) into v_n from public.media where plan_id = p_plan and kind = 'link';
  if v_n >= 20 then
    raise exception 'massimo 20 link per piano';
  end if;

  insert into public.media (plan_id, actor_id, kind, path, url, name, size_bytes)
  values (p_plan, v_actor, 'link', null, btrim(p_url),
          btrim(coalesce(nullif(btrim(p_name), ''), p_url)), 0)
  returning id into v_id;

  return v_id;
end;
$$;

revoke all on function public.add_plan_link(uuid, text, text) from public;
grant execute on function public.add_plan_link(uuid, text, text) to anon, authenticated;

-- delete_media toglie anche il file dal bucket restituendo il percorso. Per un
-- link non c'è niente da togliere: deve rendere null, non il vecchio percorso
-- di qualcun altro.
do $$
begin
  if exists (select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
              where n.nspname = 'public' and p.proname = 'delete_media') then
    raise notice '0015: delete_media esiste — restituisce media.path, che per un link è null. Va bene così.';
  end if;
end $$;

-- ------------------------------------------------------------ prova
do $prova$
declare v_ok boolean;
begin
  select count(*) = 1 into v_ok from information_schema.columns
   where table_schema = 'public' and table_name = 'media' and column_name = 'url';
  if not v_ok then raise exception '0015: manca media.url'; end if;

  select is_nullable = 'YES' into v_ok from information_schema.columns
   where table_schema = 'public' and table_name = 'media' and column_name = 'path';
  if not v_ok then raise exception '0015: media.path è ancora obbligatorio'; end if;

  raise notice '0015: ok — i link nei piani hanno dove stare';
end $prova$;
