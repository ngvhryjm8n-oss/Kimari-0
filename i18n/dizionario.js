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
