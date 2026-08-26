// manda-notifica — spedisce una notifica push ai dispositivi di una persona.
//
// Vive su Supabase perché è l'unico posto dove la chiave privata VAPID può
// stare: firma le notifiche, e chi ce l'ha può mandarne a nome di Kimari.
// Nell'app c'è solo la pubblica.
//
// Si distribuisce con:
//   npx supabase functions deploy manda-notifica --project-ref fnafzokgkbhhjircrogy
//
// E prima vanno messi i segreti (una volta sola):
//   npx supabase secrets set VAPID_PRIVATA=... VAPID_PUBBLICA=... VAPID_CONTATTO=mailto:kimariapp@gmail.com
//
// Chi può chiamarla: solo chi ha la chiave di servizio, cioè il database
// stesso tramite un trigger, non il client. Una funzione che chiunque può
// chiamare per mandare notifiche a chiunque è una macchina per molestie.

import webpush from 'https://esm.sh/web-push@3.6.7';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.112.3';

const PRIVATA  = Deno.env.get('VAPID_PRIVATA')  ?? '';
const PUBBLICA = Deno.env.get('VAPID_PUBBLICA') ?? '';
const CONTATTO = Deno.env.get('VAPID_CONTATTO') ?? 'mailto:kimariapp@gmail.com';
const URL_SB   = Deno.env.get('SUPABASE_URL') ?? '';
const SERVIZIO = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

webpush.setVapidDetails(CONTATTO, PUBBLICA, PRIVATA);

const db = createClient(URL_SB, SERVIZIO);

Deno.serve(async (req) => {
  // La chiave di servizio non deve mai stare nel client: se questa funzione
  // fosse aperta, chiunque potrebbe mandare notifiche a chiunque.
  const auth = req.headers.get('Authorization') ?? '';
  if (!auth.includes(SERVIZIO)) {
    return new Response('no', { status: 401 });
  }

  let corpo: { a?: string; titolo?: string; testo?: string; rotta?: string; piano?: string };
  try { corpo = await req.json(); }
  catch { return new Response('corpo illeggibile', { status: 400 }); }

  if (!corpo.a) return new Response('manca il destinatario', { status: 400 });

  const { data: iscrizioni, error } = await db
    .from('push_subscriptions')
    .select('id, endpoint, p256dh, auth')
    .eq('actor_id', corpo.a);

  if (error) return new Response(error.message, { status: 500 });
  if (!iscrizioni?.length) return Response.json({ mandate: 0, motivo: 'nessun dispositivo' });

  const carico = JSON.stringify({
    titolo: corpo.titolo ?? 'Kimari',
    testo:  corpo.testo ?? '',
    rotta:  corpo.rotta ?? '/app/',
    piano:  corpo.piano ?? null
  });

  let mandate = 0;
  const morte: string[] = [];

  for (const s of iscrizioni) {
    try {
      await webpush.sendNotification(
        { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, carico);
      mandate++;
    } catch (e) {
      // 404 e 410 vogliono dire che quel dispositivo non esiste più: app
      // disinstallata, o iscrizione scaduta. Tenerla significa riprovare per
      // sempre verso il vuoto, e ogni tentativo costa tempo alla consegna
      // delle notifiche vere.
      const codice = (e as { statusCode?: number }).statusCode;
      if (codice === 404 || codice === 410) morte.push(s.id);
      else console.error('push fallita', codice, (e as Error).message);
    }
  }

  if (morte.length) {
    await db.from('push_subscriptions').delete().in('id', morte);
  }

  return Response.json({ mandate, tolte: morte.length });
});
