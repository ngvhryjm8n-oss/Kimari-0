-- 0018_avatar_e_foto_dei_posti.sql
--
-- Due cose che riguardano lo stesso pezzo: chi può mettere file nello Storage.
--
-- 1. LE FOTO DEI POSTI NON SI POTEVANO CARICARE.
--    Il difetto è vecchio quanto la 0011. Il client scrive in
--    places/<place_id>/<file>, ma le uniche politiche esistenti (0006)
--    ammettono solo plans/<plan_id>/<file>: qualunque altro percorso viene
--    rifiutato dalla RLS. L'app offre "📷 Foto del menu", il codice c'è, la
--    RPC add_place_media c'è — e il caricamento non e' mai potuto riuscire.
--
--    Verificato contro la produzione il 26/8/2026:
--      POST /storage/v1/object/kimari/places/<id>/prova.png
--      → 403 new row violates row-level security policy
--
--    Nessuno se n'era accorto perche' il messaggio arriva solo provando: dal
--    codice tutto sembra al suo posto.
--
-- 2. L'IMMAGINE DEL PROFILO non esisteva. Serve una colonna su actors e un
--    percorso dove metterla.

-- ------------------------------------------------------- dove sta la foto
alter table public.actors add column if not exists avatar_path text;

-- ------------------------------------------- da che cartella viene un file
-- kimari_path_plan (0006) legge la SECONDA cartella dando per scontato che la
-- prima sia 'plans'. Ora le cartelle sono tre, e serve sapere anche quale.
create or replace function public.kimari_path_tipo(p_name text)
returns text
language plpgsql
immutable
as $$
begin
  return (storage.foldername(p_name))[1];
exception when others then
  return null;
end;
$$;

create or replace function public.kimari_path_id(p_name text)
returns uuid
language plpgsql
immutable
as $$
begin
  return (storage.foldername(p_name))[2]::uuid;
exception when others then
  return null;      -- percorso storto: nessuna politica lo accettera'
end;
$$;

-- ------------------------------------------------------------- le regole
-- Si RIFANNO tutte e tre invece di aggiungerne altre: due politiche di select
-- sulla stessa tabella si sommano in OR, e ragionare su chi vede cosa
-- diventa un esercizio di logica invece di una lettura.

drop policy if exists kimari_objects_read on storage.objects;
create policy kimari_objects_read on storage.objects
  for select to authenticated
  using (bucket_id = 'kimari' and (
    -- allegati di un piano: chi partecipa
    (public.kimari_path_tipo(name) = 'plans'
       and public.kimari_is_participant(public.kimari_path_id(name)))
    -- foto di un posto salvato: sono roba tua e basta. Gli altri, nei piani,
    -- vedono solo nome e indirizzo — l'app lo promette a schermo.
    or (public.kimari_path_tipo(name) = 'places'
       and exists (select 1 from public.places p
                    where p.id = public.kimari_path_id(name)
                      and p.actor_id = public.kimari_actor_id()))
    -- volti: li vede chiunque sia entrato. Il percorso contiene l'id del
    -- profilo, che si conosce solo se si condivide un piano o un gruppo —
    -- la RLS su actors lo garantisce. Senza questo, in un piano si
    -- vedrebbero le iniziali di alcuni e la faccia di nessuno.
    or public.kimari_path_tipo(name) = 'avatars'
  ));

drop policy if exists kimari_objects_insert on storage.objects;
create policy kimari_objects_insert on storage.objects
  for insert to authenticated
  with check (bucket_id = 'kimari' and (
    (public.kimari_path_tipo(name) = 'plans'
       and public.kimari_is_participant(public.kimari_path_id(name)))
    or (public.kimari_path_tipo(name) = 'places'
       and exists (select 1 from public.places p
                    where p.id = public.kimari_path_id(name)
                      and p.actor_id = public.kimari_actor_id()))
    -- Solo nella PROPRIA cartella: senza questo si potrebbe cambiare la faccia
    -- di chiunque altro.
    or (public.kimari_path_tipo(name) = 'avatars'
       and public.kimari_path_id(name) = public.kimari_actor_id())
  ));

drop policy if exists kimari_objects_delete on storage.objects;
create policy kimari_objects_delete on storage.objects
  for delete to authenticated
  using (bucket_id = 'kimari' and (
    owner = auth.uid()
    or (public.kimari_path_tipo(name) = 'plans'
        and public.kimari_is_organizer(public.kimari_path_id(name)))
    or (public.kimari_path_tipo(name) = 'places'
        and exists (select 1 from public.places p
                     where p.id = public.kimari_path_id(name)
                       and p.actor_id = public.kimari_actor_id()))
    or (public.kimari_path_tipo(name) = 'avatars'
        and public.kimari_path_id(name) = public.kimari_actor_id())
  ));

-- ------------------------------------------------------------------ RPC
create or replace function public.set_my_avatar(p_path text)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare v_actor uuid := public.kimari_actor_id();
begin
  if v_actor is null then raise exception 'serve un profilo'; end if;

  -- Il percorso deve stare nella propria cartella. Il controllo e' qui e non
  -- solo nella politica dello Storage: questa RPC scrive su actors, e senza
  -- si potrebbe far puntare il proprio profilo al file di un altro.
  if p_path is not null and p_path !~ ('^avatars/' || v_actor::text || '/') then
    raise exception 'questa immagine non e nella tua cartella';
  end if;

  update public.actors set avatar_path = p_path where id = v_actor;
end;
$$;

revoke all on function public.set_my_avatar(text) from public;
grant execute on function public.set_my_avatar(text) to anon, authenticated;

-- ------------------------------------------------------------------ prova
do $prova$
declare v_ok boolean;
begin
  select count(*) = 1 into v_ok from information_schema.columns
   where table_schema = 'public' and table_name = 'actors' and column_name = 'avatar_path';
  if not v_ok then raise exception '0018: manca actors.avatar_path'; end if;

  select count(*) = 3 into v_ok from pg_policies
   where schemaname = 'storage' and tablename = 'objects'
     and policyname in ('kimari_objects_read','kimari_objects_insert','kimari_objects_delete');
  if not v_ok then raise exception '0018: le politiche dello Storage non sono tre'; end if;

  raise notice '0018: ok — le foto dei posti si possono caricare, e il profilo ha una faccia';
end $prova$;
