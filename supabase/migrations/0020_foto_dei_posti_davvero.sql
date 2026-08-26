-- 0020_foto_dei_posti_davvero.sql
--
-- La 0018 doveva sbloccare le foto dei posti salvati. Non l'ha fatto: dopo
-- averla applicata, caricare in places/<id>/ dà ancora
--     403 new row violates row-level security policy
-- mentre il ramo degli avatar, scritto nello stesso file, funziona.
--
-- La differenza fra i due rami è una sola: quello dei posti fa una
-- sottointerrogazione su public.places dentro la politica dello Storage.
-- Quello degli avatar confronta due valori e basta.
--
-- Invece di continuare a indagare perché quella sottointerrogazione non veda
-- la riga, si toglie: il proprietario si mette NEL PERCORSO, come per gli
-- avatar. Il controllo diventa identico a quello che è già dimostrato
-- funzionare in produzione.
--
--     prima   places/<place_id>/<file>          → serve una query per sapere di chi è
--     adesso  places/<actor_id>/<place_id>/<file>  → si legge dal percorso
--
-- Non c'è niente da migrare: quella cartella è vuota, perché il caricamento
-- non è mai riuscito da quando esiste.

drop policy if exists kimari_objects_read on storage.objects;
create policy kimari_objects_read on storage.objects
  for select to authenticated
  using (bucket_id = 'kimari' and (
    (public.kimari_path_tipo(name) = 'plans'
       and public.kimari_is_participant(public.kimari_path_id(name)))
    -- I posti restano roba propria: gli altri, nei piani, vedono solo nome e
    -- indirizzo — l'app lo promette a schermo.
    or (public.kimari_path_tipo(name) = 'places'
       and public.kimari_path_id(name) = public.kimari_actor_id())
    or public.kimari_path_tipo(name) = 'avatars'
  ));

drop policy if exists kimari_objects_insert on storage.objects;
create policy kimari_objects_insert on storage.objects
  for insert to authenticated
  with check (bucket_id = 'kimari' and (
    (public.kimari_path_tipo(name) = 'plans'
       and public.kimari_is_participant(public.kimari_path_id(name)))
    or (public.kimari_path_tipo(name) = 'places'
       and public.kimari_path_id(name) = public.kimari_actor_id())
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
    or (public.kimari_path_tipo(name) in ('places', 'avatars')
        and public.kimari_path_id(name) = public.kimari_actor_id())
  ));

-- ------------------------------------------------------------------ prova
do $prova$
declare v_ok boolean;
begin
  select count(*) = 3 into v_ok from pg_policies
   where schemaname = 'storage' and tablename = 'objects'
     and policyname in ('kimari_objects_read','kimari_objects_insert','kimari_objects_delete');
  if not v_ok then raise exception '0020: le politiche non sono tre'; end if;

  -- Nessuna delle tre deve più contenere una sottointerrogazione: è quella che
  -- non funzionava, e riscriverla per sbaglio rimetterebbe il difetto.
  select count(*) = 0 into v_ok from pg_policies
   where schemaname = 'storage' and tablename = 'objects'
     and policyname like 'kimari_objects_%'
     and (coalesce(qual, '') || coalesce(with_check, '')) ilike '%from places%';
  if not v_ok then
    raise exception '0020: una politica interroga ancora public.places';
  end if;

  raise notice '0020: ok — il proprietario si legge dal percorso, senza query';
end $prova$;
