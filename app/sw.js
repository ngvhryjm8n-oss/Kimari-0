// sw.js — service worker. Serve SOLO a ricevere le notifiche push.
//
// NON mette niente in cache, di proposito. Un service worker che serve file
// dalla cache è il modo più comune di ritrovarsi un'app vecchia che non si
// aggiorna mai, e oggi (26/8/2026) abbiamo già passato ore a inseguire copie
// vecchie di live.js. Qui non c'è nessun `fetch` intercettato: ogni richiesta
// va in rete come se questo file non esistesse.
//
// L'unico motivo per cui esiste è che Web Push lo richiede: senza un service
// worker registrato, il browser non consegna nessuna notifica.

self.addEventListener('install', () => {
  // Subito attivo: senza, il primo service worker resta "in attesa" finché
  // tutte le schede non vengono chiuse — e chi ha appena acceso le notifiche
  // non ne riceverebbe nessuna fino al riavvio dell'app.
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(self.clients.claim());
});

self.addEventListener('push', e => {
  // Se il messaggio non è leggibile si mostra comunque qualcosa: una notifica
  // muta è peggio di una generica, perché il badge appare e non si capisce
  // perché.
  let d = {};
  try { d = e.data ? e.data.json() : {}; } catch { d = {}; }

  const titolo = d.titolo || 'Kimari';
  const opzioni = {
    body: d.testo || '',
    icon: './icona-192.png',
    badge: './icona-192.png',
    // Notifiche sullo stesso piano si sostituiscono invece di accumularsi:
    // tre voti in due minuti sono una notifica, non tre.
    tag: d.piano || 'kimari',
    renotify: !!d.piano,
    data: { rotta: d.rotta || '/app/' }
  };
  e.waitUntil(self.registration.showNotification(titolo, opzioni));
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  const rotta = (e.notification.data && e.notification.data.rotta) || '/app/';

  // Se l'app è già aperta la si porta in primo piano invece di aprirne
  // un'altra copia: due finestre della stessa app sono un modo sicuro di
  // confondere chi ci sta dentro.
  e.waitUntil((async () => {
    const aperte = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const c of aperte) {
      if (c.url.includes('/app/')) {
        await c.focus();
        if ('navigate' in c && rotta) { try { await c.navigate(rotta); } catch { /* pazienza */ } }
        return;
      }
    }
    await self.clients.openWindow(rotta);
  })());
});
