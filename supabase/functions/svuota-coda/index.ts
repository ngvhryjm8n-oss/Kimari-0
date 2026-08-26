// svuota-coda — prende le notifiche in attesa e le consegna.
//
// Si chiama ogni minuto con pg_cron (l'istruzione sta in fondo a questo file).
// Il ritardo massimo è quindi un minuto: accettabile per "qualcuno ha votato",
// e comunque meglio di un trigger che tiene aperta la transazione di chi ha
// appena votato finché Google non risponde.
//
//   npx supabase functions deploy svuota-coda --project-ref fnafzokgkbhhjircrogy
//   npx supabase secrets set VAPID_PRIVATA=... VAPID_PUBBLICA=... VAPID_CONTATTO=mailto:kimariapp@gmail.com

import webpush from 'https://esm.sh/web-push@3.6.7';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.112.3';

const PRIVATA  = Deno.env.get('VAPID_PRIVATA')  ?? '';
const PUBBLICA = Deno.env.get('VAPID_PUBBLICA') ?? '';
const CONTATTO = Deno.env.get('VAPID_CONTATTO') ?? 'mailto:kimariapp@gmail.com';
const SERVIZIO = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

webpush.setVapidDetails(CONTATTO, PUBBLICA, PRIVATA);
const db = createClient(Deno.env.get('SUPABASE_URL') ?? '', SERVIZIO);

// I testi. Non stanno nel database di proposito: lì ci va la CATEGORIA, e il
// testo si compone qui, nella lingua del dispositivo che lo riceverà. Metterlo
// nella coda vorrebbe dire congelare una lingua al momento dell'evento — e
// dopo aver passato una giornata a togliere l'italiano da ogni schermata,
// rientrerebbe dalla finestra proprio nelle notifiche.
const TESTI: Record<string, Record<string, { t: string; c: string }>> = {
  vote: {
    it: { t: 'Qualcuno ha votato', c: '{piano}: c’è un voto nuovo' },
    en: { t: 'Someone voted',      c: '{piano}: there’s a new vote' },
    es: { t: 'Alguien ha votado',  c: '{piano}: hay un voto nuevo' },
    de: { t: 'Jemand hat abgestimmt', c: '{piano}: eine neue Stimme' },
    ja: { t: '投票がありました',        c: '{piano}：新しい投票が入りました' }
  },
  confirm: {
    it: { t: 'Kimari! ✅', c: '{piano} è confermato' },
    en: { t: 'Kimari! ✅', c: '{piano} is confirmed' },
    es: { t: '¡Kimari! ✅', c: '{piano} está confirmado' },
    de: { t: 'Kimari! ✅', c: '{piano} ist bestätigt' },
    ja: { t: 'Kimari！✅', c: '{piano} が確定しました' }
  },
  change: {
    it: { t: 'Qualcosa è cambiato', c: '{piano}: apri per vedere cosa' },
    en: { t: 'Something changed',   c: '{piano}: open to see what' },
    es: { t: 'Algo ha cambiado',    c: '{piano}: abre para ver qué' },
    de: { t: 'Etwas hat sich geändert', c: '{piano}: öffnen, um zu sehen was' },
    ja: { t: '変更がありました',          c: '{piano}：開いて確認してください' }
  },
  group: {
    it: { t: 'Qualcuno e’ entrato', c: 'Un amico e’ entrato nel gruppo' },
    en: { t: 'Someone joined',     c: 'A friend joined the group' },
    es: { t: 'Alguien se ha unido', c: 'Un amigo se ha unido al grupo' },
    de: { t: 'Jemand ist dazugekommen', c: 'Ein Freund ist der Gruppe beigetreten' },
    ja: { t: '新しいメンバー',        c: '友だちがグループに参加しました' }
  },
  late: {
    it: { t: 'Imprevisto', c: '{piano}: qualcuno arriva tardi o non viene' },
    en: { t: 'A hitch',    c: '{piano}: someone’s late or can’t come' },
    es: { t: 'Imprevisto', c: '{piano}: alguien llega tarde o no viene' },
    de: { t: 'Es kam was dazwischen', c: '{piano}: jemand kommt später oder gar nicht' },
    ja: { t: '予定に変更',   c: '{piano}：遅れる人、または来られない人がいます' }
  }
};

const testo = (genere: string, lingua: string, piano: string) => {
  const per = TESTI[genere] ?? TESTI.change;
  // Se una lingua manca esce l'italiano, mai una chiave a video: stessa regola
  // del dizionario dell'app (regola 3).
  const v = per[lingua] ?? per.it;
  return { titolo: v.t, corpo: v.c.replace('{piano}', piano || 'Kimari') };
};

Deno.serve(async (req) => {
  if (!(req.headers.get('Authorization') ?? '').includes(SERVIZIO)) {
    return new Response('no', { status: 401 });
  }

  // A pacchetti: se ne restano si prendono al giro dopo. Svuotarla tutta in
  // una volta significherebbe che una coda lunga fa scadere la funzione e non
  // ne parte NESSUNA.
  const { data: righe, error } = await db
    .from('push_coda')
    .select('id, actor_id, plan_id, genere, dati, tentativi')
    .is('mandata', null)
    .lt('tentativi', 3)
    .order('creata')
    .limit(100);

  if (error) return new Response(error.message, { status: 500 });
  if (!righe?.length) return Response.json({ mandate: 0 });

  // I titoli dei piani in una volta sola, invece di una domanda per notifica.
  const idPiani = [...new Set(righe.map(r => r.plan_id).filter(Boolean))];
  const titoli: Record<string, string> = {};
  if (idPiani.length) {
    const { data: piani } = await db.from('plans').select('id, title').in('id', idPiani);
    for (const p of piani ?? []) titoli[p.id] = p.title;
  }

  const perAttore = [...new Set(righe.map(r => r.actor_id))];
  const { data: iscrizioni } = await db
    .from('push_subscriptions')
    .select('id, actor_id, endpoint, p256dh, auth, lingua')
    .in('actor_id', perAttore);

  const morte: string[] = [];
  const fatte: number[] = [];
  const fallite: number[] = [];

  for (const r of righe) {
    const suoi = (iscrizioni ?? []).filter(s => s.actor_id === r.actor_id);
    if (!suoi.length) { fatte.push(r.id); continue; }   // nessun dispositivo: non è un errore

    let almenoUna = false;
    for (const s of suoi) {
      const { titolo, corpo } = testo(r.genere, s.lingua ?? 'it', titoli[r.plan_id] ?? '');
      try {
        await webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          JSON.stringify({
            titolo, testo: corpo, piano: r.plan_id,
            rotta: r.plan_id ? `/app/#/p/${r.plan_id}` : '/app/'
          }));
        almenoUna = true;
      } catch (e) {
        const codice = (e as { statusCode?: number }).statusCode;
        // 404 e 410: quel dispositivo non esiste più. Tenerlo significa
        // riprovare per sempre verso il vuoto, e ogni tentativo ruba tempo
        // alla consegna delle notifiche vere.
        if (codice === 404 || codice === 410) morte.push(s.id);
        else console.error('push', codice, (e as Error).message);
      }
    }
    (almenoUna ? fatte : fallite).push(r.id);
  }

  if (fatte.length) {
    await db.from('push_coda').update({ mandata: new Date().toISOString() }).in('id', fatte);
  }
  if (fallite.length) {
    // Si riprova, ma non all'infinito: tre tentativi e poi si lascia perdere.
    // Una coda che ritenta per sempre diventa un motivo per cui le notifiche
    // NUOVE arrivano in ritardo.
    for (const id of fallite) {
      const r = righe.find(x => x.id === id);
      await db.from('push_coda').update({ tentativi: (r?.tentativi ?? 0) + 1 }).eq('id', id);
    }
  }
  if (morte.length) await db.from('push_subscriptions').delete().in('id', morte);

  return Response.json({ mandate: fatte.length, riprovare: fallite.length, tolte: morte.length });
});

/*
 Da eseguire UNA volta nel SQL Editor, dopo aver distribuito la funzione:

   create extension if not exists pg_cron;
   create extension if not exists pg_net;

   select cron.schedule('kimari-notifiche', '* * * * *', $$
     select net.http_post(
       url     := 'https://fnafzokgkbhhjircrogy.supabase.co/functions/v1/svuota-coda',
       headers := jsonb_build_object('Authorization', 'Bearer ' || current_setting('app.chiave_servizio', true))
     );
   $$);

 La chiave di servizio NON va scritta dentro il comando: finirebbe nella
 tabella di cron, in chiaro, leggibile da chiunque abbia accesso al database.
 Si mette come impostazione del database:

   alter database postgres set app.chiave_servizio = 'la-chiave-service-role';
*/
