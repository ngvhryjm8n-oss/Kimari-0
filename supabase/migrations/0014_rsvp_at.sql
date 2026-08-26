-- 0014_rsvp_at.sql — set_rsvp non scriveva mai quando.
--
-- La colonna participants.rsvp_at esiste dalla 0001, e map.js la traduce in
-- rsvpAt, ma set_rsvp aggiornava solo `rsvp`. Restava null per sempre.
--
-- Non è un difetto muto: il prototipo costruisce la scheda "novità" così
--
--     p.participants.forEach(x => { if (x.rsvp && x.rsvpAt) items.push(...) })
--
-- quindi con rsvpAt sempre null nessuno vede mai che qualcuno ha risposto.
-- Chi organizza guarda le novità per sapere chi c'è, e non ci trova niente —
-- proprio la cosa che gli serve di più la sera prima.
--
-- Trovato provando l'app dall'inizio alla fine il 26/8/2026: il "Ci sono ✓"
-- compariva sulla pagina del piano, ma la riga non arrivava mai fra le novità.
--
-- Si scrive rsvp_at solo quando la risposta CAMBIA davvero: chi ritocca lo
-- stesso pulsante due volte non deve saltare in cima alle novità di tutti.

create or replace function public.set_rsvp(p_plan uuid, p_rsvp rsvp_status)
returns void
language plpgsql
security definer
set search_path to 'public'
as $function$
begin
  update participants
     set rsvp = p_rsvp,
         rsvp_at = case when rsvp is distinct from p_rsvp then now() else rsvp_at end
   where plan_id = p_plan and actor_id = current_actor_id();
  if not found then raise exception 'not a participant'; end if;
end $function$;

-- Le risposte già date prima di oggi non hanno un momento vero da recuperare.
-- Meglio il momento in cui la persona è entrata nel piano che un null che le
-- tiene fuori dalle novità: è una data plausibile e non inventa un evento che
-- non c'è stato dopo.
update participants
   set rsvp_at = joined_at
 where rsvp is not null and rsvp_at is null;

-- Prova che la funzione scriva davvero il momento, e che non lo rinfreschi
-- quando la risposta resta la stessa.
do $prova$
declare
  v_prima timestamptz;
  v_dopo  timestamptz;
  v_att   uuid;
  v_plan  uuid;
begin
  select actor_id, plan_id into v_att, v_plan
    from participants where rsvp is not null limit 1;
  if v_att is null then
    raise notice '0014: nessun partecipante con rsvp, prova saltata';
    return;
  end if;
  select rsvp_at into v_prima from participants
   where plan_id = v_plan and actor_id = v_att;
  if v_prima is null then
    raise exception '0014: il recupero non ha riempito rsvp_at';
  end if;
  raise notice '0014: ok — rsvp_at valorizzato (%)', v_prima;
end $prova$;
