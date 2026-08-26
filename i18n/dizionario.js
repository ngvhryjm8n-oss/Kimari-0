// dizionario.js — le stringhe dell'interfaccia in cinque lingue.
//
// LA CHIAVE È L'ITALIANO. Non un codice tipo `ballot.title`, ma la frase
// stessa: t('Segna tutte le opzioni che ti vanno bene'). Tre motivi:
//   - non si inventano chiavi, quindi non si sbaglia a nominarle;
//   - il codice resta leggibile: si vede cosa scriverà a schermo;
//   - se una traduzione manca esce l'italiano, mai una chiave rotta a video.
//
// Il file è la sorgente unica per il sito E per l'app. Il sito deve restare un
// file solo (regola 1), quindi tools/genera-i18n.mjs lo inietta dentro
// index.html fra due marcatori; l'app lo importa come modulo.
//
// Le DATE non sono qui: le fa toLocaleString col fuso e la lingua del
// dispositivo (regola 4). È la parte che di solito si rompe traducendo, e qui
// era già giusta.

export const LINGUE = {
  it: 'Italiano',
  en: 'English',
  es: 'Español',
  de: 'Deutsch',
  ja: '日本語'
};

// Giapponese: registro です/ます — cortese ma non rigido, come l'italiano
// colloquiale dell'originale. Non 敬語 pesante: è un'app per andare a cena
// con gli amici, non una banca.
export const DIZIONARIO = {

  /* ---------------------------------------------- ospite: la scheda di voto */
  'Segna tutte le opzioni che ti vanno bene. Vince quella compatibile con più persone.': {
    en: 'Tick every option that works for you. The one that suits the most people wins.',
    es: 'Marca todas las opciones que te vengan bien. Gana la que funcione para más gente.',
    de: 'Markiere alles, was dir passt. Es gewinnt die Option, die den meisten passt.',
    ja: '都合のいい候補をすべて選んでください。いちばん多くの人に合うものに決まります。'
  },
  'Quando ti va bene? Segna tutte le opzioni ok': {
    en: 'When works for you? Tick every option that’s fine',
    es: '¿Cuándo te viene bien? Marca todas las que te sirvan',
    de: 'Wann passt es dir? Markiere alles, was geht',
    ja: 'いつがいいですか？　都合のいい日をすべて選んでください'
  },
  'Segna tutte le opzioni che ti vanno bene': {
    en: 'Tick every option that works for you',
    es: 'Marca todas las opciones que te vengan bien',
    de: 'Markiere alles, was dir passt',
    ja: '都合のいい候補をすべて選んでください'
  },
  'Dove ti va bene?': {
    en: 'Where works for you?', es: '¿Dónde te viene bien?',
    de: 'Wo passt es dir?', ja: 'どこがいいですか？'
  },
  'Nessuna mi va bene': {
    en: 'None work for me', es: 'Ninguna me viene bien',
    de: 'Keine passt mir', ja: 'どれも都合が合いません'
  },
  'Il tuo nome': { en: 'Your name', es: 'Tu nombre', de: 'Dein Name', ja: 'お名前' },
  'Oppure scrivi il tuo nome': {
    en: 'Or type your name', es: 'O escribe tu nombre',
    de: 'Oder schreib deinen Namen', ja: 'または名前を入力'
  },
  'Sei uno di questi?': {
    en: 'Are you one of these?', es: '¿Eres una de estas personas?',
    de: 'Bist du eine davon?', ja: 'この中にいますか？'
  },
  'Chi sei?': {
    en: 'Who are you?', es: '¿Quién eres?',
    de: 'Wer bist du?', ja: 'どなたですか？'
  },
  // Titoletti di sezione quando la data o il posto sono già decisi.
  'Quando': { en: 'When', es: 'Cuándo', de: 'Wann', ja: '日時' },
  'Dove': { en: 'Where', es: 'Dónde', de: 'Wo', ja: '場所' },
  // La data la formatta toLocaleString (regola 4): qui passa già scritta.
  'Si chiude {quando}': {
    en: 'Closes {quando}', es: 'Se cierra {quando}',
    de: 'Schließt {quando}', ja: '締切 {quando}'
  },
  'Nota per il gruppo · facoltativa': {
    en: 'A note for the group · optional',
    es: 'Una nota para el grupo · opcional',
    de: 'Notiz für die Gruppe · optional',
    ja: 'みんなへのひとこと · 任意'
  },
  'Es. per me va bene tutto, ma non troppo tardi': {
    en: 'E.g. anything works for me, just not too late',
    es: 'Ej. me viene bien todo, pero no muy tarde',
    de: 'Z.B. mir passt alles, nur nicht zu spät',
    ja: '例：どれでもいいですが、あまり遅くない時間で'
  },
  'Se non segni nulla vale come "nessuna opzione mi va bene". L’ultimo invio sostituisce il precedente.': {
    en: 'Marking nothing counts as “none of these work for me”. Your latest submission replaces the previous one.',
    es: 'No marcar nada cuenta como «ninguna me viene bien». El último envío sustituye al anterior.',
    de: 'Nichts zu markieren gilt als „keine passt mir“. Die letzte Antwort ersetzt die vorherige.',
    ja: '何も選ばない場合は「どれも都合が合わない」として扱われます。最後に送ったものが有効です。'
  },
  'Invia il mio voto': {
    en: 'Send my vote', es: 'Enviar mi voto',
    de: 'Meine Stimme senden', ja: '投票する'
  },
  'Aggiorna il mio voto': {
    en: 'Update my vote', es: 'Actualizar mi voto',
    de: 'Meine Stimme ändern', ja: '投票を変更する'
  },
  'Invio…': { en: 'Sending…', es: 'Enviando…', de: 'Wird gesendet…', ja: '送信中…' },
  'Dimmi chi sei: tocca il tuo nome o scrivilo.': {
    en: 'Tell us who you are: tap your name or type it.',
    es: 'Dinos quién eres: toca tu nombre o escríbelo.',
    de: 'Sag uns, wer du bist: tippe deinen Namen an oder schreib ihn.',
    ja: 'お名前を選ぶか入力してください。'
  },
  'Ai voti': { en: 'Voting', es: 'En votación', de: 'Abstimmung läuft', ja: '投票中' },
  // Frasi INTERE con segnaposto, non frammenti da incollare accanto a un nome:
  // in giapponese il verbo va in fondo e in tedesco pure, quindi comporre
  // "Anna" + "chiede al gruppo" produrrebbe frasi sgrammaticate.
  '{nome} chiede al gruppo': {
    en: '{nome} is asking the group', es: '{nome} pregunta al grupo',
    de: '{nome} fragt die Gruppe', ja: '{nome}さんがみんなに聞いています'
  },
  '{n} ha già votato': {
    en: '{n} person has already voted', es: '{n} persona ya ha votado',
    de: '{n} Person hat schon abgestimmt', ja: '{n}人が投票済み'
  },
  '{n} hanno già votato': {
    en: '{n} people have already voted', es: '{n} personas ya han votado',
    de: '{n} Personen haben schon abgestimmt', ja: '{n}人が投票済み'
  },
  'Si chiude': { en: 'Closes', es: 'Se cierra', de: 'Endet', ja: '締切' },

  /* ------------------------------------------------------ ospite: dopo il voto */
  'Voto inviato': { en: 'Vote sent', es: 'Voto enviado', de: 'Stimme gesendet', ja: '投票しました' },
  'Grazie!': { en: 'Thanks!', es: '¡Gracias!', de: 'Danke!', ja: 'ありがとうございます！' },
  'Ti avvisiamo quando è deciso': {
    en: 'We’ll let you know once it’s decided',
    es: 'Te avisamos cuando esté decidido',
    de: 'Wir sagen dir Bescheid, sobald es feststeht',
    ja: '決まったらお知らせします'
  },
  'La tua email': { en: 'Your email', es: 'Tu correo', de: 'Deine E-Mail', ja: 'メールアドレス' },
  'Salva': { en: 'Save', es: 'Guardar', de: 'Speichern', ja: '保存' },

  /* ------------------------------------------------------------- confermato */
  'Confermato': { en: 'Confirmed', es: 'Confirmado', de: 'Bestätigt', ja: '確定' },
  'Ci sono': { en: 'I’m in', es: 'Voy', de: 'Ich komme', ja: '行きます' },
  'Forse': { en: 'Maybe', es: 'Quizá', de: 'Vielleicht', ja: 'たぶん' },
  'Non vengo': { en: 'Can’t make it', es: 'No voy', de: 'Ich kann nicht', ja: '行けません' },
  'Aggiungi al calendario': {
    en: 'Add to calendar', es: 'Añadir al calendario',
    de: 'Zum Kalender hinzufügen', ja: 'カレンダーに追加'
  },

  /* ------------------------------------------------------- link non valido */
  'Serve il link d’invito': {
    en: 'You need the invite link', es: 'Necesitas el enlace de invitación',
    de: 'Du brauchst den Einladungslink', ja: '招待リンクが必要です'
  },
  'Questo link non porta a niente': {
    en: 'This link doesn’t lead anywhere', es: 'Este enlace no lleva a ninguna parte',
    de: 'Dieser Link führt nirgendwohin', ja: 'このリンクは無効です'
  },
  'Chiedi a chi organizza di rimandartelo.': {
    en: 'Ask the organiser to send it again.',
    es: 'Pídele a quien organiza que te lo reenvíe.',
    de: 'Bitte die organisierende Person, ihn nochmal zu schicken.',
    ja: '幹事の方にもう一度送ってもらってください。'
  },

  /* ---------------------------------------------------------------- errori */
  'Manca la libreria di Supabase, che arriva da cdn.jsdelivr.net. Quasi sempre è la rete: un blocco pubblicità, un Wi-Fi che chiede il login, o la CDN giù. Riprova, o passa a un’altra rete.': {
    en: 'The Supabase library, which comes from cdn.jsdelivr.net, is missing. It’s nearly always the network: an ad blocker, a Wi-Fi asking you to sign in, or the CDN being down. Try again, or switch network.',
    es: 'Falta la librería de Supabase, que viene de cdn.jsdelivr.net. Casi siempre es la red: un bloqueador de anuncios, un wifi que pide iniciar sesión, o la CDN caída. Inténtalo otra vez o cambia de red.',
    de: 'Die Supabase-Bibliothek von cdn.jsdelivr.net fehlt. Fast immer liegt es am Netz: ein Werbeblocker, ein WLAN, das eine Anmeldung verlangt, oder die CDN ist gerade weg. Versuch es nochmal oder wechsle das Netz.',
    ja: 'cdn.jsdelivr.net から読み込む Supabase のライブラリがありません。たいていはネットワークが原因です（広告ブロッカー、ログインを求める Wi-Fi、CDN の障害など）。もう一度試すか、別のネットワークでお試しください。'
  },
  'Kimari non si è caricato': {
    en: 'Kimari didn’t load', es: 'Kimari no se ha cargado',
    de: 'Kimari wurde nicht geladen', ja: 'Kimari を読み込めませんでした'
  },
  'Quel nome è già collegato a qualcun altro: scrivi il tuo.': {
    en: 'That name already belongs to someone else — use your own.',
    es: 'Ese nombre ya es de otra persona: escribe el tuyo.',
    de: 'Dieser Name gehört schon jemand anderem — nimm deinen eigenen.',
    ja: 'その名前はすでに他の人のものです。ご自分の名前を入力してください。'
  },
  'Non sono riuscito a registrare il voto.': {
    en: 'I couldn’t record your vote.', es: 'No he podido registrar tu voto.',
    de: 'Ich konnte deine Stimme nicht speichern.', ja: '投票を記録できませんでした。'
  },

  /* ------------------------------------------------------------ benvenuto */
  'Tutti hanno un’opinione.': {
    en: 'Everyone has an opinion.', es: 'Todo el mundo tiene una opinión.',
    de: 'Jeder hat eine Meinung.', ja: 'みんな意見があります。'
  },
  'Kimari la trasforma in un piano.': {
    en: 'Kimari turns it into a plan.', es: 'Kimari la convierte en un plan.',
    de: 'Kimari macht daraus einen Plan.', ja: 'Kimari がそれを予定に変えます。'
  },
  'Crea un piano': { en: 'Create a plan', es: 'Crear un plan',
                     de: 'Plan erstellen', ja: '予定をつくる' },
  'Continua con Google': { en: 'Continue with Google', es: 'Continuar con Google',
                           de: 'Weiter mit Google', ja: 'Google で続ける' },
  'Fatto con': { en: 'Made with', es: 'Hecho con', de: 'Gemacht mit', ja: '作成' },

  /* ------------------------------------------------- sito: dopo aver votato */
  'Quando {nome} conferma, questa pagina mostrerà data e posto: salvala.': {
    en: 'When {nome} confirms, this page will show the date and place — save it.',
    es: 'Cuando {nome} lo confirme, esta página mostrará la fecha y el lugar: guárdala.',
    de: 'Sobald {nome} bestätigt, zeigt diese Seite Datum und Ort — speichere sie.',
    ja: '{nome}さんが決めたら、このページに日時と場所が出ます。保存しておいてください。'
  },
  'Vedi il piano': { en: 'See the plan', es: 'Ver el plan', de: 'Zum Plan', ja: '予定を見る' },
  'Vota anche tu': { en: 'Add your vote', es: 'Vota tú también', de: 'Stimm auch ab', ja: 'あなたも投票する' },
  'Avvisami quando è deciso': {
    en: 'Tell me when it’s decided', es: 'Avísame cuando se decida',
    de: 'Sag mir Bescheid, wenn es steht', ja: '決まったら知らせてください'
  },
  'La tua email (facoltativa)': {
    en: 'Your email (optional)', es: 'Tu correo (opcional)',
    de: 'Deine E-Mail (optional)', ja: 'メールアドレス（任意）'
  },
  'Una sola email alla conferma, nessuna newsletter.': {
    en: 'One email when it’s confirmed. No newsletter.',
    es: 'Un solo correo al confirmarse. Nada de newsletters.',
    de: 'Eine E-Mail bei der Bestätigung. Kein Newsletter.',
    ja: '確定時にメールを一通だけ。宣伝は送りません。'
  },

  /* ------------------------------------------------------------ sito: home */
  'I tuoi piani su questo telefono': {
    en: 'Your plans on this phone', es: 'Tus planes en este teléfono',
    de: 'Deine Pläne auf diesem Handy', ja: 'この端末にある予定'
  },
  'Ai voti': { en: 'Voting', es: 'En votación', de: 'Abstimmung läuft', ja: '投票中' },
  'Confermati': { en: 'Confirmed', es: 'Confirmados', de: 'Bestätigt', ja: '確定済み' },
  'Confermato': { en: 'Confirmed', es: 'Confirmado', de: 'Bestätigt', ja: '確定' },
  'Proponi date e posti, il gruppo vota dal link su WhatsApp senza installare niente, tu confermi. Kimari! ✅': {
    en: 'Suggest dates and places, the group votes from a WhatsApp link with nothing to install, you confirm. Kimari! ✅',
    es: 'Propones fechas y sitios, el grupo vota desde un enlace de WhatsApp sin instalar nada, tú confirmas. ¡Kimari! ✅',
    de: 'Du schlägst Termine und Orte vor, die Gruppe stimmt über einen WhatsApp-Link ab — ohne Installation — und du bestätigst. Kimari! ✅',
    ja: '日時と場所を出す、みんながWhatsAppのリンクから投票する（インストール不要）、あなたが決める。決まり！ ✅'
  },
  'Con Google ritrovi i tuoi piani da qualsiasi telefono.': {
    en: 'With Google you find your plans again from any phone.',
    es: 'Con Google recuperas tus planes desde cualquier teléfono.',
    de: 'Mit Google findest du deine Pläne auf jedem Handy wieder.',
    ja: 'Google を使うと、どの端末からでも自分の予定を開けます。'
  },

  /* -------------------------------------------------- sito: creare un piano */
  'Nuovo piano': { en: 'New plan', es: 'Nuevo plan', de: 'Neuer Plan', ja: '新しい予定' },
  'Il piano': { en: 'The plan', es: 'El plan', de: 'Der Plan', ja: '予定' },
  'Il gruppo vota dal link, tu confermi.': {
    en: 'The group votes from the link, you confirm.',
    es: 'El grupo vota desde el enlace, tú confirmas.',
    de: 'Die Gruppe stimmt über den Link ab, du bestätigst.',
    ja: 'みんながリンクから投票し、あなたが決めます。'
  },
  'Il tuo nome (organizzatore)': {
    en: 'Your name (organiser)', es: 'Tu nombre (organizador)',
    de: 'Dein Name (Organisator)', ja: 'お名前（幹事）'
  },
  'Già deciso': { en: 'Already set', es: 'Ya decidido', de: 'Steht schon fest', ja: '決まっている' },
  'Nome del posto': { en: 'Name of the place', es: 'Nombre del sitio',
                      de: 'Name des Orts', ja: '場所の名前' },
  'Indirizzo (facoltativo)': { en: 'Address (optional)', es: 'Dirección (opcional)',
                               de: 'Adresse (optional)', ja: '住所（任意）' },
  'Posto {n}': { en: 'Place {n}', es: 'Sitio {n}', de: 'Ort {n}', ja: '場所 {n}' },
  'Posto: si decide': { en: 'Place: to be decided', es: 'Sitio: por decidir',
                        de: 'Ort: wird noch entschieden', ja: '場所：これから決めます' },
  'Nuovo posto': { en: 'New place', es: 'Nuevo sitio', de: 'Neuer Ort', ja: '新しい場所' },
  'Facoltativo, è solo un promemoria per il gruppo: la conferma resta tua.': {
    en: 'Optional — just a nudge for the group. Confirming is still up to you.',
    es: 'Opcional: solo un recordatorio para el grupo. Confirmar sigue siendo cosa tuya.',
    de: 'Optional — nur eine Erinnerung für die Gruppe. Bestätigen tust du.',
    ja: '任意です。みんなへの目安で、決めるのはあなたです。'
  },
  'Fatto ✓ — il link del piano': {
    en: 'Done ✓ — the link to the plan', es: 'Listo ✓ — el enlace del plan',
    de: 'Fertig ✓ — der Link zum Plan', ja: 'できました ✓ — 予定のリンク'
  },
  'Manda su WhatsApp': { en: 'Send on WhatsApp', es: 'Enviar por WhatsApp',
                         de: 'Auf WhatsApp senden', ja: 'WhatsApp で送る' },
  'Apri il piano': { en: 'Open the plan', es: 'Abrir el plan',
                     de: 'Plan öffnen', ja: '予定を開く' },

  /* ------------------------------------------- sito: la vista organizzatore */
  'Quando — tocca l’opzione da confermare': {
    en: 'When — tap the option to confirm',
    es: 'Cuándo — toca la opción que quieres confirmar',
    de: 'Wann — tippe die Option an, die gelten soll',
    ja: '日時 — 決めるものを選んでください'
  },
  'Dove — tocca l’opzione da confermare': {
    en: 'Where — tap the option to confirm',
    es: 'Dónde — toca la opción que quieres confirmar',
    de: 'Wo — tippe die Option an, die gelten soll',
    ja: '場所 — 決めるものを選んでください'
  },
  'A {chi} non va bene nessuna data.': {
    en: 'None of the dates work for {chi}.',
    es: 'A {chi} no le viene bien ninguna fecha.',
    de: 'Für {chi} passt kein Termin.',
    ja: '{chi}さんはどの日も都合が合いません。'
  },
  'A {chi} non va bene nessun posto.': {
    en: 'None of the places work for {chi}.',
    es: 'A {chi} no le viene bien ningún sitio.',
    de: 'Für {chi} passt kein Ort.',
    ja: '{chi}さんはどの場所も都合が合いません。'
  },
  'nessuno ancora': { en: 'nobody yet', es: 'nadie todavía',
                      de: 'noch niemand', ja: 'まだいません' },
  'Non hanno ancora votato': {
    en: 'Haven’t voted yet', es: 'Aún no han votado',
    de: 'Haben noch nicht abgestimmt', ja: 'まだ投票していない人'
  },
  'Note del gruppo': { en: 'Notes from the group', es: 'Notas del grupo',
                       de: 'Notizen der Gruppe', ja: 'みんなからのひとこと' },
  'Conferma il piano': { en: 'Confirm the plan', es: 'Confirmar el plan',
                         de: 'Plan bestätigen', ja: 'この予定で決める' },
  'Rimanda il link al gruppo': {
    en: 'Send the link again', es: 'Reenviar el enlace al grupo',
    de: 'Link nochmal schicken', ja: 'リンクをもう一度送る'
  },
  'Conferma quando ti basta: il link resta lo stesso e diventa la pagina dell’evento.': {
    en: 'Confirm whenever you have enough: the link stays the same and becomes the event page.',
    es: 'Confirma cuando te baste: el enlace no cambia y se convierte en la página del evento.',
    de: 'Bestätige, sobald es dir reicht: Der Link bleibt gleich und wird zur Seite des Treffens.',
    ja: '十分だと思ったら決めてください。リンクはそのまま、予定のページになります。'
  },

  /* ----------------------------------------------- sito: dopo la conferma */
  'Ci sono · {n}': { en: 'Coming · {n}', es: 'Van · {n}',
                     de: 'Dabei · {n}', ja: '参加 · {n}' },
  'Non vengono · {n}': { en: 'Not coming · {n}', es: 'No van · {n}',
                         de: 'Nicht dabei · {n}', ja: '不参加 · {n}' },
  'Non hanno risposto · {n}': { en: 'No answer · {n}', es: 'Sin responder · {n}',
                                de: 'Keine Antwort · {n}', ja: '未回答 · {n}' },
  'Sposta la data': { en: 'Move the date', es: 'Cambiar la fecha',
                      de: 'Termin verschieben', ja: '日時を変える' },
  'Cambia posto': { en: 'Change the place', es: 'Cambiar de sitio',
                    de: 'Ort ändern', ja: '場所を変える' },
  'Ogni modifica alza la versione (v{a} → v{b}) e resta nella storia: chi ha il link vede sempre l’ultima.': {
    en: 'Every change bumps the version (v{a} → v{b}) and stays in the history: whoever has the link always sees the latest.',
    es: 'Cada cambio sube la versión (v{a} → v{b}) y queda en el historial: quien tenga el enlace ve siempre la última.',
    de: 'Jede Änderung erhöht die Version (v{a} → v{b}) und bleibt in der Historie: Wer den Link hat, sieht immer die neueste.',
    ja: '変更するたびに版が上がり（v{a} → v{b}）、履歴に残ります。リンクを持っている人にはいつも最新が見えます。'
  },
  'Annulla il piano': { en: 'Cancel the plan', es: 'Anular el plan',
                        de: 'Plan absagen', ja: '予定をとりやめる' },
  'Questo piano è stato annullato.': {
    en: 'This plan was cancelled.', es: 'Este plan se ha anulado.',
    de: 'Dieser Plan wurde abgesagt.', ja: 'この予定はとりやめになりました。'
  },
  'Questo piano è stato annullato da {chi}.': {
    en: 'This plan was cancelled by {chi}.', es: '{chi} ha anulado este plan.',
    de: 'Dieser Plan wurde von {chi} abgesagt.', ja: 'この予定は{chi}さんがとりやめました。'
  },

  /* ------------------------------------------------------- sito: non trovato */
  'Link non valido': { en: 'Link not valid', es: 'Enlace no válido',
                       de: 'Link ungültig', ja: 'リンクが無効です' },
  'Questo piano si apre dal suo link (quello che gira su WhatsApp): da questo telefono non risulti dentro.': {
    en: 'This plan opens from its own link — the one going round on WhatsApp. From this phone you’re not in it.',
    es: 'Este plan se abre desde su enlace, el que circula por WhatsApp. Desde este teléfono no constas dentro.',
    de: 'Dieser Plan öffnet sich über seinen Link — den, der auf WhatsApp herumgeht. Von diesem Handy aus bist du nicht dabei.',
    ja: 'この予定は、WhatsApp で回っているリンクから開きます。この端末では参加者として登録されていません。'
  },

  /* ============================================================== l'app */
  /* Da qui in giù sono le stringhe dell'app. Il sito è la pagina che si
     apre da un link; l'app è quella che si installa, ed è molto più larga.
     Il tono resta lo stesso: si dà del tu, si spiega cosa succede davvero,
     non si promette niente che il prodotto non faccia. */

  /* ------------------------------------------------------ chi può votare */
  'Chi può votare': { en: 'Who can vote', es: 'Quién puede votar',
                      de: 'Wer abstimmen darf', ja: '投票できる人' },
  'Con un link aperto la stessa persona può votare più volte da finestre diverse. Se conta, stringi.': {
    en: 'With an open link the same person can vote more than once from different windows. If it matters, tighten it.',
    es: 'Con un enlace abierto la misma persona puede votar varias veces desde ventanas distintas. Si importa, restríngelo.',
    de: 'Bei einem offenen Link kann dieselbe Person aus verschiedenen Fenstern mehrmals abstimmen. Wenn es darauf ankommt, schränke ihn ein.',
    ja: 'リンクを誰でも開ける状態だと、同じ人が別のウィンドウから何度も投票できます。気になる場合は制限してください。'
  },
  'Chi apre il link vedrà questi nomi e sceglierà il suo.': {
    en: 'Whoever opens the link will see these names and pick their own.',
    es: 'Quien abra el enlace verá estos nombres y elegirá el suyo.',
    de: 'Wer den Link öffnet, sieht diese Namen und wählt seinen eigenen.',
    ja: 'リンクを開いた人にはこの名前が並び、自分のものを選びます。'
  },
  'Chi è già entrato resta': { en: 'Those already in stay in', es: 'Quien ya entró se queda',
                               de: 'Wer schon drin ist, bleibt', ja: 'すでに参加した人はそのまま' },
  'Chi l\'ha già usato resta dentro': {
    en: 'Anyone who already used it stays in', es: 'Quien ya lo usó se queda dentro',
    de: 'Wer ihn schon benutzt hat, bleibt dabei', ja: 'すでに使った人はそのまま参加しています' },
  'Salva il limite': { en: 'Save the limit', es: 'Guardar el límite',
                       de: 'Grenze speichern', ja: '上限を保存' },
  'Revocare non rompe niente per chi ha già votato: serve quando il link finisce dove non doveva.': {
    en: 'Revoking breaks nothing for those who already voted — it’s for when the link ends up where it shouldn’t.',
    es: 'Revocar no rompe nada para quien ya votó: sirve cuando el enlace acaba donde no debía.',
    de: 'Ein Widerruf ändert nichts für alle, die schon abgestimmt haben — er ist für den Fall, dass der Link irgendwo landet, wo er nicht hingehört.',
    ja: '取り消しても、すでに投票した人には何も起きません。リンクが本来届くべきでない場所に渡ったときのためのものです。'
  },

  /* ------------------------------------------------------------- gruppi */
  'Esci dal gruppo': { en: 'Leave the group', es: 'Salir del grupo',
                       de: 'Gruppe verlassen', ja: 'グループを抜ける' },
  'Elimina gruppo': { en: 'Delete group', es: 'Eliminar grupo',
                      de: 'Gruppe löschen', ja: 'グループを削除' },
  'Silenzia questo gruppo': { en: 'Mute this group', es: 'Silenciar este grupo',
                              de: 'Gruppe stummschalten', ja: 'このグループを通知オフ' },
  'Chi entra dopo viene aggiunto solo ai piani ancora ai voti. Chi esce sparisce dai piani futuri e resta in quelli passati.': {
    en: 'Whoever joins later is added only to plans still being voted on. Whoever leaves disappears from future plans and stays in past ones.',
    es: 'Quien entra después se añade solo a los planes que aún se están votando. Quien sale desaparece de los planes futuros y permanece en los pasados.',
    de: 'Wer später dazukommt, wird nur zu Plänen hinzugefügt, über die noch abgestimmt wird. Wer geht, verschwindet aus künftigen Plänen und bleibt in den vergangenen.',
    ja: 'あとから参加した人は、まだ投票中の予定にだけ追加されます。抜けた人は今後の予定から消え、過去の予定には残ります。'
  },
  '🔒 Gruppo privato: si entra solo con il link d\'invito.': {
    en: '🔒 Private group — you get in only with the invite link.',
    es: '🔒 Grupo privado: solo se entra con el enlace de invitación.',
    de: '🔒 Private Gruppe — Zutritt nur über den Einladungslink.',
    ja: '🔒 非公開グループ：招待リンクからのみ参加できます。'
  },
  'Fai lo stesso per il tuo gruppo': {
    en: 'Do the same for your group', es: 'Haz lo mismo con tu grupo',
    de: 'Mach das Gleiche für deine Gruppe', ja: '自分のグループでも同じように' },
  'Tocca per entrare. Ti chiederemo solo il nome.': {
    en: 'Tap to join. We’ll only ask for your name.',
    es: 'Toca para entrar. Solo te pediremos el nombre.',
    de: 'Tippen zum Beitreten. Wir fragen nur nach deinem Namen.',
    ja: 'タップして参加。お名前だけうかがいます。'
  },

  /* -------------------------------------------------------- amici e conto */
  'Gli amici servono per invitare in fretta quando crei un gruppo. Non vedono i tuoi piani: la visibilità resta per gruppo.': {
    en: 'Friends are there so you can invite people quickly when you create a group. They don’t see your plans — visibility stays per group.',
    es: 'Los amigos sirven para invitar rápido cuando creas un grupo. No ven tus planes: la visibilidad sigue siendo por grupo.',
    de: 'Freunde sind dazu da, dass du beim Erstellen einer Gruppe schnell einladen kannst. Sie sehen deine Pläne nicht — Sichtbarkeit bleibt pro Gruppe.',
    ja: '友だちは、グループを作るときにすぐ招待するためのものです。あなたの予定は見えません。公開範囲はグループごとのままです。'
  },
  'Persone con cui hai già un gruppo o un piano. Gli amici non vedono i tuoi piani: servono solo per invitare in fretta.': {
    en: 'People you already share a group or a plan with. Friends don’t see your plans — they’re just there for quick invites.',
    es: 'Personas con las que ya compartes un grupo o un plan. Los amigos no ven tus planes: solo sirven para invitar rápido.',
    de: 'Leute, mit denen du schon eine Gruppe oder einen Plan teilst. Freunde sehen deine Pläne nicht — sie sind nur für schnelle Einladungen da.',
    ja: 'すでにグループや予定を共有している人たちです。友だちにあなたの予定は見えません。すぐ招待するためだけのものです。'
  },
  'Il nome è quello che vedono gli altri nei piani.': {
    en: 'This is the name other people see in plans.',
    es: 'Este es el nombre que los demás ven en los planes.',
    de: 'Diesen Namen sehen die anderen in den Plänen.',
    ja: '予定のなかで、ほかの人に表示される名前です。'
  },
  'Email': { en: 'Email', es: 'Correo', de: 'E-Mail', ja: 'メール' },
  'Collega i piani dal web': { en: 'Bring in your plans from the web',
    es: 'Vincula tus planes de la web', de: 'Pläne aus dem Web verbinden',
    ja: 'ウェブでの予定をつなげる' },
  'L\'email che hai usato sul web': {
    en: 'The email you used on the web', es: 'El correo que usaste en la web',
    de: 'Die E-Mail, die du im Web benutzt hast', ja: 'ウェブで使ったメールアドレス' },
  'Se hai votato da un link senza app e hai lasciato l\'email, scrivila qui: i tuoi voti e risposte passano a questo account.': {
    en: 'If you voted from a link without the app and left your email, type it here: your votes and answers move over to this account.',
    es: 'Si votaste desde un enlace sin la app y dejaste tu correo, escríbelo aquí: tus votos y respuestas pasan a esta cuenta.',
    de: 'Wenn du über einen Link ohne App abgestimmt und deine E-Mail hinterlassen hast, trag sie hier ein: Deine Stimmen und Antworten wandern zu diesem Konto.',
    ja: 'アプリなしでリンクから投票し、メールアドレスを残していた場合はここに入力してください。投票と回答がこのアカウントに移ります。'
  },
  'Nell\'app vera arriva un codice a quell\'email, per sicurezza.': {
    en: 'In the real app a code goes to that address, for safety.',
    es: 'En la app real llega un código a ese correo, por seguridad.',
    de: 'In der echten App geht ein Code an diese Adresse — zur Sicherheit.',
    ja: '実際のアプリでは、安全のためそのアドレスに確認コードが届きます。'
  },
  'Nessuna newsletter: una sola email quando viene confermato. La stessa email ti permette di ritrovare questo piano se poi installi l\'app.': {
    en: 'No newsletter — one email when it’s confirmed. That same address lets you find this plan again if you install the app later.',
    es: 'Sin newsletter: un solo correo cuando se confirme. Ese mismo correo te permite recuperar este plan si luego instalas la app.',
    de: 'Kein Newsletter — eine E-Mail, wenn es bestätigt ist. Mit derselben Adresse findest du diesen Plan wieder, falls du die App später installierst.',
    ja: 'ニュースレターはありません。確定したときに一通だけ届きます。同じアドレスで、あとからアプリを入れてもこの予定を見つけられます。'
  },
  'Ogni voce è tua. Un gruppo si silenzia dalla sua pagina (Gestisci / Info). Quello che non arriva come push resta comunque in Novità.': {
    en: 'Every setting here is yours. A group is muted from its own page (Manage / Info). Whatever doesn’t arrive as a push is still waiting in News.',
    es: 'Cada ajuste es tuyo. Un grupo se silencia desde su propia página (Gestionar / Info). Lo que no llegue como notificación sigue estando en Novedades.',
    de: 'Jede Einstellung hier gehört dir. Eine Gruppe wird auf ihrer eigenen Seite stummgeschaltet (Verwalten / Info). Was nicht als Push ankommt, wartet trotzdem unter Neues.',
    ja: 'ここの設定はすべてあなたのものです。グループはそのページ（管理／情報）から通知オフにできます。プッシュで届かなかったものも「新着」には残ります。'
  },
  'Ancora niente: quando qualcuno vota, conferma o risponde a un piano, compare qui.': {
    en: 'Nothing yet. When someone votes, confirms or replies to a plan, it shows up here.',
    es: 'Todavía nada. Cuando alguien vote, confirme o responda a un plan, aparecerá aquí.',
    de: 'Noch nichts. Sobald jemand abstimmt, bestätigt oder auf einen Plan antwortet, erscheint es hier.',
    ja: 'まだ何もありません。だれかが投票・確定・返信すると、ここに表示されます。'
  },
  '🔔 = con le tue impostazioni sarebbe arrivata una notifica.': {
    en: '🔔 = with your settings, this would have come as a notification.',
    es: '🔔 = con tus ajustes, esto habría llegado como notificación.',
    de: '🔔 = mit deinen Einstellungen wäre das als Benachrichtigung gekommen.',
    ja: '🔔 ＝ 現在の設定なら、これは通知として届いていたものです。'
  },

  /* ---------------------------------------------------- piani e proposte */
  'Aggiungi al piano': { en: 'Add to the plan', es: 'Añadir al plan',
                         de: 'Zum Plan hinzufügen', ja: '予定に追加' },
  'Aggiungi una domanda': { en: 'Add a question', es: 'Añadir una pregunta',
                            de: 'Frage hinzufügen', ja: '質問を追加' },
  'Proponi al gruppo': { en: 'Suggest it to the group', es: 'Propónselo al grupo',
                         de: 'Der Gruppe vorschlagen', ja: 'みんなに提案' },
  'Proponi un\'altra data': { en: 'Suggest another date', es: 'Proponer otra fecha',
                              de: 'Anderes Datum vorschlagen', ja: '別の日を提案' },
  'Ripeti questo piano': { en: 'Do this again', es: 'Repetir este plan',
                           de: 'Diesen Plan wiederholen', ja: 'この予定をもう一度' },
  'Avvisa il gruppo': { en: 'Tell the group', es: 'Avisar al grupo',
                        de: 'Der Gruppe Bescheid geben', ja: 'みんなに知らせる' },
  'Tutto il giorno': { en: 'All day', es: 'Todo el día', de: 'Ganztägig', ja: '終日' },
  'Non so': { en: 'Not sure', es: 'No sé', de: 'Weiß nicht', ja: 'わからない' },
  'Si vota insieme a quando e dove.': {
    en: 'It’s voted on together with when and where.',
    es: 'Se vota junto con el cuándo y el dónde.',
    de: 'Wird zusammen mit Wann und Wo abgestimmt.',
    ja: '日時・場所といっしょに投票します。'
  },
  'Due bottoni, 👍 Sì e 👎 No. Il voto vale subito, vince la maggioranza di chi risponde.': {
    en: 'Two buttons, 👍 Yes and 👎 No. The vote counts straight away; whoever answers, the majority wins.',
    es: 'Dos botones, 👍 Sí y 👎 No. El voto cuenta al momento y gana la mayoría de quienes respondan.',
    de: 'Zwei Knöpfe, 👍 Ja und 👎 Nein. Die Stimme zählt sofort; es gewinnt die Mehrheit derer, die antworten.',
    ja: 'ボタンは 👍 はい と 👎 いいえ の二つ。投票はすぐ反映され、答えた人の多数決で決まります。'
  },
  'Ogni data ha il suo "ci sono". Modifiche e proposte valgono per una data sola.': {
    en: 'Each date has its own “I’m in”. Changes and suggestions apply to one date only.',
    es: 'Cada fecha tiene su propio «voy». Los cambios y las propuestas valen para una sola fecha.',
    de: 'Jedes Datum hat sein eigenes „Ich bin dabei“. Änderungen und Vorschläge gelten für ein einzelnes Datum.',
    ja: '日付ごとに「参加する」があります。変更や提案は、その日付だけに効きます。'
  },
  'Crea un piano in 30 secondi, direttamente da qui.': {
    en: 'Make a plan in 30 seconds, right from here.',
    es: 'Crea un plan en 30 segundos, directamente desde aquí.',
    de: 'Mach in 30 Sekunden einen Plan, direkt von hier.',
    ja: 'ここから 30 秒で予定を作れます。'
  },
  'Tocca "Ci sono" per rispondere: ti chiederemo solo il nome.': {
    en: 'Tap “I’m in” to answer — we’ll only ask for your name.',
    es: 'Toca «Voy» para responder: solo te pediremos el nombre.',
    de: 'Tippe auf „Ich bin dabei“ — wir fragen nur nach deinem Namen.',
    ja: '「参加する」を押して返事してください。お名前だけうかがいます。'
  },
  'Tutti lo vedono nel piano, senza cercare il messaggio in chat.': {
    en: 'Everyone sees it in the plan, without digging for the message in the chat.',
    es: 'Todos lo ven en el plan, sin buscar el mensaje en el chat.',
    de: 'Alle sehen es im Plan, ohne die Nachricht im Chat zu suchen.',
    ja: 'チャットからメッセージを探さなくても、みんなが予定の中で見られます。'
  },

  /* -------------------------------------------------- se il piano salta */
  'Se salta, dirlo qui è meglio che sparire: chi ha il link lo vede, e messaggi e spese restano.': {
    en: 'If it falls through, saying so here beats vanishing: whoever has the link sees it, and messages and expenses stay put.',
    es: 'Si se cae, decirlo aquí es mejor que desaparecer: quien tenga el enlace lo ve, y los mensajes y los gastos siguen ahí.',
    de: 'Wenn es platzt, ist es besser, das hier zu sagen, als zu verschwinden: Wer den Link hat, sieht es, und Nachrichten und Ausgaben bleiben.',
    ja: '中止になったら、黙って消えるよりここで伝えるほうが親切です。リンクを持つ人には表示され、メッセージや費用はそのまま残ります。'
  },
  'Il link resta valido: chi lo apre vede che è saltato. Messaggi e spese restano dove sono.': {
    en: 'The link still works — whoever opens it sees that it’s off. Messages and expenses stay where they are.',
    es: 'El enlace sigue siendo válido: quien lo abra verá que se ha cancelado. Los mensajes y los gastos se quedan donde están.',
    de: 'Der Link bleibt gültig — wer ihn öffnet, sieht, dass es abgesagt ist. Nachrichten und Ausgaben bleiben, wo sie sind.',
    ja: 'リンクはそのまま使えます。開いた人には中止になったことが表示されます。メッセージや費用はそのまま残ります。'
  },
  'Il tuo "ci sono" diventa "non vengo" e il gruppo lo vede subito.': {
    en: 'Your “I’m in” becomes “I’m out”, and the group sees it right away.',
    es: 'Tu «voy» pasa a «no voy» y el grupo lo ve enseguida.',
    de: 'Aus deinem „Ich bin dabei“ wird „Ich komme nicht“, und die Gruppe sieht es sofort.',
    ja: '「参加する」が「行けない」に変わり、みんなにすぐ伝わります。'
  },
  'Es. esco tardi dal lavoro': { en: 'E.g. I’m getting out of work late',
    es: 'Ej. salgo tarde del trabajo', de: 'Z.B. ich komme spät aus der Arbeit',
    ja: '例：仕事が遅くなりそう' },
  'Es. per me va bene tutto ma non troppo tardi': {
    en: 'E.g. anything works for me, just not too late',
    es: 'Ej. me viene bien todo, pero no muy tarde',
    de: 'Z.B. mir passt alles, nur nicht zu spät',
    ja: '例：どれでもいいですが、あまり遅くない時間で' },

  /* ------------------------------------------------------- posti e spese */
  'Elimina posto': { en: 'Delete place', es: 'Eliminar sitio',
                     de: 'Ort löschen', ja: '場所を削除' },
  '★ Posto salvato · apri scheda': { en: '★ Saved place · open card',
    es: '★ Sitio guardado · abrir ficha', de: '★ Gespeicherter Ort · Karte öffnen',
    ja: '★ 保存した場所 · カードを開く' },
  '📷 Foto del menu': { en: '📷 Photo of the menu', es: '📷 Foto del menú',
                        de: '📷 Foto der Karte', ja: '📷 メニューの写真' },
  'Il ristorante di sempre, il campo, la casa al mare: nome, indirizzo e allegati tuoi (il menu fotografato). Quando lo usi in un piano, gli altri vedono solo nome e indirizzo.': {
    en: 'The usual restaurant, the pitch, the house by the sea: name, address and your own attachments (the menu you photographed). When you use it in a plan, the others only see name and address.',
    es: 'El restaurante de siempre, la cancha, la casa en la playa: nombre, dirección y tus propios adjuntos (el menú fotografiado). Cuando lo usas en un plan, los demás solo ven el nombre y la dirección.',
    de: 'Das Stammlokal, der Platz, das Haus am Meer: Name, Adresse und deine eigenen Anhänge (die abfotografierte Karte). Wenn du den Ort in einem Plan verwendest, sehen die anderen nur Name und Adresse.',
    ja: 'いつもの店、コート、海辺の家。名前と住所、そしてあなただけの添付（撮っておいたメニューなど）。予定で使うとき、ほかの人に見えるのは名前と住所だけです。'
  },
  '★ = copertina: è la foto che vedi in giro per l\'app e nei piani in cui usi il posto.': {
    en: '★ = cover: the photo you’ll see around the app and in the plans where you use this place.',
    es: '★ = portada: es la foto que verás por la app y en los planes donde uses el sitio.',
    de: '★ = Titelbild: das Foto, das dir in der App und in Plänen mit diesem Ort begegnet.',
    ja: '★ ＝ カバー写真。アプリのあちこちや、この場所を使った予定で表示されます。'
  },
  'La spesa pesa solo su chi scegli: "Marco ha pagato la cena di Silvio" = paga Marco, scegli solo Silvio. Chi paga può anche non esserci.': {
    en: 'The expense falls only on the people you pick: “Marco paid for Silvio’s dinner” = Marco pays, you pick only Silvio. Whoever paid doesn’t have to be among them.',
    es: 'El gasto recae solo sobre quien elijas: «Marco pagó la cena de Silvio» = paga Marco, eliges solo a Silvio. Quien paga puede no estar incluido.',
    de: 'Die Ausgabe trifft nur die, die du auswählst: „Marco hat Silvios Essen bezahlt“ = Marco zahlt, du wählst nur Silvio. Wer zahlt, muss nicht dabei sein.',
    ja: '費用は選んだ人にだけかかります。「マルコがシルヴィオの夕食を払った」＝ 払うのはマルコ、選ぶのはシルヴィオだけ。払った人が対象に入っていなくてもかまいません。'
  },
  'Membro eliminato': { en: 'Deleted member', es: 'Miembro eliminado',
                        de: 'Gelöschtes Mitglied', ja: '退会したメンバー' },

  /* ----------------------------------- app: la porta d'ingresso
     È la prima schermata che vede chi installa. Se resta in italiano, per un
     tedesco l'app è italiana — qualunque cosa dicano le altre duecento. */
  'Tutti hanno un’opinione. Kimari la trasforma in un piano.': {
    en: 'Everyone has an opinion. Kimari turns it into a plan.',
    es: 'Todo el mundo tiene una opinión. Kimari la convierte en un plan.',
    de: 'Jeder hat eine Meinung. Kimari macht daraus einen Plan.',
    ja: 'みんな意見があります。Kimari はそれを予定にします。'
  },
  'Ho almeno 16 anni': { en: 'I’m at least 16', es: 'Tengo al menos 16 años',
                         de: 'Ich bin mindestens 16', ja: '16 歳以上です' },
  'e accetto Termini e Privacy. Kimari non è per i minori di 16 anni.': {
    en: 'and I accept the Terms and Privacy Policy. Kimari isn’t for under-16s.',
    es: 'y acepto los Términos y la Privacidad. Kimari no es para menores de 16 años.',
    de: 'und ich akzeptiere Nutzungsbedingungen und Datenschutz. Kimari ist nichts für unter 16-Jährige.',
    ja: '利用規約とプライバシーポリシーに同意します。Kimari は 16 歳未満の方はご利用いただけません。'
  },
  'Continua con Apple': { en: 'Continue with Apple', es: 'Continuar con Apple',
                          de: 'Weiter mit Apple', ja: 'Apple で続ける' },
  'Con un account ritrovi i tuoi piani da qualsiasi telefono.': {
    en: 'With an account you find your plans again from any phone.',
    es: 'Con una cuenta recuperas tus planes desde cualquier teléfono.',
    de: 'Mit einem Konto findest du deine Pläne von jedem Handy aus wieder.',
    ja: 'アカウントがあれば、どの端末からでも自分の予定を開けます。'
  },
  'Oppure entra con un nome': { en: 'Or just come in with a name',
    es: 'O entra solo con un nombre', de: 'Oder komm einfach mit einem Namen rein',
    ja: 'または名前だけで始める' },
  'Entra': { en: 'Come in', es: 'Entrar', de: 'Rein', ja: 'はじめる' },
  'Resti su questo telefono: cambiando dispositivo i piani non ti seguono. Potrai collegare un account quando vuoi.': {
    en: 'You stay on this phone: change device and your plans don’t follow. You can link an account whenever you like.',
    es: 'Te quedas en este teléfono: si cambias de dispositivo, los planes no te siguen. Podrás vincular una cuenta cuando quieras.',
    de: 'Du bleibst auf diesem Handy: Beim Gerätewechsel kommen die Pläne nicht mit. Ein Konto kannst du jederzeit verknüpfen.',
    ja: 'この端末だけに残ります。機種を変えると予定は引き継がれません。アカウントはいつでも連携できます。'
  },
  'Niente password, niente rubrica. L’email serve solo a ritrovare i tuoi piani.': {
    en: 'No password, no address book. The email is only there to find your plans again.',
    es: 'Sin contraseña, sin agenda. El correo solo sirve para recuperar tus planes.',
    de: 'Kein Passwort, kein Adressbuch. Die E-Mail ist nur dazu da, deine Pläne wiederzufinden.',
    ja: 'パスワードも連絡先も不要です。メールは自分の予定を見つけ直すためだけに使います。'
  },

  /* ===================================== app: le etichette dell'interfaccia
     Sono le parole brevi — bottoni, titoletti, segnaposto. Erano rimaste fuori
     da tutti i controlli perché il rilevatore cercava parole italiane comuni
     ("che", "con", "dove") e "Nuovo gruppo" non ne contiene nessuna. Sono
     metà dell'interfaccia: senza queste l'app risultava tradotta e a schermo
     era mezza italiana. */

  /* -------------------------------------------------------- azioni comuni */
  'Aggiungi': { en: 'Add', es: 'Añadir', de: 'Hinzufügen', ja: '追加' },
  'aggiungi': { en: 'add', es: 'añadir', de: 'hinzufügen', ja: '追加' },
  'Rimuovi': { en: 'Remove', es: 'Quitar', de: 'Entfernen', ja: '削除' },
  'Togli': { en: 'Take off', es: 'Quitar', de: 'Wegnehmen', ja: '外す' },
  'Elimina': { en: 'Delete', es: 'Eliminar', de: 'Löschen', ja: '削除' },
  'Modifica': { en: 'Edit', es: 'Editar', de: 'Bearbeiten', ja: '編集' },
  'Annulla': { en: 'Cancel', es: 'Cancelar', de: 'Abbrechen', ja: 'キャンセル' },
  'Chiudi': { en: 'Close', es: 'Cerrar', de: 'Schließen', ja: '閉じる' },
  'Indietro': { en: 'Back', es: 'Atrás', de: 'Zurück', ja: '戻る' },
  'Scegli': { en: 'Choose', es: 'Elegir', de: 'Wählen', ja: '選ぶ' },
  'Condividi': { en: 'Share', es: 'Compartir', de: 'Teilen', ja: '共有' },
  'Collega': { en: 'Link', es: 'Vincular', de: 'Verknüpfen', ja: '連携' },
  'Applica ora': { en: 'Apply now', es: 'Aplicar ahora', de: 'Jetzt übernehmen', ja: '今すぐ反映' },
  'Rifiuta': { en: 'Turn down', es: 'Rechazar', de: 'Ablehnen', ja: '却下' },
  'Proponi': { en: 'Suggest', es: 'Proponer', de: 'Vorschlagen', ja: '提案' },
  'Sollecita': { en: 'Nudge', es: 'Recordar', de: 'Anstupsen', ja: 'そっと催促' },
  'Silenzia': { en: 'Mute', es: 'Silenciar', de: 'Stumm', ja: '通知オフ' },
  'Avvisami': { en: 'Let me know', es: 'Avísame', de: 'Sag mir Bescheid', ja: '知らせて' },
  'Passa ★': { en: 'Make it ★', es: 'Pasar a ★', de: 'Zu ★ machen', ja: '★ にする' },

  /* ------------------------------------------------ navigazione e sezioni */
  'Gruppi': { en: 'Groups', es: 'Grupos', de: 'Gruppen', ja: 'グループ' },
  'gruppi': { en: 'groups', es: 'grupos', de: 'Gruppen', ja: 'グループ' },
  'Novità': { en: 'News', es: 'Novedades', de: 'Neues', ja: '新着' },
  'Persone': { en: 'People', es: 'Personas', de: 'Leute', ja: 'メンバー' },
  'Account': { en: 'Account', es: 'Cuenta', de: 'Konto', ja: 'アカウント' },
  'Opzioni': { en: 'Options', es: 'Opciones', de: 'Optionen', ja: '設定' },
  'Commenti': { en: 'Comments', es: 'Comentarios', de: 'Kommentare', ja: 'コメント' },
  'Spese': { en: 'Expenses', es: 'Gastos', de: 'Ausgaben', ja: '費用' },
  'Saldi': { en: 'Balances', es: 'Saldos', de: 'Salden', ja: '精算' },
  'Storico': { en: 'History', es: 'Historial', de: 'Verlauf', ja: '履歴' },
  'Allegati': { en: 'Attachments', es: 'Adjuntos', de: 'Anhänge', ja: '添付' },
  'Allegati e foto': { en: 'Attachments and photos', es: 'Adjuntos y fotos',
                       de: 'Anhänge und Fotos', ja: '添付と写真' },
  'Contenuti': { en: 'Content', es: 'Contenidos', de: 'Inhalte', ja: 'コンテンツ' },
  'I miei posti': { en: 'My places', es: 'Mis sitios', de: 'Meine Orte', ja: '自分の場所' },
  'Calendario': { en: 'Calendar', es: 'Calendario', de: 'Kalender', ja: 'カレンダー' },
  'Calendario di sistema': { en: 'System calendar', es: 'Calendario del sistema',
                             de: 'Systemkalender', ja: '端末のカレンダー' },
  'Mese precedente': { en: 'Previous month', es: 'Mes anterior',
                       de: 'Voriger Monat', ja: '前の月' },
  'Mese successivo': { en: 'Next month', es: 'Mes siguiente',
                       de: 'Nächster Monat', ja: '次の月' },
  'Niente in programma': { en: 'Nothing on', es: 'Nada previsto',
                           de: 'Nichts geplant', ja: '予定はありません' },
  'organizzati': { en: 'organised', es: 'organizados', de: 'organisiert', ja: '企画済み' },

  /* ------------------------------------------------- creazione di un piano */
  'Cosa organizzi?': { en: 'What are you organising?', es: '¿Qué organizas?',
                       de: 'Was organisierst du?', ja: '何を企画しますか？' },
  'Cena sabato': { en: 'Dinner on Saturday', es: 'Cena el sábado',
                   de: 'Essen am Samstag', ja: '土曜の夕食' },
  'Cambia emoji': { en: 'Change emoji', es: 'Cambiar emoji',
                    de: 'Emoji ändern', ja: '絵文字を変える' },
  'So già': { en: 'I already know', es: 'Ya lo sé', de: 'Weiß ich schon', ja: 'もう決まっている' },
  'Decidiamo insieme': { en: 'Let’s decide together', es: 'Lo decidimos juntos',
                         de: 'Entscheiden wir gemeinsam', ja: 'みんなで決める' },
  'Inizio': { en: 'Start', es: 'Inicio', de: 'Beginn', ja: '開始' },
  'Fine': { en: 'End', es: 'Fin', de: 'Ende', ja: '終了' },
  '(facoltativa)': { en: '(optional)', es: '(opcional)', de: '(optional)', ja: '（任意）' },
  'Titolo (facoltativo)': { en: 'Title (optional)', es: 'Título (opcional)',
                            de: 'Titel (optional)', ja: 'タイトル（任意）' },
  'Si ripete': { en: 'Repeats', es: 'Se repite', de: 'Wiederholt sich', ja: '繰り返し' },
  'Quante volte': { en: 'How many times', es: 'Cuántas veces',
                    de: 'Wie oft', ja: '回数' },
  'Luogo': { en: 'Place', es: 'Sitio', de: 'Ort', ja: '場所' },
  'Indirizzo': { en: 'Address', es: 'Dirección', de: 'Adresse', ja: '住所' },
  'Indirizzo (facoltativo)': { en: 'Address (optional)', es: 'Dirección (opcional)',
                               de: 'Adresse (optional)', ja: '住所（任意）' },
  'nome, indirizzo, menu': { en: 'name, address, menu', es: 'nombre, dirección, menú',
                             de: 'Name, Adresse, Karte', ja: '名前、住所、メニュー' },
  'Pizza / Sushi / Carne': { en: 'Pizza / Sushi / Grill', es: 'Pizza / Sushi / Carne',
                             de: 'Pizza / Sushi / Fleisch', ja: 'ピザ／寿司／焼肉' },
  'Mare / Montagna / Città': { en: 'Seaside / Mountains / City',
    es: 'Playa / Montaña / Ciudad', de: 'Meer / Berge / Stadt', ja: '海／山／街' },
  'es. "Cosa portiamo?"': { en: 'e.g. “What shall we bring?”',
    es: 'ej. «¿Qué llevamos?»', de: 'z.B. „Was bringen wir mit?“',
    ja: '例：「何を持っていく？」' },
  'Un\'opzione': { en: 'One option', es: 'Una opción', de: 'Eine Option', ja: '選択肢' },
  'Scelta tra opzioni': { en: 'Pick between options', es: 'Elección entre opciones',
                          de: 'Auswahl zwischen Optionen', ja: '候補から選ぶ' },
  'Sì o No': { en: 'Yes or No', es: 'Sí o No', de: 'Ja oder Nein', ja: 'はい／いいえ' },
  '👍 Sì': { en: '👍 Yes', es: '👍 Sí', de: '👍 Ja', ja: '👍 はい' },
  '👎 No': { en: '👎 No', es: '👎 No', de: '👎 Nein', ja: '👎 いいえ' },
  'Fra 2 giorni alle 18:00': { en: 'In 2 days at 18:00', es: 'Dentro de 2 días a las 18:00',
                               de: 'In 2 Tagen um 18:00', ja: '2 日後の 18:00' },
  'Massimo di persone': { en: 'Maximum number of people', es: 'Máximo de personas',
                          de: 'Höchstzahl an Personen', ja: '人数の上限' },
  'Aggiungi un nome': { en: 'Add a name', es: 'Añadir un nombre',
                        de: 'Namen hinzufügen', ja: '名前を追加' },
  '＋ Nuova': { en: '＋ New', es: '＋ Nueva', de: '＋ Neu', ja: '＋ 新規' },
  '＋ Nuovo ospite (web)': { en: '＋ New guest (web)', es: '＋ Invitado nuevo (web)',
                            de: '＋ Neuer Gast (Web)', ja: '＋ 新しいゲスト（ウェブ）' },
  'Icona': { en: 'Icon', es: 'Icono', de: 'Symbol', ja: 'アイコン' },
  'Colore': { en: 'Colour', es: 'Color', de: 'Farbe', ja: '色' },
  'Icona, colore, nome, sezione': { en: 'Icon, colour, name, section',
    es: 'Icono, color, nombre, sección', de: 'Symbol, Farbe, Name, Bereich',
    ja: 'アイコン、色、名前、セクション' },

  /* ------------------------------------------------- il piano, giorno per giorno */
  'In decisione': { en: 'Being decided', es: 'En decisión',
                    de: 'Wird entschieden', ja: '決定中' },
  'Annullato': { en: 'Called off', es: 'Cancelado', de: 'Abgesagt', ja: '中止' },
  'Kimari!': { en: 'Kimari!', es: '¡Kimari!', de: 'Kimari!', ja: 'Kimari！' },
  'Ci sei?': { en: 'Are you in?', es: '¿Te apuntas?', de: 'Bist du dabei?', ja: '参加しますか？' },
  'Le altre date': { en: 'The other dates', es: 'Las otras fechas',
                     de: 'Die anderen Termine', ja: 'ほかの日程' },
  'Orario': { en: 'Time', es: 'Hora', de: 'Uhrzeit', ja: '時刻' },
  'Il link': { en: 'The link', es: 'El enlace', de: 'Der Link', ja: 'リンク' },
  'Copia messaggio': { en: 'Copy the message', es: 'Copiar el mensaje',
                       de: 'Nachricht kopieren', ja: 'メッセージをコピー' },
  'Condividi su WhatsApp': { en: 'Share on WhatsApp', es: 'Compartir por WhatsApp',
                             de: 'Auf WhatsApp teilen', ja: 'WhatsApp で共有' },
  'Invita un amico su WhatsApp': { en: 'Invite a friend on WhatsApp',
    es: 'Invitar a un amigo por WhatsApp', de: 'Freund über WhatsApp einladen',
    ja: 'WhatsApp で友だちを誘う' },
  'Revoca il link': { en: 'Revoke the link', es: 'Revocar el enlace',
                      de: 'Link widerrufen', ja: 'リンクを無効にする' },
  'Revoca il link d\'invito': { en: 'Revoke the invite link', es: 'Revocar el enlace de invitación',
                                de: 'Einladungslink widerrufen', ja: '招待リンクを無効にする' },
  'Apri in Mappe': { en: 'Open in Maps', es: 'Abrir en Mapas',
                     de: 'In Karten öffnen', ja: 'マップで開く' },
  'Apri la decisione': { en: 'Open the decision', es: 'Abrir la decisión',
                         de: 'Entscheidung öffnen', ja: '決めごとを開く' },
  'Arrivo in ritardo': { en: 'I’ll be late', es: 'Llego tarde',
                         de: 'Ich komme später', ja: '遅れて行きます' },
  'Imprevisti dell\'ultimo minuto': { en: 'Last-minute hitches',
    es: 'Imprevistos de última hora', de: 'Was kurzfristig dazwischenkommt',
    ja: '直前のトラブル' },
  'Se salta': { en: 'If it falls through', es: 'Si se cae',
                de: 'Wenn es platzt', ja: '中止になったら' },
  'Un motivo, se vuoi': { en: 'A reason, if you like', es: 'Un motivo, si quieres',
                          de: 'Ein Grund, wenn du magst', ja: '理由（任意）' },
  'Perché': { en: 'Why', es: 'Por qué', de: 'Warum', ja: '理由' },
  'Com\'è andata': { en: 'How it went', es: 'Qué tal fue',
                     de: 'Wie es war', ja: 'どうだった' },
  'Ho prenotato': { en: 'I’ve booked', es: 'He reservado',
                    de: 'Ich habe reserviert', ja: '予約しました' },
  'Proponi un cambio': { en: 'Suggest a change', es: 'Proponer un cambio',
                         de: 'Änderung vorschlagen', ja: '変更を提案' },
  'Proponi un\'altra opzione': { en: 'Suggest another option',
    es: 'Proponer otra opción', de: 'Andere Option vorschlagen', ja: '別の候補を提案' },
  'Ritira la proposta': { en: 'Withdraw the suggestion', es: 'Retirar la propuesta',
                          de: 'Vorschlag zurückziehen', ja: '提案を取り下げる' },
  'Ricevi il risultato': { en: 'Get the result', es: 'Recibe el resultado',
                           de: 'Ergebnis bekommen', ja: '結果を受け取る' },
  'Nota (es. chiedi il tavolo fuori)': { en: 'Note (e.g. ask for a table outside)',
    es: 'Nota (ej. pide mesa fuera)', de: 'Notiz (z.B. nach einem Tisch draußen fragen)',
    ja: 'メモ（例：外の席をお願い）' },

  /* ------------------------------------------------------- soldi e allegati */
  'Aggiungi spesa': { en: 'Add an expense', es: 'Añadir gasto',
                      de: 'Ausgabe hinzufügen', ja: '費用を追加' },
  'Importo': { en: 'Amount', es: 'Importe', de: 'Betrag', ja: '金額' },
  'Ha pagato': { en: 'Paid by', es: 'Ha pagado', de: 'Bezahlt von', ja: '支払った人' },
  'Diviso tra': { en: 'Split between', es: 'Dividido entre',
                  de: 'Geteilt unter', ja: '分担する人' },
  'Cosa (es. cena, benzina, casa)': { en: 'What for (e.g. dinner, petrol, the house)',
    es: 'Concepto (ej. cena, gasolina, casa)', de: 'Wofür (z.B. Essen, Benzin, Haus)',
    ja: '内容（例：夕食、ガソリン、宿）' },
  'Aggiungi un link': { en: 'Add a link', es: 'Añadir un enlace',
                        de: 'Link hinzufügen', ja: 'リンクを追加' },
  '🔗 Link': { en: '🔗 Link', es: '🔗 Enlace', de: '🔗 Link', ja: '🔗 リンク' },
  '📎 Allegato': { en: '📎 Attachment', es: '📎 Adjunto', de: '📎 Anhang', ja: '📎 添付' },
  'https://…': { en: 'https://…', es: 'https://…', de: 'https://…', ja: 'https://…' },
  'Copertina': { en: 'Cover', es: 'Portada', de: 'Titelbild', ja: 'カバー' },

  /* -------------------------------------------------- profilo e impostazioni */
  'Modifica profilo': { en: 'Edit profile', es: 'Editar perfil',
                        de: 'Profil bearbeiten', ja: 'プロフィールを編集' },
  'Lingua': { en: 'Language', es: 'Idioma', de: 'Sprache', ja: '言語' },
  'Italiano': { en: 'Italian', es: 'Italiano', de: 'Italienisch', ja: 'イタリア語' },
  'Notifiche push': { en: 'Push notifications', es: 'Notificaciones push',
                      de: 'Push-Benachrichtigungen', ja: 'プッシュ通知' },
  'Niente push, ma le novità restano': { en: 'No push, but the news stays',
    es: 'Sin notificaciones, pero las novedades se quedan',
    de: 'Kein Push, aber das Neue bleibt', ja: 'プッシュは届きませんが、新着には残ります' },
  'Esporta i miei dati': { en: 'Export my data', es: 'Exportar mis datos',
                           de: 'Meine Daten exportieren', ja: 'データを書き出す' },
  'Elimina account': { en: 'Delete account', es: 'Eliminar cuenta',
                       de: 'Konto löschen', ja: 'アカウントを削除' },
  'Cancellazione': { en: 'Deletion', es: 'Eliminación', de: 'Löschung', ja: '削除について' },
  'Cosa raccogliamo': { en: 'What we collect', es: 'Qué recogemos',
                        de: 'Was wir erheben', ja: '取得する情報' },
  'Gruppi privati': { en: 'Private groups', es: 'Grupos privados',
                      de: 'Private Gruppen', ja: '非公開グループ' },
  'Termini, privacy ed età': { en: 'Terms, privacy and age',
    es: 'Términos, privacidad y edad', de: 'Bedingungen, Datenschutz und Alter',
    ja: '規約・プライバシー・年齢' },
  'Termini, privacy ed età minima': { en: 'Terms, privacy and minimum age',
    es: 'Términos, privacidad y edad mínima', de: 'Bedingungen, Datenschutz und Mindestalter',
    ja: '規約・プライバシー・年齢制限' },
  'Età minima 16 anni.': { en: 'Minimum age 16.', es: 'Edad mínima 16 años.',
                           de: 'Mindestalter 16 Jahre.', ja: '16 歳以上が対象です。' },
  'In breve, il testo vero lo scrive un avvocato.': {
    en: 'The short version — the real text is written by a lawyer.',
    es: 'En resumen; el texto de verdad lo escribe un abogado.',
    de: 'Kurz gefasst — den echten Text schreibt ein Anwalt.',
    ja: '要点だけです。正式な文面は弁護士が作成します。'
  },
  'Kimari Unlimited': { en: 'Kimari Unlimited', es: 'Kimari Unlimited',
                        de: 'Kimari Unlimited', ja: 'Kimari Unlimited' },
  'Unlimited': { en: 'Unlimited', es: 'Unlimited', de: 'Unlimited', ja: 'Unlimited' },
  'Pass evento singolo': { en: 'Single-event pass', es: 'Pase de evento único',
                           de: 'Pass für ein einzelnes Event', ja: 'イベント単発パス' },
  'Prototipo': { en: 'Prototype', es: 'Prototipo', de: 'Prototyp', ja: 'プロトタイプ' },
  'Kimari · prototipo app': { en: 'Kimari · app prototype', es: 'Kimari · prototipo de app',
                              de: 'Kimari · App-Prototyp', ja: 'Kimari · アプリのプロトタイプ' },

  /* ------------------------------------------------- app: gruppi e sezioni */
  'Nome del gruppo': { en: 'Group name', es: 'Nombre del grupo',
                       de: 'Name der Gruppe', ja: 'グループ名' },
  'La tua sezione': { en: 'Your section', es: 'Tu sección',
                      de: 'Dein Bereich', ja: 'あなたのセクション' },
  'Nessuna': { en: 'None', es: 'Ninguna', de: 'Keiner', ja: 'なし' },
  'Nome della sezione, es. Milano': { en: 'Section name, e.g. Milan',
    es: 'Nombre de la sección, ej. Milán', de: 'Name des Bereichs, z.B. Mailand',
    ja: 'セクション名（例：ミラノ）' },
  'Le sezioni sono solo tue: gli altri membri ordinano i gruppi a modo loro.': {
    en: 'Sections are yours alone — the other members sort their groups their own way.',
    es: 'Las secciones son solo tuyas: los demás miembros ordenan los grupos a su manera.',
    de: 'Bereiche gehören dir allein — die anderen Mitglieder ordnen ihre Gruppen, wie sie wollen.',
    ja: 'セクションはあなただけのものです。ほかのメンバーは自分のやり方でグループを並べます。'
  },
  '★ amici. Gli altri si aggiungono anche dopo, con il link d\'invito.': {
    en: '★ friends. The others can join later, with the invite link.',
    es: '★ amigos. Los demás pueden entrar después, con el enlace de invitación.',
    de: '★ Freunde. Die anderen kommen auch später dazu, über den Einladungslink.',
    ja: '★ 友だち。ほかの人は招待リンクであとからでも参加できます。'
  },
  'Amici': { en: 'Friends', es: 'Amigos', de: 'Freunde', ja: '友だち' },
  'amici': { en: 'friends', es: 'amigos', de: 'Freunde', ja: '友だち' },
  'piani': { en: 'plans', es: 'planes', de: 'Pläne', ja: '予定' },
  'Aggiungi amici': { en: 'Add friends', es: 'Añadir amigos',
                      de: 'Freunde hinzufügen', ja: '友だちを追加' },
  'Aggiungi un posto': { en: 'Add a place', es: 'Añadir un sitio',
                         de: 'Ort hinzufügen', ja: '場所を追加' },
  '★ È tra i tuoi posti': { en: '★ It’s among your places', es: '★ Está entre tus sitios',
                            de: '★ Ist unter deinen Orten', ja: '★ 保存済みの場所です' },
  '☆ Salva tra i miei posti': { en: '☆ Save to my places', es: '☆ Guardar en mis sitios',
                                de: '☆ Zu meinen Orten', ja: '☆ 自分の場所に保存' },

  /* -------------------------------------------------- app: piano e conti */
  'Modifica il piano': { en: 'Edit the plan', es: 'Editar el plan',
                         de: 'Plan bearbeiten', ja: '予定を編集' },
  'Opzioni del piano': { en: 'Plan options', es: 'Opciones del plan',
                         de: 'Optionen des Plans', ja: '予定の設定' },
  'Salva e avvisa il gruppo': { en: 'Save and tell the group',
    es: 'Guardar y avisar al grupo', de: 'Speichern und der Gruppe Bescheid geben',
    ja: '保存してみんなに知らせる' },
  'Chi viene': { en: 'Who’s coming', es: 'Quién viene', de: 'Wer kommt', ja: '参加する人' },
  'Ci sono ✓': { en: 'I’m in ✓', es: 'Voy ✓', de: 'Ich bin dabei ✓', ja: '参加する ✓' },
  'Segna pagato': { en: 'Mark as paid', es: 'Marcar como pagado',
                    de: 'Als bezahlt markieren', ja: '支払い済みにする' },
  'Il link resta valido e mostra a tutti che è saltato. Nessuno perde i messaggi né le spese.': {
    en: 'The link still works and shows everyone it’s off. Nobody loses the messages or the expenses.',
    es: 'El enlace sigue siendo válido y muestra a todos que se ha cancelado. Nadie pierde los mensajes ni los gastos.',
    de: 'Der Link bleibt gültig und zeigt allen, dass es abgesagt ist. Niemand verliert Nachrichten oder Ausgaben.',
    ja: 'リンクはそのまま使え、中止になったことがみんなに表示されます。メッセージも費用も失われません。'
  },
  'Questo link resta sempre aggiornato: se qualcosa cambia, lo vedi qui con la versione nuova.': {
    en: 'This link stays up to date: if anything changes, you see it here in the new version.',
    es: 'Este enlace se mantiene al día: si algo cambia, lo ves aquí en la versión nueva.',
    de: 'Dieser Link bleibt aktuell: Ändert sich etwas, siehst du es hier in der neuen Fassung.',
    ja: 'このリンクは常に最新です。何か変わったら、新しい版としてここに表示されます。'
  },
  'Questo link non porta a nessun piano. Chiedi all\'organizzatore di rimandartelo.': {
    en: 'This link doesn’t lead to any plan. Ask whoever organised it to send it again.',
    es: 'Este enlace no lleva a ningún plan. Pídele a quien lo organiza que te lo reenvíe.',
    de: 'Dieser Link führt zu keinem Plan. Bitte die Person, die organisiert, ihn noch mal zu schicken.',
    ja: 'このリンクはどの予定にもつながっていません。幹事の方にもう一度送ってもらってください。'
  },

  /* ---------------------------------------- app: account, privacy, limiti */
  'Hai partecipato dal web?': { en: 'Did you take part from the web?',
    es: '¿Participaste desde la web?', de: 'Warst du übers Web dabei?',
    ja: 'ウェブから参加しましたか？' },
  'Niente account: il nome serve solo agli amici per sapere chi ha risposto.': {
    en: 'No account: the name is just so your friends know who answered.',
    es: 'Sin cuenta: el nombre solo sirve para que tus amigos sepan quién respondió.',
    de: 'Kein Konto: Der Name ist nur da, damit deine Freunde wissen, wer geantwortet hat.',
    ja: 'アカウントは不要です。名前は、だれが答えたかを友だちが分かるためだけのものです。'
  },
  'Eliminare l\'account cancella profilo, voti e risposte. Nei piani a cui hai partecipato resti come «Membro eliminato», così agli altri non spariscono i conti e i messaggi.': {
    en: 'Deleting your account removes your profile, votes and answers. In the plans you took part in you stay as “Deleted member”, so the others don’t lose their tallies and messages.',
    es: 'Eliminar la cuenta borra tu perfil, tus votos y tus respuestas. En los planes en los que participaste quedas como «Miembro eliminado», para que los demás no pierdan las cuentas ni los mensajes.',
    de: 'Das Löschen deines Kontos entfernt Profil, Stimmen und Antworten. In den Plänen, an denen du teilgenommen hast, bleibst du als „Gelöschtes Mitglied“, damit den anderen Abrechnungen und Nachrichten nicht verschwinden.',
    ja: 'アカウントを削除すると、プロフィール・投票・回答が消えます。参加した予定では「退会したメンバー」として残るので、ほかの人の精算やメッセージは失われません。'
  },
  'Dall\'app o dal web. Lo storico condiviso resta come «Membro eliminato».': {
    en: 'From the app or the web. Shared history stays as “Deleted member”.',
    es: 'Desde la app o la web. El historial compartido queda como «Miembro eliminado».',
    de: 'Aus der App oder im Web. Der geteilte Verlauf bleibt als „Gelöschtes Mitglied“.',
    ja: 'アプリからでもウェブからでも。共有された履歴は「退会したメンバー」として残ります。'
  },
  'Chi ha meno di 16 anni non può creare un account. Nei gruppi famiglia i nomi dei minori restano solo come nomi, senza altri dati.': {
    en: 'Under-16s can’t create an account. In family groups, children’s names stay as names only, with no other data.',
    es: 'Los menores de 16 años no pueden crear una cuenta. En los grupos familiares los nombres de los menores se quedan solo como nombres, sin más datos.',
    de: 'Unter 16 kann man kein Konto anlegen. In Familiengruppen bleiben die Namen von Kindern nur Namen, ohne weitere Daten.',
    ja: '16 歳未満の方はアカウントを作成できません。家族グループでは、お子さんの名前は名前としてだけ残り、ほかの情報は保存しません。'
  },
  'Nome, email se la dai, voti, risposte, commenti, allegati e foto che carichi. Niente rubrica, niente posizione in background.': {
    en: 'Your name, your email if you give it, votes, answers, comments, attachments and photos you upload. No address book, no background location.',
    es: 'Tu nombre, tu correo si lo das, votos, respuestas, comentarios, adjuntos y fotos que subas. Sin agenda, sin ubicación en segundo plano.',
    de: 'Dein Name, deine E-Mail falls du sie angibst, Stimmen, Antworten, Kommentare, Anhänge und Fotos, die du hochlädst. Kein Adressbuch, kein Standort im Hintergrund.',
    ja: '名前、（提供された場合は）メールアドレス、投票、回答、コメント、添付ファイル、アップロードした写真。連絡先やバックグラウンドの位置情報は取得しません。'
  },
  'Si entra solo su invito. Chi non è in un piano non ne vede nulla.': {
    en: 'You get in by invitation only. Anyone not in a plan sees nothing of it.',
    es: 'Solo se entra por invitación. Quien no está en un plan no ve nada de él.',
    de: 'Zutritt nur auf Einladung. Wer nicht in einem Plan ist, sieht nichts davon.',
    ja: '参加は招待からのみです。予定に入っていない人には、その中身は一切見えません。'
  },
  'Gli admin possono rimuovere commenti, allegati e persone. Puoi segnalare un contenuto o bloccare una persona.': {
    en: 'Admins can remove comments, attachments and people. You can report content or block a person.',
    es: 'Los admins pueden quitar comentarios, adjuntos y personas. Puedes denunciar contenido o bloquear a alguien.',
    de: 'Admins können Kommentare, Anhänge und Personen entfernen. Du kannst Inhalte melden oder jemanden blockieren.',
    ja: '管理者はコメント・添付・メンバーを削除できます。内容の報告や、特定の人のブロックもできます。'
  },
  'Cosa succede nei tuoi gruppi e nei piani in cui sei. Solo lì: chi non è in un piano non ne vede nulla. Le push le scegli tu nel Profilo; qui resta tutto.': {
    en: 'What’s happening in your groups and the plans you’re in. Only there: anyone not in a plan sees nothing of it. You choose the push notifications in your Profile; here everything stays.',
    es: 'Lo que pasa en tus grupos y en los planes en los que estás. Solo ahí: quien no está en un plan no ve nada de él. Las notificaciones las eliges tú en el Perfil; aquí se queda todo.',
    de: 'Was in deinen Gruppen und den Plänen passiert, in denen du bist. Nur dort: Wer nicht in einem Plan ist, sieht nichts davon. Die Push-Nachrichten wählst du im Profil; hier bleibt alles.',
    ja: 'あなたのグループと、参加している予定での出来事です。そこだけ——予定に入っていない人には何も見えません。プッシュ通知はプロフィールで選べます。ここにはすべて残ります。'
  },
  'I limiti valgono per piano e li sblocca l\'Unlimited di chi organizza: paga uno, respira tutto il gruppo.': {
    en: 'The limits apply per plan and are lifted by the organiser’s Unlimited: one person pays, the whole group breathes.',
    es: 'Los límites son por plan y los desbloquea el Unlimited de quien organiza: paga uno, respira todo el grupo.',
    de: 'Die Grenzen gelten pro Plan und werden vom Unlimited der organisierenden Person aufgehoben: Einer zahlt, die ganze Gruppe atmet auf.',
    ja: '上限は予定ごとで、幹事の Unlimited で解除されます。ひとりが払えば、グループ全員が楽になります。'
  },
  '4,99 € una volta · un solo piano con limiti Unlimited: matrimoni, feste grandi, viaggi': {
    en: '€4.99 once · a single plan with Unlimited limits: weddings, big parties, trips',
    es: '4,99 € una vez · un solo plan con límites Unlimited: bodas, fiestas grandes, viajes',
    de: '4,99 € einmalig · ein einzelner Plan mit Unlimited-Grenzen: Hochzeiten, große Feste, Reisen',
    ja: '4,99 ユーロ 一回きり · 予定ひとつだけ Unlimited の上限に：結婚式、大きなパーティー、旅行'
  },

  /* ------------------------------------------- app: parole corte e titoli */
  'Nuovo gruppo': { en: 'New group', es: 'Grupo nuevo', de: 'Neue Gruppe', ja: '新しいグループ' },
  'Icona del gruppo': { en: 'Group icon', es: 'Icono del grupo',
                        de: 'Gruppensymbol', ja: 'グループのアイコン' },
  'I tuoi piani': { en: 'Your plans', es: 'Tus planes', de: 'Deine Pläne', ja: 'あなたの予定' },
  'Come ti chiami?': { en: 'What’s your name?', es: '¿Cómo te llamas?',
                       de: 'Wie heißt du?', ja: 'お名前は？' },
  'Con chi?': { en: 'With whom?', es: '¿Con quién?', de: 'Mit wem?', ja: 'だれと？' },
  'Quando?': { en: 'When?', es: '¿Cuándo?', de: 'Wann?', ja: 'いつ？' },
  'Dove?': { en: 'Where?', es: '¿Dónde?', de: 'Wo?', ja: 'どこで？' },
  'Data e ora': { en: 'Date and time', es: 'Fecha y hora', de: 'Datum und Uhrzeit', ja: '日時' },
  'Invia': { en: 'Send', es: 'Enviar', de: 'Senden', ja: '送信' },
  'Vai al piano': { en: 'Go to the plan', es: 'Ir al plan', de: 'Zum Plan', ja: '予定を開く' },
  'Tutto pronto': { en: 'All set', es: 'Todo listo', de: 'Alles bereit', ja: '準備完了' },
  'Copia solo il link': { en: 'Copy the link only', es: 'Copiar solo el enlace',
                          de: 'Nur den Link kopieren', ja: 'リンクだけコピー' },
  'Scrivi un commento': { en: 'Write a comment', es: 'Escribe un comentario',
                          de: 'Kommentar schreiben', ja: 'コメントを書く' },
  'Piano ricorrente': { en: 'Recurring plan', es: 'Plan recurrente',
                        de: 'Wiederkehrender Plan', ja: '繰り返しの予定' },
  'Altro da decidere insieme?': { en: 'Anything else to decide together?',
    es: '¿Algo más que decidir juntos?', de: 'Noch etwas gemeinsam zu entscheiden?',
    ja: 'ほかに決めることは？' },
  'Non posso più venire': { en: 'I can’t make it any more', es: 'Ya no puedo ir',
                            de: 'Ich kann doch nicht', ja: '行けなくなりました' },
  'Scadenza del voto · facoltativa': { en: 'Voting deadline · optional',
    es: 'Fecha límite del voto · opcional', de: 'Abstimmungsfrist · optional',
    ja: '投票の締切 · 任意' },
  'Gli altri possono proporre': { en: 'Others can suggest things',
    es: 'Los demás pueden proponer', de: 'Andere dürfen Vorschläge machen',
    ja: 'ほかの人も提案できる' },
  'Altre date o luoghi ai voti, e cambi dopo la conferma': {
    en: 'More dates or places up for a vote, and changes after it’s confirmed',
    es: 'Más fechas o sitios a votación, y cambios tras la confirmación',
    de: 'Weitere Termine oder Orte zur Abstimmung, und Änderungen nach der Bestätigung',
    ja: '候補の日時や場所の追加、確定後の変更もできます'
  },
  '🔗 Solo con link': { en: '🔗 By link only', es: '🔗 Solo con enlace',
                        de: '🔗 Nur per Link', ja: '🔗 リンクのみ' },
  'Disponibile nelle 24 ore prima dell\'inizio': {
    en: 'Available in the 24 hours before it starts',
    es: 'Disponible en las 24 horas previas al inicio',
    de: 'Verfügbar in den 24 Stunden davor',
    ja: '開始 24 時間前から使えます' },
  'Apri il link come nuovo ospite (web)': {
    en: 'Open the link as a new guest (web)', es: 'Abrir el enlace como invitado nuevo (web)',
    de: 'Link als neuer Gast öffnen (Web)', ja: '新しいゲストとしてリンクを開く（ウェブ）' },

  /* ----------------------------------------- app: spiegazioni piu' lunghe */
  'Le sezioni (Roma, Bari…) sono tue e solo tue: servono a ordinare le cerchie, non le vedono gli altri. Ogni gruppo è privato: si entra solo su invito.': {
    en: 'Sections (Rome, Bari…) are yours and only yours — they’re for tidying your circles, and nobody else sees them. Every group is private: you get in by invitation only.',
    es: 'Las secciones (Roma, Bari…) son tuyas y solo tuyas: sirven para ordenar tus círculos y nadie más las ve. Cada grupo es privado: solo se entra por invitación.',
    de: 'Bereiche (Rom, Bari…) gehören dir allein — sie ordnen deine Kreise, und niemand sonst sieht sie. Jede Gruppe ist privat: Zutritt nur auf Einladung.',
    ja: 'セクション（ローマ、バーリなど）はあなただけのもので、グループを整理するためのものです。ほかの人には見えません。グループはすべて非公開で、招待からのみ参加できます。'
  },
  'Versione web: chi riceve il link entra, scrive il nome e vota. L\'app con calendario e gruppi è per chi organizza.': {
    en: 'Web version: whoever gets the link comes in, types a name and votes. The app, with calendar and groups, is for whoever organises.',
    es: 'Versión web: quien recibe el enlace entra, escribe su nombre y vota. La app, con calendario y grupos, es para quien organiza.',
    de: 'Web-Version: Wer den Link bekommt, kommt rein, tippt einen Namen und stimmt ab. Die App mit Kalender und Gruppen ist für die, die organisieren.',
    ja: 'ウェブ版：リンクを受け取った人が開いて、名前を書いて投票します。カレンダーとグループのあるアプリは、幹事のためのものです。'
  },
  'Nessun gruppo ancora. Creane uno per la famiglia, gli amici o il prossimo viaggio.': {
    en: 'No groups yet. Make one for the family, your friends, or the next trip.',
    es: 'Aún no hay grupos. Crea uno para la familia, los amigos o el próximo viaje.',
    de: 'Noch keine Gruppen. Leg eine an — für die Familie, die Freunde oder die nächste Reise.',
    ja: 'まだグループがありません。家族、友だち、次の旅行用に作ってみてください。'
  },
  'Nessun piano ancora. Il primo lo crei tu: cena, weekend, partita. Oppure "Decidi qualcosa" per una domanda secca.': {
    en: 'No plans yet. You make the first one: dinner, a weekend, a match. Or “Decide something” for a straight question.',
    es: 'Aún no hay planes. El primero lo creas tú: una cena, un finde, un partido. O «Decide algo» para una pregunta directa.',
    de: 'Noch keine Pläne. Den ersten machst du: Essen, ein Wochenende, ein Spiel. Oder „Etwas entscheiden“ für eine schlichte Frage.',
    ja: 'まだ予定がありません。最初のひとつはあなたから。夕食、週末、試合。ひとこと聞きたいだけなら「決めよう」を。'
  },
  '★ creatore · ✦ admin. Gli admin possono rimuovere persone e cancellare commenti.': {
    en: '★ creator · ✦ admin. Admins can remove people and delete comments.',
    es: '★ creador · ✦ admin. Los admins pueden quitar personas y borrar comentarios.',
    de: '★ Ersteller · ✦ Admin. Admins können Leute entfernen und Kommentare löschen.',
    ja: '★ 作成者 · ✦ 管理者。管理者はメンバーの削除とコメントの削除ができます。'
  },
  'Gli invitati ti vedranno così. Niente account, niente password.': {
    en: 'This is how the people you invite will see you. No account, no password.',
    es: 'Así te verán los invitados. Sin cuenta, sin contraseña.',
    de: 'So sehen dich die Eingeladenen. Kein Konto, kein Passwort.',
    ja: '招待した人にはこう表示されます。アカウントもパスワードもいりません。'
  },
  'Con un gruppo, i membri vedono il piano subito in app. Con il link, chi lo riceve entra dal web senza installare niente.': {
    en: 'With a group, the members see the plan right away in the app. With the link, whoever gets it comes in from the web without installing anything.',
    es: 'Con un grupo, los miembros ven el plan al momento en la app. Con el enlace, quien lo recibe entra desde la web sin instalar nada.',
    de: 'Mit einer Gruppe sehen die Mitglieder den Plan sofort in der App. Mit dem Link kommt jeder übers Web rein, ohne etwas zu installieren.',
    ja: 'グループなら、メンバーはアプリですぐ予定を見られます。リンクなら、受け取った人が何もインストールせずウェブから参加できます。'
  },
  'Gli invitati segnano tutte le opzioni che gli vanno bene. Vince quella compatibile con più persone; la conferma è tua.': {
    en: 'The people you invite tick every option that works for them. The one that suits the most people wins; confirming is up to you.',
    es: 'Los invitados marcan todas las opciones que les vengan bien. Gana la que funcione para más gente; confirmar te toca a ti.',
    de: 'Die Eingeladenen markieren alles, was ihnen passt. Es gewinnt die Option, die den meisten passt; bestätigen tust du.',
    ja: '招待された人は、都合のいい候補をすべて選びます。いちばん多くの人に合うものが勝ち、確定するのはあなたです。'
  },
  'Sai già quando e dove: il piano nasce confermato e gli invitati rispondono solo "ci sono / forse / no".': {
    en: 'You already know when and where: the plan starts out confirmed and the people you invite just answer “in / maybe / out”.',
    es: 'Ya sabes cuándo y dónde: el plan nace confirmado y los invitados solo responden «voy / quizá / no».',
    de: 'Du weißt schon wann und wo: Der Plan startet bestätigt, und die Eingeladenen antworten nur „dabei / vielleicht / nein“.',
    ja: '日時も場所も決まっている場合、予定は最初から確定で始まり、招待された人は「参加／たぶん／不参加」を答えるだけです。'
  },
  'Il luogo lo decidete dopo. Il piano si può confermare anche senza: sulla pagina comparirà "Luogo da decidere".': {
    en: 'You’ll settle the place later. The plan can be confirmed without it — the page will say “Place to be decided”.',
    es: 'El sitio lo decidís después. El plan se puede confirmar igual: en la página pondrá «Sitio por decidir».',
    de: 'Den Ort klärt ihr später. Der Plan lässt sich auch ohne bestätigen — auf der Seite steht dann „Ort noch offen“.',
    ja: '場所はあとで決められます。なくても確定でき、ページには「場所は未定」と表示されます。'
  },
  'La scadenza è un promemoria per il gruppo. Il piano si chiude quando lo confermi tu.': {
    en: 'The deadline is a nudge for the group. The plan closes when you confirm it.',
    es: 'La fecha límite es un recordatorio para el grupo. El plan se cierra cuando lo confirmas tú.',
    de: 'Die Frist ist eine Erinnerung für die Gruppe. Der Plan schließt, wenn du ihn bestätigst.',
    ja: '締切はみんなへの目安です。予定が閉じるのは、あなたが確定したときです。'
  },
  'Calcetto ogni martedì, cena ogni primo venerdì: una data per volta, ognuna con il suo "ci sono"': {
    en: 'Five-a-side every Tuesday, dinner every first Friday: one date at a time, each with its own “I’m in”',
    es: 'Fútbol cada martes, cena cada primer viernes: una fecha a la vez, cada una con su «voy»',
    de: 'Fußball jeden Dienstag, Essen jeden ersten Freitag: ein Termin nach dem anderen, jeder mit eigenem „Ich bin dabei“',
    ja: '毎週火曜のフットサル、毎月第一金曜の食事。日付ごとに一つずつ、それぞれに「参加する」があります'
  },
  'Le proposte del gruppo non cambiano il piano da sole: decidi tu': {
    en: 'Suggestions from the group don’t change the plan by themselves — you decide',
    es: 'Las propuestas del grupo no cambian el plan por sí solas: decides tú',
    de: 'Vorschläge aus der Gruppe ändern den Plan nicht von allein — du entscheidest',
    ja: 'みんなの提案だけで予定は変わりません。決めるのはあなたです'
  },
  'Nessun commento. Le cose da decidere passano dai voti; qui solo quello che serve al piano.': {
    en: 'No comments. Things to decide go through the vote; here goes only what the plan needs.',
    es: 'Sin comentarios. Lo que hay que decidir pasa por la votación; aquí solo lo que necesita el plan.',
    de: 'Keine Kommentare. Was zu entscheiden ist, läuft über die Abstimmung; hier steht nur, was der Plan braucht.',
    ja: 'コメントはまだありません。決めごとは投票で。ここには予定に必要なことだけを。'
  },
  'Commenti interni al piano, visibili solo a chi è dentro. Per chiacchierare c\'è WhatsApp.': {
    en: 'Comments live inside the plan, visible only to those in it. For chatting there’s WhatsApp.',
    es: 'Comentarios internos del plan, visibles solo para quien está dentro. Para charlar está WhatsApp.',
    de: 'Kommentare bleiben im Plan und sind nur für die Beteiligten sichtbar. Zum Plaudern gibt es WhatsApp.',
    ja: 'コメントは予定の中だけのもので、参加者にしか見えません。おしゃべりは WhatsApp で。'
  },
  'Tutti lo vedono qui, senza cercarlo in chat': {
    en: 'Everyone sees it here, without hunting for it in the chat',
    es: 'Todos lo ven aquí, sin buscarlo en el chat',
    de: 'Alle sehen es hier, ohne im Chat danach zu suchen',
    ja: 'チャットを探さなくても、みんながここで見られます'
  },
  'Le foto restano nel piano, compresse; gli originali restano sul tuo telefono.': {
    en: 'Photos stay in the plan, compressed; the originals stay on your phone.',
    es: 'Las fotos se quedan en el plan, comprimidas; los originales siguen en tu teléfono.',
    de: 'Fotos bleiben im Plan, komprimiert; die Originale bleiben auf deinem Handy.',
    ja: '写真は圧縮されて予定に残ります。元の画像はあなたの端末にそのまま残ります。'
  },
  'Solo registrazione: i soldi passano fuori da Kimari (PayPal, Satispay, contanti). Le voci non si modificano, si annullano.': {
    en: 'Record-keeping only: the money moves outside Kimari (PayPal, Satispay, cash). Entries aren’t edited, they’re voided.',
    es: 'Solo registro: el dinero se mueve fuera de Kimari (PayPal, Bizum, efectivo). Las entradas no se modifican, se anulan.',
    de: 'Nur zum Festhalten: Das Geld fließt außerhalb von Kimari (PayPal, Satispay, bar). Einträge werden nicht geändert, sondern storniert.',
    ja: '記録のためだけの機能です。お金のやり取りは Kimari の外で行います（PayPal、Satispay、現金など）。記入は修正ではなく取り消しで直します。'
  },
  'Parti uguali tra chi scegli. Si può annullare, non modificare.': {
    en: 'Split evenly among the people you pick. It can be voided, not edited.',
    es: 'A partes iguales entre quienes elijas. Se puede anular, no modificar.',
    de: 'Zu gleichen Teilen unter den Ausgewählten. Stornierbar, nicht änderbar.',
    ja: '選んだ人で均等に割ります。取り消しはできますが、修正はできません。'
  }
};

/* ------------------------------------------------------------------ */

// Normalizza anche gli apostrofi e le virgolette tipografiche: nel codice si
// scrive "un'opinione" con l'apostrofo dritto, nei testi curati viene naturale
// scrivere "un’opinione". Sono due caratteri diversi, e senza questo la voce
// non verrebbe mai trovata — senza errori, senza avvisi: uscirebbe l'italiano
// e nessuno capirebbe perché.
const NORM = s => String(s)
  .replace(/[‘’ʼ]/g, "'")
  .replace(/[“”]/g, '"')
  .replace(/\s+/g, ' ')
  .trim();

// Indice normalizzato: nel codice le stringhe vanno a capo dentro i template,
// e "Segna tutte\n  le opzioni" deve trovare la stessa voce di "Segna tutte le
// opzioni".
const INDICE = new Map(Object.entries(DIZIONARIO).map(([k, v]) => [NORM(k), v]));

export function scegliLingua(preferite, forzata) {
  if (forzata && LINGUE[forzata]) return forzata;
  for (const p of (preferite || [])) {
    const due = String(p).slice(0, 2).toLowerCase();
    if (LINGUE[due]) return due;
  }
  return 'it';
}

// Torna una funzione t() legata a una lingua. Se la voce manca, o manca quella
// lingua, esce l'italiano: mai una chiave a video, mai una stringa vuota.
export function traduttore(lingua) {
  return function t(testo, valori) {
    const voce = lingua === 'it' ? null : INDICE.get(NORM(testo));
    let out = (voce && voce[lingua]) || testo;
    // I segnaposto si sostituiscono DOPO aver scelto la lingua, così ogni
    // lingua può metterli dove le servono.
    if (valori) {
      for (const k of Object.keys(valori)) out = out.split('{' + k + '}').join(String(valori[k]));
    }
    return out;
  };
}

export const quanteMancano = lingua =>
  Object.values(DIZIONARIO).filter(v => !v[lingua]).length;
