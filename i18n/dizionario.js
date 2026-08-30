// dizionario.js — le stringhe dell'interfaccia in sei lingue.
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
  ja: '日本語',
  fr: 'Français'
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
  ,
    fr: 'Coche toutes les options qui te vont. Celle qui convient au plus de monde l’emporte.' },
  'Quando ti va bene? Segna tutte le opzioni ok': {
    en: 'When works for you? Tick every option that’s fine',
    es: '¿Cuándo te viene bien? Marca todas las que te sirvan',
    de: 'Wann passt es dir? Markiere alles, was geht',
    ja: 'いつがいいですか？　都合のいい日をすべて選んでください'
  ,
    fr: 'Quand es-tu dispo ? Coche toutes les options ok' },
  'Segna tutte le opzioni che ti vanno bene': {
    en: 'Tick every option that works for you',
    es: 'Marca todas las opciones que te vengan bien',
    de: 'Markiere alles, was dir passt',
    ja: '都合のいい候補をすべて選んでください'
  ,
    fr: 'Coche toutes les options qui te vont' },
  'Dove ti va bene?': {
    en: 'Where works for you?', es: '¿Dónde te viene bien?',
    de: 'Wo passt es dir?', ja: 'どこがいいですか？'
  ,
    fr: 'Où ça t’arrange ?' },
  'Nessuna mi va bene': {
    en: 'None work for me', es: 'Ninguna me viene bien',
    de: 'Keine passt mir', ja: 'どれも都合が合いません'
  ,
    fr: 'Aucune ne me va' },
  'Il tuo nome': { en: 'Your name', es: 'Tu nombre', de: 'Dein Name', ja: 'お名前' ,
    fr: 'Ton nom' },
  'Oppure scrivi il tuo nome': {
    en: 'Or type your name', es: 'O escribe tu nombre',
    de: 'Oder schreib deinen Namen', ja: 'または名前を入力'
  ,
    fr: 'Ou écris ton nom' },
  'Sei uno di questi?': {
    en: 'Are you one of these?', es: '¿Eres una de estas personas?',
    de: 'Bist du eine davon?', ja: 'この中にいますか？'
  ,
    fr: 'Tu es l’un d’eux ?' },
  'Chi sei?': {
    en: 'Who are you?', es: '¿Quién eres?',
    de: 'Wer bist du?', ja: 'どなたですか？'
  ,
    fr: 'Qui es-tu ?' },
  // Titoletti di sezione quando la data o il posto sono già decisi.
  'Quando': { en: 'When', es: 'Cuándo', de: 'Wann', ja: '日時' ,
    fr: 'Quand' },
  'Dove': { en: 'Where', es: 'Dónde', de: 'Wo', ja: '場所' ,
    fr: 'Où' },
  // La data la formatta toLocaleString (regola 4): qui passa già scritta.
  // "Si chiude" diceva cosa fa il piano; "Vota entro" dice cosa devi fare tu.
  // E' il micro-copy chiesto dalla ROADMAP-V1: rivedere le etichette dove non
  // descrivono l'azione.
  'Vota entro {quando}': {
    en: 'Vote by {quando}', es: 'Vota antes del {quando}',
    de: 'Stimm ab bis {quando}', ja: '{quando} までに投票',
    fr: 'Vote avant {quando}' },
  'Nota per il gruppo · facoltativa': {
    en: 'A note for the group · optional',
    es: 'Una nota para el grupo · opcional',
    de: 'Notiz für die Gruppe · optional',
    ja: 'みんなへのひとこと · 任意'
  ,
    fr: 'Note pour le groupe · facultative' },
  'Es. per me va bene tutto, ma non troppo tardi': {
    en: 'E.g. anything works for me, just not too late',
    es: 'Ej. me viene bien todo, pero no muy tarde',
    de: 'Z.B. mir passt alles, nur nicht zu spät',
    ja: '例：どれでもいいですが、あまり遅くない時間で'
  ,
    fr: 'Ex. tout me va, mais pas trop tard' },
  'Se non segni nulla vale come "nessuna opzione mi va bene". L’ultimo invio sostituisce il precedente.': {
    en: 'Marking nothing counts as “none of these work for me”. Your latest submission replaces the previous one.',
    es: 'No marcar nada cuenta como «ninguna me viene bien». El último envío sustituye al anterior.',
    de: 'Nichts zu markieren gilt als „keine passt mir“. Die letzte Antwort ersetzt die vorherige.',
    ja: '何も選ばない場合は「どれも都合が合わない」として扱われます。最後に送ったものが有効です。'
  ,
    fr: 'Ne rien cocher vaut « aucune option ne me va ». Le dernier envoi remplace le précédent.' },
  'Invia il mio voto': {
    en: 'Send my vote', es: 'Enviar mi voto',
    de: 'Meine Stimme senden', ja: '投票する'
  ,
    fr: 'Envoyer mon vote' },
  'Aggiorna il mio voto': {
    en: 'Update my vote', es: 'Actualizar mi voto',
    de: 'Meine Stimme ändern', ja: '投票を変更する'
  ,
    fr: 'Mettre à jour mon vote' },
  'Invio…': { en: 'Sending…', es: 'Enviando…', de: 'Wird gesendet…', ja: '送信中…' ,
    fr: 'Envoi…' },
  'Dimmi chi sei: tocca il tuo nome o scrivilo.': {
    en: 'Tell us who you are: tap your name or type it.',
    es: 'Dinos quién eres: toca tu nombre o escríbelo.',
    de: 'Sag uns, wer du bist: tippe deinen Namen an oder schreib ihn.',
    ja: 'お名前を選ぶか入力してください。'
  ,
    fr: 'Dis-moi qui tu es : touche ton nom ou écris-le.' },
  'Ai voti': { en: 'Voting', es: 'En votación', de: 'Abstimmung läuft', ja: '投票中' ,
    fr: 'On vote' },
  // Frasi INTERE con segnaposto, non frammenti da incollare accanto a un nome:
  // in giapponese il verbo va in fondo e in tedesco pure, quindi comporre
  // "Anna" + "chiede al gruppo" produrrebbe frasi sgrammaticate.
  '{nome} chiede al gruppo': {
    en: '{nome} is asking the group', es: '{nome} pregunta al grupo',
    de: '{nome} fragt die Gruppe', ja: '{nome}さんがみんなに聞いています'
  ,
    fr: '{nome} demande au groupe' },
  '{n} ha già votato': {
    en: '{n} person has already voted', es: '{n} persona ya ha votado',
    de: '{n} Person hat schon abgestimmt', ja: '{n}人が投票済み'
  ,
    fr: '{n} a déjà voté' },
  '{n} hanno già votato': {
    en: '{n} people have already voted', es: '{n} personas ya han votado',
    de: '{n} Personen haben schon abgestimmt', ja: '{n}人が投票済み'
  ,
    fr: '{n} ont déjà voté' },
  'Vota entro': { en: 'Vote by', es: 'Vota antes del', de: 'Stimm ab bis', ja: '投票締切' ,
    fr: 'Vote avant' },

  /* ------------------------------------------------------ ospite: dopo il voto */
  'Voto inviato': { en: 'Vote sent', es: 'Voto enviado', de: 'Stimme gesendet', ja: '投票しました' ,
    fr: 'Vote envoyé' },
  'Grazie!': { en: 'Thanks!', es: '¡Gracias!', de: 'Danke!', ja: 'ありがとうございます！' ,
    fr: 'Merci !' },
  'Ti avvisiamo quando è deciso': {
    en: 'We’ll let you know once it’s decided',
    es: 'Te avisamos cuando esté decidido',
    de: 'Wir sagen dir Bescheid, sobald es feststeht',
    ja: '決まったらお知らせします'
  ,
    fr: 'On te prévient quand c’est décidé' },
  'La tua email': { en: 'Your email', es: 'Tu correo', de: 'Deine E-Mail', ja: 'メールアドレス' ,
    fr: 'Ton e-mail' },
  'Salva': { en: 'Save', es: 'Guardar', de: 'Speichern', ja: '保存' ,
    fr: 'Enregistrer' },

  /* ------------------------------------------------------------- confermato */
  'Confermato': { en: 'Confirmed', es: 'Confirmado', de: 'Bestätigt', ja: '確定' ,
    fr: 'Confirmé' },
  'Ci sono': { en: 'I’m in', es: 'Voy', de: 'Ich komme', ja: '行きます' ,
    fr: 'J’en suis' },
  'Forse': { en: 'Maybe', es: 'Quizá', de: 'Vielleicht', ja: 'たぶん' ,
    fr: 'Peut-être' },
  'Non vengo': { en: 'Can’t make it', es: 'No voy', de: 'Ich kann nicht', ja: '行けません' ,
    fr: 'Je ne viens pas' },
  'Aggiungi al calendario': {
    en: 'Add to calendar', es: 'Añadir al calendario',
    de: 'Zum Kalender hinzufügen', ja: 'カレンダーに追加'
  ,
    fr: 'Ajouter au calendrier' },

  /* ------------------------------------------------------- link non valido */
  'Serve il link d’invito': {
    en: 'You need the invite link', es: 'Necesitas el enlace de invitación',
    de: 'Du brauchst den Einladungslink', ja: '招待リンクが必要です'
  ,
    fr: 'Il faut le lien d’invitation' },
  'Questo link non porta a niente': {
    en: 'This link doesn’t lead anywhere', es: 'Este enlace no lleva a ninguna parte',
    de: 'Dieser Link führt nirgendwohin', ja: 'このリンクは無効です'
  ,
    fr: 'Ce lien ne mène à rien' },
  'Chiedi a chi organizza di rimandartelo.': {
    en: 'Ask the organiser to send it again.',
    es: 'Pídele a quien organiza que te lo reenvíe.',
    de: 'Bitte die organisierende Person, ihn nochmal zu schicken.',
    ja: '幹事の方にもう一度送ってもらってください。'
  ,
    fr: 'Demande à l’organisateur de te le renvoyer.' },

  /* ---------------------------------------------------------------- errori */
  'Manca la libreria di Supabase, che arriva da cdn.jsdelivr.net. Quasi sempre è la rete: un blocco pubblicità, un Wi-Fi che chiede il login, o la CDN giù. Riprova, o passa a un’altra rete.': {
    en: 'The Supabase library, which comes from cdn.jsdelivr.net, is missing. It’s nearly always the network: an ad blocker, a Wi-Fi asking you to sign in, or the CDN being down. Try again, or switch network.',
    es: 'Falta la librería de Supabase, que viene de cdn.jsdelivr.net. Casi siempre es la red: un bloqueador de anuncios, un wifi que pide iniciar sesión, o la CDN caída. Inténtalo otra vez o cambia de red.',
    de: 'Die Supabase-Bibliothek von cdn.jsdelivr.net fehlt. Fast immer liegt es am Netz: ein Werbeblocker, ein WLAN, das eine Anmeldung verlangt, oder die CDN ist gerade weg. Versuch es nochmal oder wechsle das Netz.',
    ja: 'cdn.jsdelivr.net から読み込む Supabase のライブラリがありません。たいていはネットワークが原因です（広告ブロッカー、ログインを求める Wi-Fi、CDN の障害など）。もう一度試すか、別のネットワークでお試しください。'
  ,
    fr: 'Il manque la bibliothèque Supabase, qui vient de cdn.jsdelivr.net. C’est presque toujours le réseau : un bloqueur de pub, un Wi-Fi qui demande une connexion, ou le CDN en panne. Réessaie, ou change de réseau.' },
  'Kimari non si è caricato': {
    en: 'Kimari didn’t load', es: 'Kimari no se ha cargado',
    de: 'Kimari wurde nicht geladen', ja: 'Kimari を読み込めませんでした'
  ,
    fr: 'Kimari ne s’est pas chargé' },
  'Quel nome è già collegato a qualcun altro: scrivi il tuo.': {
    en: 'That name already belongs to someone else — use your own.',
    es: 'Ese nombre ya es de otra persona: escribe el tuyo.',
    de: 'Dieser Name gehört schon jemand anderem — nimm deinen eigenen.',
    ja: 'その名前はすでに他の人のものです。ご自分の名前を入力してください。'
  ,
    fr: 'Ce nom est déjà pris par quelqu’un d’autre : écris le tien.' },
  'Non sono riuscito a registrare il voto.': {
    en: 'I couldn’t record your vote.', es: 'No he podido registrar tu voto.',
    de: 'Ich konnte deine Stimme nicht speichern.', ja: '投票を記録できませんでした。'
  ,
    fr: 'Je n’ai pas réussi à enregistrer le vote.' },

  /* ------------------------------------------------------------ benvenuto */
  'Tutti hanno un’opinione.': {
    en: 'Everyone has an opinion.', es: 'Todo el mundo tiene una opinión.',
    de: 'Jeder hat eine Meinung.', ja: 'みんな意見があります。'
  ,
    fr: 'Tout le monde a un avis.' },
  'Kimari la trasforma in un piano.': {
    en: 'Kimari turns it into a plan.', es: 'Kimari la convierte en un plan.',
    de: 'Kimari macht daraus einen Plan.', ja: 'Kimari がそれを予定に変えます。'
  ,
    fr: 'Kimari en fait un plan.' },
  'Crea un piano': { en: 'Create a plan', es: 'Crear un plan',
                     de: 'Plan erstellen', ja: '予定をつくる' ,
    fr: 'Créer un plan' },
  'Continua con Google': { en: 'Continue with Google', es: 'Continuar con Google',
                           de: 'Weiter mit Google', ja: 'Google で続ける' ,
    fr: 'Continuer avec Google' },
  'Fatto con': { en: 'Made with', es: 'Hecho con', de: 'Gemacht mit', ja: '作成' ,
    fr: 'Fait avec' },

  /* ------------------------------------------------- sito: dopo aver votato */
  'Quando {nome} conferma, questa pagina mostrerà data e posto: salvala.': {
    en: 'When {nome} confirms, this page will show the date and place — save it.',
    es: 'Cuando {nome} lo confirme, esta página mostrará la fecha y el lugar: guárdala.',
    de: 'Sobald {nome} bestätigt, zeigt diese Seite Datum und Ort — speichere sie.',
    ja: '{nome}さんが決めたら、このページに日時と場所が出ます。保存しておいてください。'
  ,
    fr: 'Quand {nome} confirmera, cette page affichera la date et le lieu : garde-la.' },
  'Vedi il piano': { en: 'See the plan', es: 'Ver el plan', de: 'Zum Plan', ja: '予定を見る' ,
    fr: 'Voir le plan' },
  'Vota anche tu': { en: 'Add your vote', es: 'Vota tú también', de: 'Stimm auch ab', ja: 'あなたも投票する' ,
    fr: 'Vote toi aussi' },
  'Avvisami quando è deciso': {
    en: 'Tell me when it’s decided', es: 'Avísame cuando se decida',
    de: 'Sag mir Bescheid, wenn es steht', ja: '決まったら知らせてください'
  ,
    fr: 'Préviens-moi quand c’est décidé' },
  'La tua email (facoltativa)': {
    en: 'Your email (optional)', es: 'Tu correo (opcional)',
    de: 'Deine E-Mail (optional)', ja: 'メールアドレス（任意）'
  ,
    fr: 'Ton e-mail (facultatif)' },
  'Una sola email alla conferma, nessuna newsletter.': {
    en: 'One email when it’s confirmed. No newsletter.',
    es: 'Un solo correo al confirmarse. Nada de newsletters.',
    de: 'Eine E-Mail bei der Bestätigung. Kein Newsletter.',
    ja: '確定時にメールを一通だけ。宣伝は送りません。'
  ,
    fr: 'Un seul e-mail à la confirmation, pas de newsletter.' },

  /* ------------------------------------------------------------ sito: home */
  'I tuoi piani su questo telefono': {
    en: 'Your plans on this phone', es: 'Tus planes en este teléfono',
    de: 'Deine Pläne auf diesem Handy', ja: 'この端末にある予定'
  ,
    fr: 'Tes plans sur ce téléphone' },
  'Ai voti': { en: 'Voting', es: 'En votación', de: 'Abstimmung läuft', ja: '投票中' ,
    fr: 'On vote' },
  'Confermati': { en: 'Confirmed', es: 'Confirmados', de: 'Bestätigt', ja: '確定済み' ,
    fr: 'Confirmés' },
  'Confermato': { en: 'Confirmed', es: 'Confirmado', de: 'Bestätigt', ja: '確定' ,
    fr: 'Confirmé' },
  'Proponi date e posti, il gruppo vota dal link su WhatsApp senza installare niente, tu confermi. Kimari! ✅': {
    en: 'Suggest dates and places, the group votes from a WhatsApp link with nothing to install, you confirm. Kimari! ✅',
    es: 'Propones fechas y sitios, el grupo vota desde un enlace de WhatsApp sin instalar nada, tú confirmas. ¡Kimari! ✅',
    de: 'Du schlägst Termine und Orte vor, die Gruppe stimmt über einen WhatsApp-Link ab — ohne Installation — und du bestätigst. Kimari! ✅',
    ja: '日時と場所を出す、みんながWhatsAppのリンクから投票する（インストール不要）、あなたが決める。決まり！ ✅'
  ,
    fr: 'Propose des dates et des lieux, le groupe vote depuis le lien sur WhatsApp sans rien installer, tu confirmes. Kimari ! ✅' },
  'Con Google ritrovi i tuoi piani da qualsiasi telefono.': {
    en: 'With Google you find your plans again from any phone.',
    es: 'Con Google recuperas tus planes desde cualquier teléfono.',
    de: 'Mit Google findest du deine Pläne auf jedem Handy wieder.',
    ja: 'Google を使うと、どの端末からでも自分の予定を開けます。'
  ,
    fr: 'Avec Google, tu retrouves tes plans depuis n’importe quel téléphone.' },

  /* -------------------------------------------------- sito: creare un piano */
  'Nuovo piano': { en: 'New plan', es: 'Nuevo plan', de: 'Neuer Plan', ja: '新しい予定' ,
    fr: 'Nouveau plan' },
  'Il piano': { en: 'The plan', es: 'El plan', de: 'Der Plan', ja: '予定' ,
    fr: 'Le plan' },
  'Il gruppo vota dal link, tu confermi.': {
    en: 'The group votes from the link, you confirm.',
    es: 'El grupo vota desde el enlace, tú confirmas.',
    de: 'Die Gruppe stimmt über den Link ab, du bestätigst.',
    ja: 'みんながリンクから投票し、あなたが決めます。'
  ,
    fr: 'Le groupe vote depuis le lien, tu confirmes.' },
  'Il tuo nome (organizzatore)': {
    en: 'Your name (organiser)', es: 'Tu nombre (organizador)',
    de: 'Dein Name (Organisator)', ja: 'お名前（幹事）'
  ,
    fr: 'Ton nom (organisateur)' },
  'Già deciso': { en: 'Already set', es: 'Ya decidido', de: 'Steht schon fest', ja: '決まっている' ,
    fr: 'Déjà décidé' },
  'Nome del posto': { en: 'Name of the place', es: 'Nombre del sitio',
                      de: 'Name des Orts', ja: '場所の名前' ,
    fr: 'Nom du lieu' },
  'Indirizzo (facoltativo)': { en: 'Address (optional)', es: 'Dirección (opcional)',
                               de: 'Adresse (optional)', ja: '住所（任意）' ,
    fr: 'Adresse (facultative)' },
  'Posto {n}': { en: 'Place {n}', es: 'Sitio {n}', de: 'Ort {n}', ja: '場所 {n}' ,
    fr: 'Lieu {n}' },
  'Posto: si decide': { en: 'Place: to be decided', es: 'Sitio: por decidir',
                        de: 'Ort: wird noch entschieden', ja: '場所：これから決めます' ,
    fr: 'Lieu : à décider' },
  'Nuovo posto': { en: 'New place', es: 'Nuevo sitio', de: 'Neuer Ort', ja: '新しい場所' ,
    fr: 'Nouveau lieu' },
  'Facoltativo, è solo un promemoria per il gruppo: la conferma resta tua.': {
    en: 'Optional — just a nudge for the group. Confirming is still up to you.',
    es: 'Opcional: solo un recordatorio para el grupo. Confirmar sigue siendo cosa tuya.',
    de: 'Optional — nur eine Erinnerung für die Gruppe. Bestätigen tust du.',
    ja: '任意です。みんなへの目安で、決めるのはあなたです。'
  ,
    fr: 'Facultatif, c’est juste un rappel pour le groupe : la confirmation reste la tienne.' },
  'Fatto ✓ — il link del piano': {
    en: 'Done ✓ — the link to the plan', es: 'Listo ✓ — el enlace del plan',
    de: 'Fertig ✓ — der Link zum Plan', ja: 'できました ✓ — 予定のリンク'
  ,
    fr: 'C’est fait ✓ — le lien du plan' },
  'Manda su WhatsApp': { en: 'Send on WhatsApp', es: 'Enviar por WhatsApp',
                         de: 'Auf WhatsApp senden', ja: 'WhatsApp で送る' ,
    fr: 'Envoyer sur WhatsApp' },
  'Apri il piano': { en: 'Open the plan', es: 'Abrir el plan',
                     de: 'Plan öffnen', ja: '予定を開く' ,
    fr: 'Ouvrir le plan' },

  /* ------------------------------------------- sito: la vista organizzatore */
  'Quando — tocca l’opzione da confermare': {
    en: 'When — tap the option to confirm',
    es: 'Cuándo — toca la opción que quieres confirmar',
    de: 'Wann — tippe die Option an, die gelten soll',
    ja: '日時 — 決めるものを選んでください'
  ,
    fr: 'Quand — touche l’option à confirmer' },
  'Dove — tocca l’opzione da confermare': {
    en: 'Where — tap the option to confirm',
    es: 'Dónde — toca la opción que quieres confirmar',
    de: 'Wo — tippe die Option an, die gelten soll',
    ja: '場所 — 決めるものを選んでください'
  ,
    fr: 'Où — touche l’option à confirmer' },
  'A {chi} non va bene nessuna data.': {
    en: 'None of the dates work for {chi}.',
    es: 'A {chi} no le viene bien ninguna fecha.',
    de: 'Für {chi} passt kein Termin.',
    ja: '{chi}さんはどの日も都合が合いません。'
  ,
    fr: 'Aucune date ne va à {chi}.' },
  'A {chi} non va bene nessun posto.': {
    en: 'None of the places work for {chi}.',
    es: 'A {chi} no le viene bien ningún sitio.',
    de: 'Für {chi} passt kein Ort.',
    ja: '{chi}さんはどの場所も都合が合いません。'
  ,
    fr: 'Aucun lieu ne va à {chi}.' },
  'nessuno ancora': { en: 'nobody yet', es: 'nadie todavía',
                      de: 'noch niemand', ja: 'まだいません' ,
    fr: 'personne pour l’instant' },
  'Non hanno ancora votato': {
    en: 'Haven’t voted yet', es: 'Aún no han votado',
    de: 'Haben noch nicht abgestimmt', ja: 'まだ投票していない人'
  ,
    fr: 'N’ont pas encore voté' },
  'Note del gruppo': { en: 'Notes from the group', es: 'Notas del grupo',
                       de: 'Notizen der Gruppe', ja: 'みんなからのひとこと' ,
    fr: 'Notes du groupe' },
  'Conferma il piano': { en: 'Confirm the plan', es: 'Confirmar el plan',
                         de: 'Plan bestätigen', ja: 'この予定で決める' ,
    fr: 'Confirmer le plan' },
  'Rimanda il link al gruppo': {
    en: 'Send the link again', es: 'Reenviar el enlace al grupo',
    de: 'Link nochmal schicken', ja: 'リンクをもう一度送る'
  ,
    fr: 'Renvoyer le lien au groupe' },
  'Conferma quando ti basta: il link resta lo stesso e diventa la pagina dell’evento.': {
    en: 'Confirm whenever you have enough: the link stays the same and becomes the event page.',
    es: 'Confirma cuando te baste: el enlace no cambia y se convierte en la página del evento.',
    de: 'Bestätige, sobald es dir reicht: Der Link bleibt gleich und wird zur Seite des Treffens.',
    ja: '十分だと思ったら決めてください。リンクはそのまま、予定のページになります。'
  ,
    fr: 'Confirme quand ça te suffit : le lien reste le même et devient la page de l’événement.' },

  /* ----------------------------------------------- sito: dopo la conferma */
  'Ci sono · {n}': { en: 'Coming · {n}', es: 'Van · {n}',
                     de: 'Dabei · {n}', ja: '参加 · {n}' ,
    fr: 'Présents · {n}' },
  'Non vengono · {n}': { en: 'Not coming · {n}', es: 'No van · {n}',
                         de: 'Nicht dabei · {n}', ja: '不参加 · {n}' ,
    fr: 'Ne viennent pas · {n}' },
  'Non hanno risposto · {n}': { en: 'No answer · {n}', es: 'Sin responder · {n}',
                                de: 'Keine Antwort · {n}', ja: '未回答 · {n}' ,
    fr: 'Sans réponse · {n}' },
  'Sposta la data': { en: 'Move the date', es: 'Cambiar la fecha',
                      de: 'Termin verschieben', ja: '日時を変える' ,
    fr: 'Déplacer la date' },
  'Cambia posto': { en: 'Change the place', es: 'Cambiar de sitio',
                    de: 'Ort ändern', ja: '場所を変える' ,
    fr: 'Changer de lieu' },
  'Ogni modifica alza la versione (v{a} → v{b}) e resta nella storia: chi ha il link vede sempre l’ultima.': {
    en: 'Every change bumps the version (v{a} → v{b}) and stays in the history: whoever has the link always sees the latest.',
    es: 'Cada cambio sube la versión (v{a} → v{b}) y queda en el historial: quien tenga el enlace ve siempre la última.',
    de: 'Jede Änderung erhöht die Version (v{a} → v{b}) und bleibt in der Historie: Wer den Link hat, sieht immer die neueste.',
    ja: '変更するたびに版が上がり（v{a} → v{b}）、履歴に残ります。リンクを持っている人にはいつも最新が見えます。'
  ,
    fr: 'Chaque modification augmente la version (v{a} → v{b}) et reste dans l’historique : qui a le lien voit toujours la dernière.' },
  'Annulla il piano': { en: 'Cancel the plan', es: 'Anular el plan',
                        de: 'Plan absagen', ja: '予定をとりやめる' ,
    fr: 'Annuler le plan' },
  'Questo piano è stato annullato.': {
    en: 'This plan was cancelled.', es: 'Este plan se ha anulado.',
    de: 'Dieser Plan wurde abgesagt.', ja: 'この予定はとりやめになりました。'
  ,
    fr: 'Ce plan a été annulé.' },
  'Questo piano è stato annullato da {chi}.': {
    en: 'This plan was cancelled by {chi}.', es: '{chi} ha anulado este plan.',
    de: 'Dieser Plan wurde von {chi} abgesagt.', ja: 'この予定は{chi}さんがとりやめました。'
  ,
    fr: 'Ce plan a été annulé par {chi}.' },

  /* ------------------------------------------------------- sito: non trovato */
  'Link non valido': { en: 'Link not valid', es: 'Enlace no válido',
                       de: 'Link ungültig', ja: 'リンクが無効です' ,
    fr: 'Lien non valide' },
  'Questo piano si apre dal suo link (quello che gira su WhatsApp): da questo telefono non risulti dentro.': {
    en: 'This plan opens from its own link — the one going round on WhatsApp. From this phone you’re not in it.',
    es: 'Este plan se abre desde su enlace, el que circula por WhatsApp. Desde este teléfono no constas dentro.',
    de: 'Dieser Plan öffnet sich über seinen Link — den, der auf WhatsApp herumgeht. Von diesem Handy aus bist du nicht dabei.',
    ja: 'この予定は、WhatsApp で回っているリンクから開きます。この端末では参加者として登録されていません。'
  ,
    fr: 'Ce plan s’ouvre depuis son lien (celui qui circule sur WhatsApp) : sur ce téléphone, tu n’en fais pas partie.' },

  /* ============================================================== l'app */
  /* Da qui in giù sono le stringhe dell'app. Il sito è la pagina che si
     apre da un link; l'app è quella che si installa, ed è molto più larga.
     Il tono resta lo stesso: si dà del tu, si spiega cosa succede davvero,
     non si promette niente che il prodotto non faccia. */

  /* ------------------------------------------------------ chi può votare */
  'Chi può votare': { en: 'Who can vote', es: 'Quién puede votar',
                      de: 'Wer abstimmen darf', ja: '投票できる人' ,
    fr: 'Qui peut voter' },
  'Con un link aperto la stessa persona può votare più volte da finestre diverse. Se conta, stringi.': {
    en: 'With an open link the same person can vote more than once from different windows. If it matters, tighten it.',
    es: 'Con un enlace abierto la misma persona puede votar varias veces desde ventanas distintas. Si importa, restríngelo.',
    de: 'Bei einem offenen Link kann dieselbe Person aus verschiedenen Fenstern mehrmals abstimmen. Wenn es darauf ankommt, schränke ihn ein.',
    ja: 'リンクを誰でも開ける状態だと、同じ人が別のウィンドウから何度も投票できます。気になる場合は制限してください。'
  ,
    fr: 'Avec un lien ouvert, la même personne peut voter plusieurs fois depuis des fenêtres différentes. Si ça compte, restreins.' },
  'Chi apre il link vedrà questi nomi e sceglierà il suo.': {
    en: 'Whoever opens the link will see these names and pick their own.',
    es: 'Quien abra el enlace verá estos nombres y elegirá el suyo.',
    de: 'Wer den Link öffnet, sieht diese Namen und wählt seinen eigenen.',
    ja: 'リンクを開いた人にはこの名前が並び、自分のものを選びます。'
  ,
    fr: 'Qui ouvre le lien verra ces noms et choisira le sien.' },
  'Chi è già entrato resta': { en: 'Those already in stay in', es: 'Quien ya entró se queda',
                               de: 'Wer schon drin ist, bleibt', ja: 'すでに参加した人はそのまま' ,
    fr: 'Qui est déjà entré reste' },
  'Chi l\'ha già usato resta dentro': {
    en: 'Anyone who already used it stays in', es: 'Quien ya lo usó se queda dentro',
    de: 'Wer ihn schon benutzt hat, bleibt dabei', ja: 'すでに使った人はそのまま参加しています' ,
    fr: 'Qui l’a déjà utilisé reste dedans' },
  'Salva il limite': { en: 'Save the limit', es: 'Guardar el límite',
                       de: 'Grenze speichern', ja: '上限を保存' ,
    fr: 'Enregistrer la limite' },
  'Revocare non rompe niente per chi ha già votato: serve quando il link finisce dove non doveva.': {
    en: 'Revoking breaks nothing for those who already voted — it’s for when the link ends up where it shouldn’t.',
    es: 'Revocar no rompe nada para quien ya votó: sirve cuando el enlace acaba donde no debía.',
    de: 'Ein Widerruf ändert nichts für alle, die schon abgestimmt haben — er ist für den Fall, dass der Link irgendwo landet, wo er nicht hingehört.',
    ja: '取り消しても、すでに投票した人には何も起きません。リンクが本来届くべきでない場所に渡ったときのためのものです。'
  ,
    fr: 'Révoquer ne casse rien pour qui a déjà voté : ça sert quand le lien atterrit où il ne fallait pas.' },

  /* ------------------------------------------------------------- gruppi */
  'Esci dal gruppo': { en: 'Leave the group', es: 'Salir del grupo',
                       de: 'Gruppe verlassen', ja: 'グループを抜ける' ,
    fr: 'Quitter le groupe' },
  'Elimina gruppo': { en: 'Delete group', es: 'Eliminar grupo',
                      de: 'Gruppe löschen', ja: 'グループを削除' ,
    fr: 'Supprimer le groupe' },
  'Silenzia questo gruppo': { en: 'Mute this group', es: 'Silenciar este grupo',
                              de: 'Gruppe stummschalten', ja: 'このグループを通知オフ' ,
    fr: 'Mettre ce groupe en sourdine' },
  'Chi entra dopo viene aggiunto solo ai piani ancora ai voti. Chi esce sparisce dai piani futuri e resta in quelli passati.': {
    en: 'Whoever joins later is added only to plans still being voted on. Whoever leaves disappears from future plans and stays in past ones.',
    es: 'Quien entra después se añade solo a los planes que aún se están votando. Quien sale desaparece de los planes futuros y permanece en los pasados.',
    de: 'Wer später dazukommt, wird nur zu Plänen hinzugefügt, über die noch abgestimmt wird. Wer geht, verschwindet aus künftigen Plänen und bleibt in den vergangenen.',
    ja: 'あとから参加した人は、まだ投票中の予定にだけ追加されます。抜けた人は今後の予定から消え、過去の予定には残ります。'
  ,
    fr: 'Qui entre après n’est ajouté qu’aux plans encore aux votes. Qui sort disparaît des plans futurs et reste dans les passés.' },
  '🔒 Gruppo privato: si entra solo con il link d\'invito.': {
    en: '🔒 Private group — you get in only with the invite link.',
    es: '🔒 Grupo privado: solo se entra con el enlace de invitación.',
    de: '🔒 Private Gruppe — Zutritt nur über den Einladungslink.',
    ja: '🔒 非公開グループ：招待リンクからのみ参加できます。'
  ,
    fr: '🔒 Groupe privé : on n’entre qu’avec le lien d’invitation.' },
  'Fai lo stesso per il tuo gruppo': {
    en: 'Do the same for your group', es: 'Haz lo mismo con tu grupo',
    de: 'Mach das Gleiche für deine Gruppe', ja: '自分のグループでも同じように' ,
    fr: 'Fais pareil pour ton groupe' },
  'Tocca per entrare. Ti chiederemo solo il nome.': {
    en: 'Tap to join. We’ll only ask for your name.',
    es: 'Toca para entrar. Solo te pediremos el nombre.',
    de: 'Tippen zum Beitreten. Wir fragen nur nach deinem Namen.',
    ja: 'タップして参加。お名前だけうかがいます。'
  ,
    fr: 'Touche pour entrer. On ne te demandera que ton nom.' },

  /* -------------------------------------------------------- amici e conto */
  'Gli amici servono per invitare in fretta quando crei un gruppo. Non vedono i tuoi piani: la visibilità resta per gruppo.': {
    en: 'Friends are there so you can invite people quickly when you create a group. They don’t see your plans — visibility stays per group.',
    es: 'Los amigos sirven para invitar rápido cuando creas un grupo. No ven tus planes: la visibilidad sigue siendo por grupo.',
    de: 'Freunde sind dazu da, dass du beim Erstellen einer Gruppe schnell einladen kannst. Sie sehen deine Pläne nicht — Sichtbarkeit bleibt pro Gruppe.',
    ja: '友だちは、グループを作るときにすぐ招待するためのものです。あなたの予定は見えません。公開範囲はグループごとのままです。'
  ,
    fr: 'Les amis servent à inviter vite quand tu crées un groupe. Ils ne voient pas tes plans : la visibilité reste par groupe.' },
  'Persone con cui hai già un gruppo o un piano. Gli amici non vedono i tuoi piani: servono solo per invitare in fretta.': {
    en: 'People you already share a group or a plan with. Friends don’t see your plans — they’re just there for quick invites.',
    es: 'Personas con las que ya compartes un grupo o un plan. Los amigos no ven tus planes: solo sirven para invitar rápido.',
    de: 'Leute, mit denen du schon eine Gruppe oder einen Plan teilst. Freunde sehen deine Pläne nicht — sie sind nur für schnelle Einladungen da.',
    ja: 'すでにグループや予定を共有している人たちです。友だちにあなたの予定は見えません。すぐ招待するためだけのものです。'
  ,
    fr: 'Des personnes avec qui tu as déjà un groupe ou un plan. Les amis ne voient pas tes plans : ils servent juste à inviter vite.' },
  'Il nome è quello che vedono gli altri nei piani.': {
    en: 'This is the name other people see in plans.',
    es: 'Este es el nombre que los demás ven en los planes.',
    de: 'Diesen Namen sehen die anderen in den Plänen.',
    ja: '予定のなかで、ほかの人に表示される名前です。'
  ,
    fr: 'Le nom, c’est ce que les autres voient dans les plans.' },
  'Email': { en: 'Email', es: 'Correo', de: 'E-Mail', ja: 'メール' ,
    fr: 'E-mail' },
  'Collega i piani dal web': { en: 'Bring in your plans from the web',
    es: 'Vincula tus planes de la web', de: 'Pläne aus dem Web verbinden',
    ja: 'ウェブでの予定をつなげる' ,
    fr: 'Relier les plans du web' },
  'L\'email che hai usato sul web': {
    en: 'The email you used on the web', es: 'El correo que usaste en la web',
    de: 'Die E-Mail, die du im Web benutzt hast', ja: 'ウェブで使ったメールアドレス' ,
    fr: 'L’e-mail que tu as utilisé sur le web' },
  'Se hai votato da un link senza app e hai lasciato l\'email, scrivila qui: i tuoi voti e risposte passano a questo account.': {
    en: 'If you voted from a link without the app and left your email, type it here: your votes and answers move over to this account.',
    es: 'Si votaste desde un enlace sin la app y dejaste tu correo, escríbelo aquí: tus votos y respuestas pasan a esta cuenta.',
    de: 'Wenn du über einen Link ohne App abgestimmt und deine E-Mail hinterlassen hast, trag sie hier ein: Deine Stimmen und Antworten wandern zu diesem Konto.',
    ja: 'アプリなしでリンクから投票し、メールアドレスを残していた場合はここに入力してください。投票と回答がこのアカウントに移ります。'
  ,
    fr: 'Si tu as voté depuis un lien sans l’app et laissé ton e-mail, écris-le ici : tes votes et réponses passent sur ce compte.' },
  'Nell\'app vera arriva un codice a quell\'email, per sicurezza.': {
    en: 'In the real app a code goes to that address, for safety.',
    es: 'En la app real llega un código a ese correo, por seguridad.',
    de: 'In der echten App geht ein Code an diese Adresse — zur Sicherheit.',
    ja: '実際のアプリでは、安全のためそのアドレスに確認コードが届きます。'
  ,
    fr: 'Dans la vraie app, un code arrive à cet e-mail, par sécurité.' },
  'Nessuna newsletter: una sola email quando viene confermato. La stessa email ti permette di ritrovare questo piano se poi installi l\'app.': {
    en: 'No newsletter — one email when it’s confirmed. That same address lets you find this plan again if you install the app later.',
    es: 'Sin newsletter: un solo correo cuando se confirme. Ese mismo correo te permite recuperar este plan si luego instalas la app.',
    de: 'Kein Newsletter — eine E-Mail, wenn es bestätigt ist. Mit derselben Adresse findest du diesen Plan wieder, falls du die App später installierst.',
    ja: 'ニュースレターはありません。確定したときに一通だけ届きます。同じアドレスで、あとからアプリを入れてもこの予定を見つけられます。'
  ,
    fr: 'Pas de newsletter : un seul e-mail à la confirmation. Le même e-mail te permet de retrouver ce plan si tu installes l’app ensuite.' },
  'Ogni voce è tua. Un gruppo si silenzia dalla sua pagina (Gestisci / Info). Quello che non arriva come push resta comunque in Novità.': {
    en: 'Every setting here is yours. A group is muted from its own page (Manage / Info). Whatever doesn’t arrive as a push is still waiting in News.',
    es: 'Cada ajuste es tuyo. Un grupo se silencia desde su propia página (Gestionar / Info). Lo que no llegue como notificación sigue estando en Novedades.',
    de: 'Jede Einstellung hier gehört dir. Eine Gruppe wird auf ihrer eigenen Seite stummgeschaltet (Verwalten / Info). Was nicht als Push ankommt, wartet trotzdem unter Neues.',
    ja: 'ここの設定はすべてあなたのものです。グループはそのページ（管理／情報）から通知オフにできます。プッシュで届かなかったものも「新着」には残ります。'
  ,
    fr: 'Chaque réglage est à toi. Un groupe se met en sourdine depuis sa page (Gérer / Infos). Ce qui n’arrive pas en push reste quand même dans Quoi de neuf.' },
  'Ancora niente: quando qualcuno vota, conferma o risponde a un piano, compare qui.': {
    en: 'Nothing yet. When someone votes, confirms or replies to a plan, it shows up here.',
    es: 'Todavía nada. Cuando alguien vote, confirme o responda a un plan, aparecerá aquí.',
    de: 'Noch nichts. Sobald jemand abstimmt, bestätigt oder auf einen Plan antwortet, erscheint es hier.',
    ja: 'まだ何もありません。だれかが投票・確定・返信すると、ここに表示されます。'
  ,
    fr: 'Rien pour l’instant : quand quelqu’un vote, confirme ou répond à un plan, ça s’affiche ici.' },
  '🔔 = con le tue impostazioni sarebbe arrivata una notifica.': {
    en: '🔔 = with your settings, this would have come as a notification.',
    es: '🔔 = con tus ajustes, esto habría llegado como notificación.',
    de: '🔔 = mit deinen Einstellungen wäre das als Benachrichtigung gekommen.',
    ja: '🔔 ＝ 現在の設定なら、これは通知として届いていたものです。'
  ,
    fr: '🔔 = avec tes réglages, une notification serait arrivée.' },

  /* ---------------------------------------------------- piani e proposte */
  'Aggiungi al piano': { en: 'Add to the plan', es: 'Añadir al plan',
                         de: 'Zum Plan hinzufügen', ja: '予定に追加' ,
    fr: 'Ajouter au plan' },
  'Aggiungi una domanda': { en: 'Add a question', es: 'Añadir una pregunta',
                            de: 'Frage hinzufügen', ja: '質問を追加' ,
    fr: 'Ajouter une question' },
  'Proponi al gruppo': { en: 'Suggest it to the group', es: 'Propónselo al grupo',
                         de: 'Der Gruppe vorschlagen', ja: 'みんなに提案' ,
    fr: 'Proposer au groupe' },
  'Proponi un\'altra data': { en: 'Suggest another date', es: 'Proponer otra fecha',
                              de: 'Anderes Datum vorschlagen', ja: '別の日を提案' ,
    fr: 'Proposer une autre date' },
  'Ripeti questo piano': { en: 'Do this again', es: 'Repetir este plan',
                           de: 'Diesen Plan wiederholen', ja: 'この予定をもう一度' ,
    fr: 'Répéter ce plan' },
  'Avvisa il gruppo': { en: 'Tell the group', es: 'Avisar al grupo',
                        de: 'Der Gruppe Bescheid geben', ja: 'みんなに知らせる' ,
    fr: 'Prévenir le groupe' },
  'Tutto il giorno': { en: 'All day', es: 'Todo el día', de: 'Ganztägig', ja: '終日' ,
    fr: 'Toute la journée' },
  'Non so': { en: 'Not sure', es: 'No sé', de: 'Weiß nicht', ja: 'わからない' ,
    fr: 'Je ne sais pas' },
  'Si vota insieme a quando e dove.': {
    en: 'It’s voted on together with when and where.',
    es: 'Se vota junto con el cuándo y el dónde.',
    de: 'Wird zusammen mit Wann und Wo abgestimmt.',
    ja: '日時・場所といっしょに投票します。'
  ,
    fr: 'Ça se vote avec le quand et le où.' },
  'Due bottoni, 👍 Sì e 👎 No. Il voto vale subito, vince la maggioranza di chi risponde.': {
    en: 'Two buttons, 👍 Yes and 👎 No. The vote counts straight away; whoever answers, the majority wins.',
    es: 'Dos botones, 👍 Sí y 👎 No. El voto cuenta al momento y gana la mayoría de quienes respondan.',
    de: 'Zwei Knöpfe, 👍 Ja und 👎 Nein. Die Stimme zählt sofort; es gewinnt die Mehrheit derer, die antworten.',
    ja: 'ボタンは 👍 はい と 👎 いいえ の二つ。投票はすぐ反映され、答えた人の多数決で決まります。'
  ,
    fr: 'Deux boutons, 👍 Oui et 👎 Non. Le vote compte tout de suite, la majorité des répondants l’emporte.' },
  'Ogni data ha il suo "ci sono". Modifiche e proposte valgono per una data sola.': {
    en: 'Each date has its own “I’m in”. Changes and suggestions apply to one date only.',
    es: 'Cada fecha tiene su propio «voy». Los cambios y las propuestas valen para una sola fecha.',
    de: 'Jedes Datum hat sein eigenes „Ich bin dabei“. Änderungen und Vorschläge gelten für ein einzelnes Datum.',
    ja: '日付ごとに「参加する」があります。変更や提案は、その日付だけに効きます。'
  ,
    fr: 'Chaque date a son « j’en suis ». Modifications et propositions valent pour une seule date.' },
  'Crea un piano in 30 secondi, direttamente da qui.': {
    en: 'Make a plan in 30 seconds, right from here.',
    es: 'Crea un plan en 30 segundos, directamente desde aquí.',
    de: 'Mach in 30 Sekunden einen Plan, direkt von hier.',
    ja: 'ここから 30 秒で予定を作れます。'
  ,
    fr: 'Crée un plan en 30 secondes, directement d’ici.' },
  'Tocca "Ci sono" per rispondere: ti chiederemo solo il nome.': {
    en: 'Tap “I’m in” to answer — we’ll only ask for your name.',
    es: 'Toca «Voy» para responder: solo te pediremos el nombre.',
    de: 'Tippe auf „Ich bin dabei“ — wir fragen nur nach deinem Namen.',
    ja: '「参加する」を押して返事してください。お名前だけうかがいます。'
  ,
    fr: 'Touche « J’en suis » pour répondre : on ne te demandera que ton nom.' },
  'Tutti lo vedono nel piano, senza cercare il messaggio in chat.': {
    en: 'Everyone sees it in the plan, without digging for the message in the chat.',
    es: 'Todos lo ven en el plan, sin buscar el mensaje en el chat.',
    de: 'Alle sehen es im Plan, ohne die Nachricht im Chat zu suchen.',
    ja: 'チャットからメッセージを探さなくても、みんなが予定の中で見られます。'
  ,
    fr: 'Tout le monde le voit dans le plan, sans chercher le message dans la discussion.' },

  /* -------------------------------------------------- se il piano salta */
  'Se salta, dirlo qui è meglio che sparire: chi ha il link lo vede, e messaggi e spese restano.': {
    en: 'If it falls through, saying so here beats vanishing: whoever has the link sees it, and messages and expenses stay put.',
    es: 'Si se cae, decirlo aquí es mejor que desaparecer: quien tenga el enlace lo ve, y los mensajes y los gastos siguen ahí.',
    de: 'Wenn es platzt, ist es besser, das hier zu sagen, als zu verschwinden: Wer den Link hat, sieht es, und Nachrichten und Ausgaben bleiben.',
    ja: '中止になったら、黙って消えるよりここで伝えるほうが親切です。リンクを持つ人には表示され、メッセージや費用はそのまま残ります。'
  ,
    fr: 'Si ça tombe à l’eau, le dire ici vaut mieux que disparaître : qui a le lien le voit, et messages et dépenses restent.' },
  'Il link resta valido: chi lo apre vede che è saltato. Messaggi e spese restano dove sono.': {
    en: 'The link still works — whoever opens it sees that it’s off. Messages and expenses stay where they are.',
    es: 'El enlace sigue siendo válido: quien lo abra verá que se ha cancelado. Los mensajes y los gastos se quedan donde están.',
    de: 'Der Link bleibt gültig — wer ihn öffnet, sieht, dass es abgesagt ist. Nachrichten und Ausgaben bleiben, wo sie sind.',
    ja: 'リンクはそのまま使えます。開いた人には中止になったことが表示されます。メッセージや費用はそのまま残ります。'
  ,
    fr: 'Le lien reste valide : qui l’ouvre voit que c’est annulé. Messages et dépenses restent où ils sont.' },
  'Il tuo "ci sono" diventa "non vengo" e il gruppo lo vede subito.': {
    en: 'Your “I’m in” becomes “I’m out”, and the group sees it right away.',
    es: 'Tu «voy» pasa a «no voy» y el grupo lo ve enseguida.',
    de: 'Aus deinem „Ich bin dabei“ wird „Ich komme nicht“, und die Gruppe sieht es sofort.',
    ja: '「参加する」が「行けない」に変わり、みんなにすぐ伝わります。'
  ,
    fr: 'Ton « j’en suis » devient « je ne viens pas » et le groupe le voit tout de suite.' },
  'Es. esco tardi dal lavoro': { en: 'E.g. I’m getting out of work late',
    es: 'Ej. salgo tarde del trabajo', de: 'Z.B. ich komme spät aus der Arbeit',
    ja: '例：仕事が遅くなりそう' ,
    fr: 'Ex. je sors tard du travail' },
  'Es. per me va bene tutto ma non troppo tardi': {
    en: 'E.g. anything works for me, just not too late',
    es: 'Ej. me viene bien todo, pero no muy tarde',
    de: 'Z.B. mir passt alles, nur nicht zu spät',
    ja: '例：どれでもいいですが、あまり遅くない時間で' ,
    fr: 'Ex. tout me va mais pas trop tard' },

  /* ------------------------------------------------------- posti e spese */
  'Elimina posto': { en: 'Delete place', es: 'Eliminar sitio',
                     de: 'Ort löschen', ja: '場所を削除' ,
    fr: 'Supprimer le lieu' },
  '★ Posto salvato · apri scheda': { en: '★ Saved place · open card',
    es: '★ Sitio guardado · abrir ficha', de: '★ Gespeicherter Ort · Karte öffnen',
    ja: '★ 保存した場所 · カードを開く' ,
    fr: '★ Lieu enregistré · ouvrir la fiche' },
  '📷 Foto': { en: '📷 Photo', es: '📷 Foto', de: '📷 Foto', ja: '📷 写真' ,
    fr: '📷 Photos' },
  'Il ristorante di sempre, il campo, la casa al mare: nome, indirizzo e allegati tuoi (il menu fotografato). Quando lo usi in un piano, gli altri vedono solo nome e indirizzo.': {
    en: 'The usual restaurant, the pitch, the house by the sea: name, address and your own attachments (the menu you photographed). When you use it in a plan, the others only see name and address.',
    es: 'El restaurante de siempre, la cancha, la casa en la playa: nombre, dirección y tus propios adjuntos (el menú fotografiado). Cuando lo usas en un plan, los demás solo ven el nombre y la dirección.',
    de: 'Das Stammlokal, der Platz, das Haus am Meer: Name, Adresse und deine eigenen Anhänge (die abfotografierte Karte). Wenn du den Ort in einem Plan verwendest, sehen die anderen nur Name und Adresse.',
    ja: 'いつもの店、コート、海辺の家。名前と住所、そしてあなただけの添付（撮っておいたメニューなど）。予定で使うとき、ほかの人に見えるのは名前と住所だけです。'
  ,
    fr: 'Le resto habituel, le terrain, la maison à la mer : nom, adresse et pièces jointes à toi (le menu en photo). Quand tu l’utilises dans un plan, les autres ne voient que le nom et l’adresse.' },
  '★ = copertina: è la foto che vedi in giro per l\'app e nei piani in cui usi il posto.': {
    en: '★ = cover: the photo you’ll see around the app and in the plans where you use this place.',
    es: '★ = portada: es la foto que verás por la app y en los planes donde uses el sitio.',
    de: '★ = Titelbild: das Foto, das dir in der App und in Plänen mit diesem Ort begegnet.',
    ja: '★ ＝ カバー写真。アプリのあちこちや、この場所を使った予定で表示されます。'
  ,
    fr: '★ = couverture : la photo que tu vois partout dans l’app et dans les plans où tu utilises ce lieu.' },
  'La spesa pesa solo su chi scegli: "Marco ha pagato la cena di Silvio" = paga Marco, scegli solo Silvio. Chi paga può anche non esserci.': {
    en: 'The expense falls only on the people you pick: “Marco paid for Silvio’s dinner” = Marco pays, you pick only Silvio. Whoever paid doesn’t have to be among them.',
    es: 'El gasto recae solo sobre quien elijas: «Marco pagó la cena de Silvio» = paga Marco, eliges solo a Silvio. Quien paga puede no estar incluido.',
    de: 'Die Ausgabe trifft nur die, die du auswählst: „Marco hat Silvios Essen bezahlt“ = Marco zahlt, du wählst nur Silvio. Wer zahlt, muss nicht dabei sein.',
    ja: '費用は選んだ人にだけかかります。「マルコがシルヴィオの夕食を払った」＝ 払うのはマルコ、選ぶのはシルヴィオだけ。払った人が対象に入っていなくてもかまいません。'
  ,
    fr: 'La dépense ne pèse que sur qui tu choisis : « Marco a payé le dîner de Silvio » = Marco paie, tu ne choisis que Silvio. Qui paie peut même ne pas être là.' },
  'Membro eliminato': { en: 'Deleted member', es: 'Miembro eliminado',
                        de: 'Gelöschtes Mitglied', ja: '退会したメンバー' ,
    fr: 'Membre supprimé' },

  /* Un posto salvato non è sempre un ristorante: il campo, la casa al mare, il
     parcheggio dietro l'angolo. "Foto del menu" restringeva una cosa che non
     è ristretta — segnalato da Vincenzo. */
  'Il ristorante di sempre, il campo, la casa al mare: nome, indirizzo e allegati tuoi (il menu, il cancello giusto, il codice del portone). Quando lo usi in un piano, gli altri vedono solo nome e indirizzo.': {
    en: 'The usual restaurant, the pitch, the house by the sea: name, address and your own attachments — the menu, the right gate, the door code. When you use it in a plan, the others only see name and address.',
    es: 'El restaurante de siempre, la cancha, la casa en la playa: nombre, dirección y tus propios adjuntos: el menú, la verja correcta, el código del portal. Cuando lo usas en un plan, los demás solo ven el nombre y la dirección.',
    de: 'Das Stammlokal, der Platz, das Haus am Meer: Name, Adresse und deine eigenen Anhänge — die Karte, das richtige Tor, der Türcode. Wenn du den Ort in einem Plan verwendest, sehen die anderen nur Name und Adresse.',
    ja: 'いつもの店、コート、海辺の家。名前と住所、そしてあなただけの添付——メニュー、正しい入口、玄関の暗証番号。予定で使うとき、ほかの人に見えるのは名前と住所だけです。'
  ,
    fr: 'Le resto habituel, le terrain, la maison à la mer : nom, adresse et pièces jointes à toi (le menu, le bon portail, le code de la porte). Quand tu l’utilises dans un plan, les autres ne voient que le nom et l’adresse.' },
  'Kimari segue la lingua del telefono: per cambiarla si cambia quella nelle impostazioni.': {
    en: 'Kimari follows your phone’s language: to change it, change that one in the settings.',
    es: 'Kimari sigue el idioma del teléfono: para cambiarlo, cambia ese en los ajustes.',
    de: 'Kimari folgt der Sprache deines Handys: Zum Ändern änderst du sie in den Einstellungen.',
    ja: 'Kimari は端末の言語に合わせます。変えたいときは、端末の設定で変更してください。'
  ,
    fr: 'Kimari suit la langue du téléphone : pour en changer, change celle des réglages.' },
  'Ogni piano confermato si aggiunge al calendario dalla sua pagina.': {
    en: 'Every confirmed plan can be added to your calendar from its own page.',
    es: 'Cada plan confirmado se añade al calendario desde su propia página.',
    de: 'Jeder bestätigte Plan lässt sich von seiner eigenen Seite aus in den Kalender eintragen.',
    ja: '確定した予定は、そのページからカレンダーに追加できます。'
  ,
    fr: 'Chaque plan confirmé s’ajoute au calendrier depuis sa page.' },
  'Da ogni piano': { en: 'From each plan', es: 'Desde cada plan',
                     de: 'Aus jedem Plan', ja: '各予定から' ,
    fr: 'Depuis chaque plan' },

  /* ----------------------------------- app: la porta d'ingresso
     È la prima schermata che vede chi installa. Se resta in italiano, per un
     tedesco l'app è italiana — qualunque cosa dicano le altre duecento. */
  'Tutti hanno un’opinione. Kimari la trasforma in un piano.': {
    en: 'Everyone has an opinion. Kimari turns it into a plan.',
    es: 'Todo el mundo tiene una opinión. Kimari la convierte en un plan.',
    de: 'Jeder hat eine Meinung. Kimari macht daraus einen Plan.',
    ja: 'みんな意見があります。Kimari はそれを予定にします。'
  ,
    fr: 'Tout le monde a un avis. Kimari en fait un plan.' },
  'Ho almeno 16 anni': { en: 'I’m at least 16', es: 'Tengo al menos 16 años',
                         de: 'Ich bin mindestens 16', ja: '16 歳以上です' ,
    fr: 'J’ai au moins 16 ans' },
  'e accetto Termini e Privacy. Kimari non è per i minori di 16 anni.': {
    en: 'and I accept the Terms and Privacy Policy. Kimari isn’t for under-16s.',
    es: 'y acepto los Términos y la Privacidad. Kimari no es para menores de 16 años.',
    de: 'und ich akzeptiere Nutzungsbedingungen und Datenschutz. Kimari ist nichts für unter 16-Jährige.',
    ja: '利用規約とプライバシーポリシーに同意します。Kimari は 16 歳未満の方はご利用いただけません。'
  ,
    fr: 'et j’accepte les Conditions et la Confidentialité. Kimari n’est pas pour les moins de 16 ans.' },
  'Continua con Apple': { en: 'Continue with Apple', es: 'Continuar con Apple',
                          de: 'Weiter mit Apple', ja: 'Apple で続ける' ,
    fr: 'Continuer avec Apple' },
  'Con un account ritrovi i tuoi piani da qualsiasi telefono.': {
    en: 'With an account you find your plans again from any phone.',
    es: 'Con una cuenta recuperas tus planes desde cualquier teléfono.',
    de: 'Mit einem Konto findest du deine Pläne von jedem Handy aus wieder.',
    ja: 'アカウントがあれば、どの端末からでも自分の予定を開けます。'
  ,
    fr: 'Avec un compte, tu retrouves tes plans depuis n’importe quel téléphone.' },
  'Oppure entra con un nome': { en: 'Or just come in with a name',
    es: 'O entra solo con un nombre', de: 'Oder komm einfach mit einem Namen rein',
    ja: 'または名前だけで始める' ,
    fr: 'Ou entre avec un nom' },

  /* Una persona vera ha guardato la porta d'ingresso e ha detto "non ho Google
     o Apple", concludendo di non poter entrare. La strada c'era, scritta come
     un titoletto grigio. Ora la sua domanda è scritta a schermo e la risposta
     le sta sotto — perché è quella la domanda che uno si fa davanti a quella
     schermata. */
  'Non hai Google o Apple?': {
    en: 'No Google or Apple account?', es: '¿No tienes Google ni Apple?',
    de: 'Kein Google oder Apple?', ja: 'Google や Apple のアカウントがない場合は'
  ,
    fr: 'Pas de Google ni d’Apple ?' },
  'Entra col tuo nome: funziona tutto uguale.': {
    en: 'Come in with your name — everything works just the same.',
    es: 'Entra con tu nombre: funciona todo igual.',
    de: 'Komm mit deinem Namen rein — es funktioniert genauso.',
    ja: '名前だけで参加できます。できることは変わりません。'
  ,
    fr: 'Entre avec ton nom : tout marche pareil.' },
  'Entra': { en: 'Come in', es: 'Entrar', de: 'Rein', ja: 'はじめる' ,
    fr: 'Entrer' },
  'Resti su questo telefono: cambiando dispositivo i piani non ti seguono. Potrai collegare un account quando vuoi.': {
    en: 'You stay on this phone: change device and your plans don’t follow. You can link an account whenever you like.',
    es: 'Te quedas en este teléfono: si cambias de dispositivo, los planes no te siguen. Podrás vincular una cuenta cuando quieras.',
    de: 'Du bleibst auf diesem Handy: Beim Gerätewechsel kommen die Pläne nicht mit. Ein Konto kannst du jederzeit verknüpfen.',
    ja: 'この端末だけに残ります。機種を変えると予定は引き継がれません。アカウントはいつでも連携できます。'
  ,
    fr: 'Tu restes sur ce téléphone : en changeant d’appareil, les plans ne te suivent pas. Tu pourras relier un compte quand tu veux.' },
  'Niente password, niente rubrica. L’email serve solo a ritrovare i tuoi piani.': {
    en: 'No password, no address book. The email is only there to find your plans again.',
    es: 'Sin contraseña, sin agenda. El correo solo sirve para recuperar tus planes.',
    de: 'Kein Passwort, kein Adressbuch. Die E-Mail ist nur dazu da, deine Pläne wiederzufinden.',
    ja: 'パスワードも連絡先も不要です。メールは自分の予定を見つけ直すためだけに使います。'
  ,
    fr: 'Pas de mot de passe, pas de contacts. L’e-mail sert juste à retrouver tes plans.' },




  /* ================================== app: l'ultimo giro, e i frammenti
     Le frasi che restavano, comprese quelle che erano costruite attaccando
     pezzi ('per ' + elenco). Concatenare è il modo classico di rendere una
     frase intraducibile: qui diventano segnaposto. */

  /* Lo schermo che compare quando l'avvio fallisce. Arriva nel momento
     peggiore per doverlo leggere in una lingua non propria. */
  'Non riesco a collegarmi': { en: 'I can’t connect', es: 'No consigo conectar',
                               de: 'Ich komme nicht durch', ja: '接続できません' ,
    fr: 'Je n’arrive pas à me connecter' },
  'I tuoi piani sono al sicuro sul server: non si vedono perché non riesco a leggerli adesso.': {
    en: 'Your plans are safe on the server — you can’t see them because I can’t read them right now.',
    es: 'Tus planes están a salvo en el servidor: no se ven porque ahora no consigo leerlos.',
    de: 'Deine Pläne liegen sicher auf dem Server — sie fehlen nur, weil ich sie gerade nicht lesen kann.',
    ja: '予定はサーバーに無事あります。いま読み込めないため表示されていないだけです。'
  ,
    fr: 'Tes plans sont en sécurité sur le serveur : ils ne s’affichent pas parce que je n’arrive pas à les lire là.' },
  'L’orologio del telefono è sbagliato': { en: 'Your phone’s clock is wrong',
    es: 'El reloj del teléfono está mal', de: 'Die Uhr deines Handys geht falsch',
    ja: '端末の時計がずれています' ,
    fr: 'L’horloge du téléphone est fausse' },
  'Kimari non riesce ad autenticarsi finché la data e l’ora non sono giuste. Attiva l’orario automatico nelle impostazioni.': {
    en: 'Kimari can’t sign in until the date and time are right. Switch on automatic time in your settings.',
    es: 'Kimari no puede autenticarse hasta que la fecha y la hora sean correctas. Activa la hora automática en los ajustes.',
    de: 'Kimari kann sich nicht anmelden, solange Datum und Uhrzeit nicht stimmen. Schalte in den Einstellungen die automatische Zeit ein.',
    ja: '日付と時刻が正しくないと Kimari はログインできません。設定で「自動設定」をオンにしてください。'
  ,
    fr: 'Kimari ne peut pas s’authentifier tant que la date et l’heure sont fausses. Active l’heure automatique dans les réglages.' },
  'Riprova': { en: 'Try again', es: 'Reintentar', de: 'Nochmal', ja: 'もう一度' ,
    fr: 'Réessayer' },

  // "Oggi" nel calendario: due lettere sfuggite a tutti i controlli, perche'
  // sono troppo corte per contenere una parola-spia. Trovata guardando lo
  // schermo, non misurandolo.
  // La barra delle schede: la parte piu' visibile dell'app, e la piu'
  // guardata, ed era in italiano in tutte le lingue. Trovata dal confronto fra
  // la resa italiana e quella inglese — la ricerca per parole-spia non poteva
  // vederla, sono tutte parole corte senza indizi.
  'Gruppi': { en: 'Groups', es: 'Grupos', de: 'Gruppen', ja: 'グループ' ,
    fr: 'Groupes' },
  'Crea': { en: 'Create', es: 'Crear', de: 'Neu', ja: 'つくる' ,
    fr: 'Créer' },
  'Novità': { en: 'News', es: 'Novedades', de: 'Neues', ja: '新着' ,
    fr: 'Quoi de neuf' },
  'Profilo': { en: 'Profile', es: 'Perfil', de: 'Profil', ja: 'プロフィール' ,
    fr: 'Profil' },
  'è entrato nel gruppo': { en: 'joined the group', es: 'se ha unido al grupo',
                              de: 'ist der Gruppe beigetreten', ja: 'がグループに参加しました' ,
    fr: 'a rejoint le groupe' },
  /* ------------------------------- aggiungere alla schermata Home
     Per chi è entrato col solo nome non è un consiglio estetico: la sua
     sessione vive in quel browser, e senza un account non c'è modo di
     recuperarla. È anche l'unico modo di ricevere notifiche su iPhone. */
  'Tieni Kimari a portata di mano': {
    en: 'Keep Kimari within reach', es: 'Ten Kimari a mano',
    de: 'Kimari griffbereit halten', ja: 'Kimari をすぐ開けるように'
  ,
    fr: 'Garde Kimari à portée de main' },
  'Aggiungila alla schermata Home: ricevi le notifiche dei piani nuovi, e non perdi i tuoi piani se cambi browser.': {
    en: 'Add it to your Home Screen: you’ll get notified about new plans, and you won’t lose your plans if you change browser.',
    es: 'Añádela a la pantalla de inicio: recibirás avisos de los planes nuevos y no perderás los tuyos si cambias de navegador.',
    de: 'Leg sie auf den Home-Bildschirm: Du bekommst Bescheid über neue Pläne und verlierst deine nicht, wenn du den Browser wechselst.',
    ja: 'ホーム画面に追加しておくと、新しい予定の通知が届き、ブラウザを変えても予定が消えません。'
  ,
    fr: 'Ajoute-la à l’écran d’accueil : tu reçois les notifications des nouveaux plans, et tu ne perds pas tes plans en changeant de navigateur.' },
  'Installa': { en: 'Install', es: 'Instalar', de: 'Installieren', ja: 'インストール' ,
    fr: 'Installer' },
  'Ho capito': { en: 'Got it', es: 'Entendido', de: 'Verstanden', ja: 'わかりました' ,
    fr: 'Compris' },
  'Tocca Condividi in basso, poi "Aggiungi a Home".': {
    en: 'Tap Share at the bottom, then “Add to Home Screen”.',
    es: 'Toca Compartir abajo y luego «Añadir a pantalla de inicio».',
    de: 'Tippe unten auf Teilen, dann „Zum Home-Bildschirm“.',
    ja: '下の「共有」をタップして、「ホーム画面に追加」を選びます。'
  ,
    fr: 'Touche Partager en bas, puis « Sur l’écran d’accueil ».' },
  'Apri il menu del browser, poi "Installa app".': {
    en: 'Open the browser menu, then “Install app”.',
    es: 'Abre el menú del navegador y luego «Instalar aplicación».',
    de: 'Öffne das Browser-Menü, dann „App installieren“.',
    ja: 'ブラウザのメニューから「アプリをインストール」を選びます。'
  ,
    fr: 'Ouvre le menu du navigateur, puis « Installer l’application ».' },
  'Su iPhone serve Safari: apri kimariapp.com con Safari, poi Condividi e "Aggiungi a Home".': {
    en: 'On iPhone you need Safari: open kimariapp.com in Safari, then Share and “Add to Home Screen”.',
    es: 'En iPhone hace falta Safari: abre kimariapp.com con Safari, luego Compartir y «Añadir a pantalla de inicio».',
    de: 'Auf dem iPhone brauchst du Safari: Öffne kimariapp.com in Safari, dann Teilen und „Zum Home-Bildschirm“.',
    ja: 'iPhone では Safari が必要です。Safari で kimariapp.com を開き、「共有」から「ホーム画面に追加」を選んでください。'
  ,
    fr: 'Sur iPhone il faut Safari : ouvre kimariapp.com avec Safari, puis Partager et « Sur l’écran d’accueil ».' },

  'Oggi': { en: 'Today', es: 'Hoy', de: 'Heute', ja: '今日' ,
    fr: 'Aujourd’hui' },
  'Dati esportati': { en: 'Data exported', es: 'Datos exportados',
                      de: 'Daten exportiert', ja: 'データを書き出しました' ,
    fr: 'Données exportées' },

  /* Senza rete si guarda una copia. Va detto: una copia scambiata per lo
     stato vero è esattamente il tipo di schermo che mente — qualcuno potrebbe
     aver già cambiato il posto e tu staresti andando in quello vecchio. */
  'Senza rete: stai guardando una copia': {
    en: 'No connection — you’re looking at a copy',
    es: 'Sin conexión: estás viendo una copia',
    de: 'Keine Verbindung — du siehst eine Kopie',
    ja: 'オフラインです。表示しているのは保存された内容です'
  ,
    fr: 'Hors ligne : tu regardes une copie' },
  'Aggiornata {quando}': { en: 'Updated {quando}', es: 'Actualizada {quando}',
                           de: 'Stand {quando}', ja: '{quando} 時点' ,
    fr: 'Mise à jour {quando}' },
  'Non ancora acquistabile: arriva con la versione negli store.': {
    en: 'Not on sale yet — it arrives with the version in the stores.',
    es: 'Todavía no está a la venta: llega con la versión de las tiendas.',
    de: 'Noch nicht käuflich — kommt mit der Version in den Stores.',
    ja: 'まだ購入できません。ストア版と一緒に登場します。'
  ,
    fr: 'Pas encore achetable : ça arrive avec la version sur les stores.' },

  /* --------------------------------------------- immagine del profilo */
  'Aggiungi la tua immagine': { en: 'Add your picture', es: 'Añade tu imagen',
                                de: 'Dein Bild hinzufügen', ja: '写真を追加' ,
    fr: 'Ajoute ta photo' },
  'Cambia immagine': { en: 'Change picture', es: 'Cambiar imagen',
                       de: 'Bild ändern', ja: '写真を変える' ,
    fr: 'Changer la photo' },
  'Togli l’immagine': { en: 'Remove the picture', es: 'Quitar la imagen',
                        de: 'Bild entfernen', ja: '写真を外す' ,
    fr: 'Retirer la photo' },
  'Immagine tolta': { en: 'Picture removed', es: 'Imagen eliminada',
                      de: 'Bild entfernt', ja: '写真を外しました' ,
    fr: 'Photo retirée' },

  /* ------------------------------------------------ notifiche push */
  'Ricevi notifiche su questo dispositivo': {
    en: 'Get notifications on this device', es: 'Recibir notificaciones en este dispositivo',
    de: 'Benachrichtigungen auf diesem Gerät', ja: 'この端末で通知を受け取る' ,
    fr: 'Recevoir les notifications sur cet appareil' },
  'Attive qui': { en: 'On here', es: 'Activas aquí', de: 'Hier an', ja: 'この端末ではオン' ,
    fr: 'Actives ici' },
  'Spente: le novità restano in app': {
    en: 'Off — the news still waits in the app',
    es: 'Desactivadas: las novedades siguen en la app',
    de: 'Aus — das Neue wartet trotzdem in der App',
    ja: 'オフ：新着はアプリ内には残ります' ,
    fr: 'Coupées : les nouveautés restent dans l’app' },
  'Notifiche attive su questo dispositivo': {
    en: 'Notifications on for this device', es: 'Notificaciones activas en este dispositivo',
    de: 'Benachrichtigungen für dieses Gerät an', ja: 'この端末の通知をオンにしました' ,
    fr: 'Notifications actives sur cet appareil' },
  'Notifiche spente su questo dispositivo': {
    en: 'Notifications off for this device', es: 'Notificaciones desactivadas en este dispositivo',
    de: 'Benachrichtigungen für dieses Gerät aus', ja: 'この端末の通知をオフにしました' ,
    fr: 'Notifications coupées sur cet appareil' },
  'Questo browser non sa ricevere notifiche': {
    en: 'This browser can’t receive notifications',
    es: 'Este navegador no sabe recibir notificaciones',
    de: 'Dieser Browser kann keine Benachrichtigungen empfangen',
    ja: 'このブラウザは通知を受け取れません' ,
    fr: 'Ce navigateur ne sait pas recevoir de notifications' },
  'Su iPhone servono l’app aggiunta alla schermata Home': {
    en: 'On iPhone you need the app added to the Home Screen',
    es: 'En iPhone hace falta la app añadida a la pantalla de inicio',
    de: 'Auf dem iPhone muss die App zum Home-Bildschirm hinzugefügt sein',
    ja: 'iPhone では、ホーム画面に追加したアプリが必要です' ,
    fr: 'Sur iPhone, il faut l’app ajoutée à l’écran d’accueil' },
  'Notifiche negate: si riattivano dalle impostazioni del browser': {
    en: 'Notifications denied — you can switch them back on in the browser settings',
    es: 'Notificaciones denegadas: se reactivan desde los ajustes del navegador',
    de: 'Benachrichtigungen abgelehnt — im Browser wieder einschaltbar',
    ja: '通知が拒否されました。ブラウザの設定から再度オンにできます' ,
    fr: 'Notifications refusées : elles se réactivent dans les réglages du navigateur' },

  /* ============================ i messaggi che finiscono su WhatsApp
     Sono la faccia che Kimari mostra a chi non l'ha mai vista: spesso il primo
     contatto è questo messaggio inoltrato da un amico, non l'app. Restavano in
     italiano anche a chi usa l'app in un'altra lingua.

     Tutto da segnaposto, e non per pignoleria: qui l'ordine delle parole
     cambia parecchio. In giapponese il link va in fondo, dopo il verbo; in
     tedesco "era X" si costruisce diversamente. Concatenando non si sarebbe
     potuto tradurre. */

  '❓ {titolo} — ai voti. Vota qui, non serve installare niente 👉 {link}': {
    en: '❓ {titolo} — up for a vote. Vote here, nothing to install 👉 {link}',
    es: '❓ {titolo} — a votación. Vota aquí, no hace falta instalar nada 👉 {link}',
    de: '❓ {titolo} — zur Abstimmung. Hier abstimmen, nichts zu installieren 👉 {link}',
    ja: '❓ {titolo} — 投票中です。インストール不要、こちらから投票できます 👉 {link}'
  ,
    fr: '❓ {titolo} — aux votes. Vote ici, rien à installer 👉 {link}' },
  '{emoji} {titolo} — {cosa}: ai voti. Vota qui, non serve installare niente 👉 {link}': {
    en: '{emoji} {titolo} — {cosa}: up for a vote. Vote here, nothing to install 👉 {link}',
    es: '{emoji} {titolo} — {cosa}: a votación. Vota aquí, no hace falta instalar nada 👉 {link}',
    de: '{emoji} {titolo} — {cosa}: zur Abstimmung. Hier abstimmen, nichts zu installieren 👉 {link}',
    ja: '{emoji} {titolo} — {cosa}を決めます。インストール不要、こちらから投票できます 👉 {link}'
  ,
    fr: '{emoji} {titolo} — {cosa} : aux votes. Vote ici, rien à installer 👉 {link}' },
  'dettagli': { en: 'the details', es: 'los detalles', de: 'die Details', ja: '詳細' ,
    fr: 'détails' },
  'Mancano {chi}. {quando} 👉 {link}': {
    en: 'Still missing {chi}. {quando} 👉 {link}',
    es: 'Faltan {chi}. {quando} 👉 {link}',
    de: 'Es fehlen noch {chi}. {quando} 👉 {link}',
    ja: 'まだ {chi} が未回答です。{quando} 👉 {link}'
  ,
    fr: 'Il manque {chi}. {quando} 👉 {link}' },
  '✅ Kimari! {titolo}: {esito} 👉 {link}': {
    en: '✅ Kimari! {titolo}: {esito} 👉 {link}',
    es: '✅ ¡Kimari! {titolo}: {esito} 👉 {link}',
    de: '✅ Kimari! {titolo}: {esito} 👉 {link}',
    ja: '✅ Kimari！{titolo}：{esito} 👉 {link}'
  ,
    fr: '✅ Kimari ! {titolo} : {esito} 👉 {link}' },
  '⚠️ Cambiato: {cosa} 👉 {link}': {
    en: '⚠️ Changed: {cosa} 👉 {link}',
    es: '⚠️ Ha cambiado: {cosa} 👉 {link}',
    de: '⚠️ Geändert: {cosa} 👉 {link}',
    ja: '⚠️ 変更がありました：{cosa} 👉 {link}'
  ,
    fr: '⚠️ Changement : {cosa} 👉 {link}' },
  '{campo} ora {nuovo} (era {vecchio})': {
    en: '{campo} is now {nuovo} (was {vecchio})',
    es: '{campo} ahora {nuovo} (antes {vecchio})',
    de: '{campo} jetzt {nuovo} (vorher {vecchio})',
    ja: '{campo}は{nuovo}に変更（以前は{vecchio}）'
  ,
    fr: '{campo} maintenant {nuovo} (avant {vecchio})' },
  '{emoji} {titolo}: {esito}. Dimmi se ci sei 👉 {link}': {
    en: '{emoji} {titolo}: {esito}. Let me know if you’re in 👉 {link}',
    es: '{emoji} {titolo}: {esito}. Dime si te apuntas 👉 {link}',
    de: '{emoji} {titolo}: {esito}. Sag Bescheid, ob du dabei bist 👉 {link}',
    ja: '{emoji} {titolo}：{esito}。参加できるか教えてください 👉 {link}'
  ,
    fr: '{emoji} {titolo} : {esito}. Dis-moi si tu en es 👉 {link}' },
  '👋 Entra nel gruppo {emoji} {nome} su Kimari: piani e decisioni in un posto solo 👉 {link}': {
    en: '👋 Join the group {emoji} {nome} on Kimari: plans and decisions all in one place 👉 {link}',
    es: '👋 Únete al grupo {emoji} {nome} en Kimari: planes y decisiones en un solo sitio 👉 {link}',
    de: '👋 Komm in die Gruppe {emoji} {nome} auf Kimari: Pläne und Entscheidungen an einem Ort 👉 {link}',
    ja: '👋 Kimari のグループ {emoji} {nome} に参加しませんか。予定も決めごともひとつの場所に 👉 {link}'
  ,
    fr: '👋 Rejoins le groupe {emoji} {nome} sur Kimari : plans et décisions au même endroit 👉 {link}' },
  '👋 Aggiungimi su Kimari, così organizziamo senza 50 messaggi 👉 {link}': {
    en: '👋 Add me on Kimari, so we can organise without 50 messages 👉 {link}',
    es: '👋 Agrégame en Kimari, así organizamos sin 50 mensajes 👉 {link}',
    de: '👋 Füg mich auf Kimari hinzu, dann organisieren wir ohne 50 Nachrichten 👉 {link}',
    ja: '👋 Kimari で友だちになりませんか。50 通のやりとりなしで予定が決まります 👉 {link}'
  ,
    fr: '👋 Ajoute-moi sur Kimari, on s’organise sans 50 messages 👉 {link}' },
  // La seconda definizione della stessa chiave: e' quella che vince a runtime
  // (l'indice si costruisce in ordine), quindi va cambiata anche qui.
  'Vota entro {quando}': { en: 'Vote by {quando}', es: 'Vota antes del {quando}',
                           de: 'Stimm ab bis {quando}', ja: '{quando} までに投票' ,
    fr: 'Vote avant {quando}' },

  /* ------------------------------------------------- sezioni: rinomina e via */
  'Sezione rinominata': { en: 'Section renamed', es: 'Sección renombrada',
                          de: 'Bereich umbenannt', ja: 'セクション名を変えました' ,
    fr: 'Section renommée' },
  'Sezione eliminata': { en: 'Section deleted', es: 'Sección eliminada',
                         de: 'Bereich gelöscht', ja: 'セクションを削除しました' ,
    fr: 'Section supprimée' },
  'I gruppi non si cancellano: tornano fuori dalle sezioni.': {
    en: 'The groups aren’t deleted: they just move out of the sections.',
    es: 'Los grupos no se borran: simplemente salen de las secciones.',
    de: 'Die Gruppen werden nicht gelöscht: Sie rutschen nur aus den Bereichen heraus.',
    ja: 'グループは消えません。セクションの外に出るだけです。'
  ,
    fr: 'Les groupes ne s’effacent pas : ils ressortent des sections.' },
  'Tolto dal piano': { en: 'Removed from the plan', es: 'Quitado del plan',
                       de: 'Aus dem Plan entfernt', ja: '予定から外しました' ,
    fr: 'Retiré du plan' },

  'Piano': { en: 'Plan', es: 'Plan', de: 'Plan', ja: '予定' ,
    fr: 'Plan' },
  // Singolare e plurale come voci separate: in giapponese il plurale non
  // esiste, e una regola automatica costringerebbe a inventarne uno.
  '{n} gruppo': { en: '{n} group', es: '{n} grupo', de: '{n} Gruppe', ja: 'グループ {n} 件' ,
    fr: '{n} groupe' },
  '{n} gruppi': { en: '{n} groups', es: '{n} grupos', de: '{n} Gruppen', ja: 'グループ {n} 件' ,
    fr: '{n} groupes' },
  'vota': { en: 'vote', es: 'vota', de: 'abstimmen', ja: '投票' ,
    fr: 'vote' },
  'conferma': { en: 'confirm', es: 'confirma', de: 'bestätigen', ja: '確定' ,
    fr: 'confirme' },
  'Nome': { en: 'Name', es: 'Nombre', de: 'Name', ja: '名前' ,
    fr: 'Nom' },
  'ai voti': { en: 'up for a vote', es: 'a votación', de: 'zur Abstimmung', ja: '投票中' ,
    fr: 'aux votes' },
  'con link': { en: 'by link', es: 'con enlace', de: 'per Link', ja: 'リンクで' ,
    fr: 'par lien' },
  'non vieni': { en: 'you’re not coming', es: 'no vas', de: 'du kommst nicht', ja: '不参加' ,
    fr: 'tu ne viens pas' },
  'sé': { en: 'themselves', es: 'sí mismo', de: 'sich selbst', ja: '本人' ,
    fr: 'soi' },
  'una foto': { en: 'a photo', es: 'una foto', de: 'ein Foto', ja: '写真 1 枚' ,
    fr: 'une photo' },
  '{n} foto': { en: '{n} photos', es: '{n} fotos', de: '{n} Fotos', ja: '写真 {n} 枚' ,
    fr: '{n} photos' },
  'per {chi}': { en: 'for {chi}', es: 'para {chi}', de: 'für {chi}', ja: '{chi} の分' ,
    fr: 'pour {chi}' },
  '{chi} applica': { en: '{chi} applies it', es: '{chi} lo aplica',
                     de: '{chi} setzt es um', ja: '{chi} が反映します' ,
    fr: '{chi} applique' },
  'il piano si aggiorna da solo': { en: 'the plan updates itself',
    es: 'el plan se actualiza solo', de: 'der Plan aktualisiert sich von selbst',
    ja: '予定はひとりでに更新されます' ,
    fr: 'le plan se met à jour tout seul' },
  'ha già votato': { en: 'has already voted', es: 'ya ha votado',
                     de: 'hat schon abgestimmt', ja: '投票済み' ,
    fr: 'a déjà voté' },
  'è già dentro': { en: 'is already in', es: 'ya está dentro',
                    de: 'ist schon dabei', ja: 'すでに参加中' ,
    fr: 'est déjà dedans' },
  '👍 Sì / 👎 No': { en: '👍 Yes / 👎 No', es: '👍 Sí / 👎 No',
                     de: '👍 Ja / 👎 Nein', ja: '👍 はい ／ 👎 いいえ' ,
    fr: '👍 Oui / 👎 Non' },
  // I valori dei preset: diventano le opzioni vere del piano, quindi vanno
  // tradotti o un tedesco si ritrova opzioni chiamate "Mare, Montagna, Città".
  'Mare|Montagna|Città': { en: 'Seaside|Mountains|City', es: 'Playa|Montaña|Ciudad',
                           de: 'Meer|Berge|Stadt', ja: '海|山|街' ,
    fr: 'Mer|Montagne|Ville' },
  'per sempre con Unlimited attivo': { en: 'forever, with Unlimited on',
    es: 'para siempre, con Unlimited activo', de: 'für immer, mit aktivem Unlimited',
    ja: 'Unlimited が有効なら期限なし' ,
    fr: 'pour toujours avec Unlimited actif' },
  'Con Unlimited: sincronizzazione continua': { en: 'With Unlimited: continuous sync',
    es: 'Con Unlimited: sincronización continua', de: 'Mit Unlimited: laufende Synchronisierung',
    ja: 'Unlimited なら：常時同期' ,
    fr: 'Avec Unlimited : synchronisation continue' },
  'Unlimited attivo (demo, non si paga)': { en: 'Unlimited on (demo, nothing to pay)',
    es: 'Unlimited activo (demo, no se paga)', de: 'Unlimited aktiv (Demo, kostenlos)',
    ja: 'Unlimited 有効（デモ、課金なし）' ,
    fr: 'Unlimited actif (démo, on ne paie pas)' },
  'Tornato al piano gratuito': { en: 'Back to the free plan', es: 'De vuelta al plan gratuito',
                                 de: 'Zurück zum kostenlosen Tarif', ja: '無料プランに戻りました' ,
    fr: 'Retour à la formule gratuite' },
  'Nel prototipo non si paga 🙂': { en: 'In the prototype there’s nothing to pay 🙂',
    es: 'En el prototipo no se paga 🙂', de: 'Im Prototyp zahlt man nichts 🙂',
    ja: 'プロトタイプでは課金はありません 🙂' ,
    fr: 'Dans le prototype on ne paie pas 🙂' },

  /* -------------------------------------- condivisione e messaggi pronti */
  'gli altri rispondono dal link.': { en: 'the others reply from the link.',
    es: 'los demás responden desde el enlace.', de: 'die anderen antworten über den Link.',
    ja: 'ほかの人はリンクから返事します。' ,
    fr: 'les autres répondent depuis le lien.' },
  'chi non ha l’app vota dal link, senza installare niente.': {
    en: 'anyone without the app votes from the link, with nothing to install.',
    es: 'quien no tenga la app vota desde el enlace, sin instalar nada.',
    de: 'wer die App nicht hat, stimmt über den Link ab, ohne etwas zu installieren.',
    ja: 'アプリがない人も、何もインストールせずリンクから投票できます。'
  ,
    fr: 'qui n’a pas l’app vote depuis le lien, sans rien installer.' },
  'Se vuoi, mandalo anche su WhatsApp.': { en: 'Send it on WhatsApp too, if you like.',
    es: 'Si quieres, mándalo también por WhatsApp.',
    de: 'Wenn du magst, schick es auch über WhatsApp.',
    ja: 'よければ WhatsApp にも送ってください。' ,
    fr: 'Si tu veux, envoie-le aussi sur WhatsApp.' },
  'Il gruppo la vede nel piano. Se vuoi, mandala anche su WhatsApp.': {
    en: 'The group sees it in the plan. Send it on WhatsApp too, if you like.',
    es: 'El grupo la ve en el plan. Si quieres, mándala también por WhatsApp.',
    de: 'Die Gruppe sieht es im Plan. Wenn du magst, schick es auch über WhatsApp.',
    ja: 'みんなには予定の中で見えます。よければ WhatsApp にも送ってください。'
  ,
    fr: 'Le groupe la voit dans le plan. Si tu veux, envoie-la aussi sur WhatsApp.' },
  'Avvisato in app': { en: 'Told in the app', es: 'Avisado en la app',
                       de: 'In der App Bescheid gegeben', ja: 'アプリで知らせました' ,
    fr: 'Prévenu dans l’app' },
  'Sollecita chi manca': { en: 'Nudge whoever’s missing', es: 'Recuerda a quien falta',
                           de: 'Die Fehlenden anstupsen', ja: 'まだの人にそっと催促' ,
    fr: 'Relance les retardataires' },
  'Un messaggio pronto, con i nomi di chi non ha ancora votato.': {
    en: 'A ready-made message, with the names of whoever hasn’t voted yet.',
    es: 'Un mensaje listo, con los nombres de quien aún no ha votado.',
    de: 'Eine fertige Nachricht mit den Namen derer, die noch nicht abgestimmt haben.',
    ja: 'まだ投票していない人の名前入りの、そのまま送れるメッセージ。'
  ,
    fr: 'Un message tout prêt, avec les noms de ceux qui n’ont pas encore voté.' },
  'Kimari! Piano confermato': { en: 'Kimari! Plan confirmed', es: '¡Kimari! Plan confirmado',
                                de: 'Kimari! Plan bestätigt', ja: 'Kimari！予定が確定' ,
    fr: 'Kimari ! Plan confirmé' },
  'Manda il risultato nel gruppo: il link è lo stesso, ora mostra la versione definitiva.': {
    en: 'Send the result to the group: it’s the same link, now showing the final version.',
    es: 'Manda el resultado al grupo: el enlace es el mismo, ahora muestra la versión definitiva.',
    de: 'Schick das Ergebnis in die Gruppe: derselbe Link, jetzt mit der endgültigen Fassung.',
    ja: '結果をみんなに送りましょう。リンクは同じで、いまは確定版が表示されます。'
  ,
    fr: 'Envoie le résultat au groupe : le lien est le même, il montre maintenant la version définitive.' },
  'Avvisa il gruppo: chi apre il link vede già il piano aggiornato.': {
    en: 'Tell the group: whoever opens the link already sees the updated plan.',
    es: 'Avisa al grupo: quien abra el enlace ya ve el plan actualizado.',
    de: 'Sag der Gruppe Bescheid: Wer den Link öffnet, sieht schon den aktualisierten Plan.',
    ja: 'みんなに知らせましょう。リンクを開けば、もう更新後の予定が見えます。'
  ,
    fr: 'Préviens le groupe : qui ouvre le lien voit déjà le plan à jour.' },
  'Invita nel gruppo': { en: 'Invite to the group', es: 'Invitar al grupo',
                         de: 'In die Gruppe einladen', ja: 'グループに招待' ,
    fr: 'Inviter dans le groupe' },
  'Il gruppo è privato: si entra solo con questo link, che puoi revocare.': {
    en: 'The group is private: you only get in with this link, which you can revoke.',
    es: 'El grupo es privado: solo se entra con este enlace, que puedes revocar.',
    de: 'Die Gruppe ist privat: Zutritt nur über diesen Link, den du widerrufen kannst.',
    ja: 'グループは非公開です。このリンクからのみ参加でき、いつでも無効にできます。'
  ,
    fr: 'Le groupe est privé : on n’entre qu’avec ce lien, que tu peux révoquer.' },

  /* --------------------------------------------- proposte, voti, spese */
  'Proposta di modifica': { en: 'Suggested change', es: 'Propuesta de cambio',
                            de: 'Änderungsvorschlag', ja: '変更の提案' ,
    fr: 'Proposition de modification' },
  'Proposta approvata: piano aggiornato': { en: 'Suggestion approved — plan updated',
    es: 'Propuesta aprobada: plan actualizado', de: 'Vorschlag angenommen — Plan aktualisiert',
    ja: '提案が通りました：予定を更新しました' ,
    fr: 'Proposition approuvée : plan mis à jour' },
  'La proposta è passata: chi apre il link vede già il piano aggiornato.': {
    en: 'The suggestion carried: whoever opens the link already sees the updated plan.',
    es: 'La propuesta ha salido: quien abra el enlace ya ve el plan actualizado.',
    de: 'Der Vorschlag ist durch: Wer den Link öffnet, sieht schon den aktualisierten Plan.',
    ja: '提案が可決されました。リンクを開けば、もう更新後の予定が見えます。'
  ,
    fr: 'La proposition est passée : qui ouvre le lien voit déjà le plan à jour.' },
  'Hai applicato la proposta: avvisa il gruppo.': {
    en: 'You’ve applied the suggestion — tell the group.',
    es: 'Has aplicado la propuesta: avisa al grupo.',
    de: 'Du hast den Vorschlag umgesetzt — sag der Gruppe Bescheid.',
    ja: '提案を反映しました。みんなに知らせましょう。'
  ,
    fr: 'Tu as appliqué la proposition : préviens le groupe.' },
  'È lo stesso orario di adesso': { en: 'That’s the same time as now',
    es: 'Es la misma hora que ahora', de: 'Das ist dieselbe Uhrzeit wie jetzt',
    ja: 'いまと同じ時刻です' ,
    fr: 'C’est la même heure que maintenant' },
  'Voto cambiato': { en: 'Vote changed', es: 'Voto cambiado',
                     de: 'Stimme geändert', ja: '投票を変えました' ,
    fr: 'Vote modifié' },
  'Voto aggiornato': { en: 'Vote updated', es: 'Voto actualizado',
                       de: 'Stimme aktualisiert', ja: '投票を更新しました' ,
    fr: 'Vote mis à jour' },
  'Hanno votato tutti': { en: 'Everyone has voted', es: 'Han votado todos',
                          de: 'Alle haben abgestimmt', ja: '全員が投票しました' ,
    fr: 'Tout le monde a voté' },
  'Già tra le opzioni': { en: 'Already among the options', es: 'Ya está entre las opciones',
                          de: 'Steht schon bei den Optionen', ja: 'すでに候補にあります' ,
    fr: 'Déjà parmi les options' },
  'Spesa registrata': { en: 'Expense recorded', es: 'Gasto registrado',
                        de: 'Ausgabe erfasst', ja: '費用を記録しました' ,
    fr: 'Dépense enregistrée' },
  'Dal piano': { en: 'From the plan', es: 'Del plan', de: 'Aus dem Plan', ja: '予定から' ,
    fr: 'Depuis le plan' },
  'Posto eliminato': { en: 'Place deleted', es: 'Sitio eliminado',
                       de: 'Ort gelöscht', ja: '場所を削除しました' ,
    fr: 'Lieu supprimé' },

  /* ------------------------------------------------ conferme e rifiuti */
  'Eliminare il gruppo e i suoi piani? Non si torna indietro.': {
    en: 'Delete the group and its plans? There’s no going back.',
    es: '¿Eliminar el grupo y sus planes? No hay vuelta atrás.',
    de: 'Gruppe und ihre Pläne löschen? Das lässt sich nicht rückgängig machen.',
    ja: 'グループとその予定を削除しますか？ 元には戻せません。'
  ,
    fr: 'Supprimer le groupe et ses plans ? Pas de retour en arrière.' },
  'Gruppo eliminato': { en: 'Group deleted', es: 'Grupo eliminado',
                        de: 'Gruppe gelöscht', ja: 'グループを削除しました' ,
    fr: 'Groupe supprimé' },
  'Ricominciare da zero? Il prototipo non salva nulla.': {
    en: 'Start from scratch? The prototype saves nothing.',
    es: '¿Empezar de cero? El prototipo no guarda nada.',
    de: 'Bei null anfangen? Der Prototyp speichert nichts.',
    ja: '最初からやり直しますか？ プロトタイプは何も保存しません。'
  ,
    fr: 'Tout recommencer ? Le prototype n’enregistre rien.' },
  'Un piano ricorrente ha bisogno del luogo già deciso (o "dopo")': {
    en: 'A recurring plan needs the place already settled (or “later”)',
    es: 'Un plan recurrente necesita el sitio ya decidido (o «después»)',
    de: 'Ein wiederkehrender Plan braucht einen festen Ort (oder „später“)',
    ja: '繰り返しの予定には、場所が決まっている必要があります（または「あとで」）'
  ,
    fr: 'Un plan récurrent a besoin d’un lieu déjà décidé (ou « plus tard »)' },
  'Nessuna email: aggiungila per recuperare l’account': {
    en: 'No email: add one so you can recover the account',
    es: 'Sin correo: añádelo para poder recuperar la cuenta',
    de: 'Keine E-Mail: Trag eine ein, um das Konto wiederherstellen zu können',
    ja: 'メール未登録：アカウントを復旧できるように登録してください'
  ,
    fr: 'Pas d’e-mail : ajoute-le pour récupérer le compte' },
  'Nessuna partecipazione web con questa email': {
    en: 'No web participation with this email',
    es: 'Ninguna participación web con este correo',
    de: 'Keine Web-Teilnahme mit dieser E-Mail',
    ja: 'このメールでのウェブ参加は見つかりません'
  ,
    fr: 'Aucune participation web avec cet e-mail' },
  'I video no: metti un link YouTube o Drive': {
    en: 'No videos: put in a YouTube or Drive link',
    es: 'Vídeos no: pon un enlace de YouTube o Drive',
    de: 'Keine Videos: nimm einen YouTube- oder Drive-Link',
    ja: '動画は不可です。YouTube や Drive のリンクを貼ってください'
  ,
    fr: 'Pas de vidéos : mets un lien YouTube ou Drive' },

  /* ================================ app: quello che passa dagli argomenti
     Testo che viaggia come argomento di funzione invece che come markup.
     Finisce a schermo uguale, ma nessuno strumento poteva vederlo. */

  /* ------------------------------------------------------ ricorrenze */
  'Ogni settimana': { en: 'Every week', es: 'Cada semana', de: 'Jede Woche', ja: '毎週' ,
    fr: 'Chaque semaine' },
  'Ogni 2 settimane': { en: 'Every 2 weeks', es: 'Cada 2 semanas',
                        de: 'Alle 2 Wochen', ja: '隔週' ,
    fr: 'Toutes les 2 semaines' },
  'Ogni mese': { en: 'Every month', es: 'Cada mes', de: 'Jeden Monat', ja: '毎月' ,
    fr: 'Chaque mois' },
  // Il giorno va da segnaposto: in tedesco segue il verbo, in giapponese la
  // frase si ribalta del tutto.
  'Ogni {giorno}': { en: 'Every {giorno}', es: 'Cada {giorno}',
                     de: 'Jeden {giorno}', ja: '毎週{giorno}' ,
    fr: 'Chaque {giorno}' },
  'Ogni 2 settimane, {giorno}': { en: 'Every 2 weeks, {giorno}',
    es: 'Cada 2 semanas, {giorno}', de: 'Alle 2 Wochen, {giorno}',
    ja: '隔週{giorno}' ,
    fr: 'Toutes les 2 semaines, le {giorno}' },
  'Più giorni': { en: 'Several days', es: 'Varios días', de: 'Mehrere Tage', ja: '複数日' ,
    fr: 'Plusieurs jours' },

  /* --------------------------------------------------- notifiche push */
  'Devo votare: nuovi piani e opzioni': { en: 'I need to vote: new plans and options',
    es: 'Tengo que votar: planes y opciones nuevos',
    de: 'Ich muss abstimmen: neue Pläne und Optionen',
    ja: '投票が必要：新しい予定と候補' ,
    fr: 'Je dois voter : nouveaux plans et options' },
  'Piano confermato': { en: 'Plan confirmed', es: 'Plan confirmado',
                        de: 'Plan bestätigt', ja: '予定が確定' ,
    fr: 'Plan confirmé' },
  'Modifiche al piano': { en: 'Changes to the plan', es: 'Cambios en el plan',
                          de: 'Änderungen am Plan', ja: '予定の変更' ,
    fr: 'Modifications du plan' },
  'Proposte di cambio': { en: 'Suggested changes', es: 'Propuestas de cambio',
                          de: 'Änderungsvorschläge', ja: '変更の提案' ,
    fr: 'Propositions de changement' },
  'Ritardi e assenze': { en: 'Delays and no-shows', es: 'Retrasos y ausencias',
                         de: 'Verspätungen und Absagen', ja: '遅刻と欠席' ,
    fr: 'Retards et absences' },
  'Promemoria il giorno prima': { en: 'Reminder the day before',
    es: 'Recordatorio el día antes', de: 'Erinnerung am Tag davor', ja: '前日のリマインド' ,
    fr: 'Rappel la veille' },
  'Risposte e attività minori': { en: 'Replies and smaller activity',
    es: 'Respuestas y actividad menor', de: 'Antworten und Kleinigkeiten',
    ja: '返信やこまかな動き' ,
    fr: 'Réponses et activités mineures' },

  /* ------------------------------------------------- il feed: chi fa cosa */
  'ci sarà': { en: 'is coming', es: 'va', de: 'kommt', ja: '参加します' ,
    fr: 'sera là' },
  'forse ci sarà': { en: 'might come', es: 'quizá vaya', de: 'kommt vielleicht',
                     ja: 'たぶん参加します' ,
    fr: 'sera peut-être là' },
  'non viene': { en: 'isn’t coming', es: 'no va', de: 'kommt nicht', ja: '行けません' ,
    fr: 'ne vient pas' },
  'ha creato un piano': { en: 'created a plan', es: 'ha creado un plan',
                          de: 'hat einen Plan erstellt', ja: '予定をつくりました' ,
    fr: 'a créé un plan' },
  'ha aperto una decisione': { en: 'opened a decision', es: 'ha abierto una decisión',
                               de: 'hat eine Entscheidung eröffnet', ja: '決めごとを出しました' ,
    fr: 'a ouvert une décision' },
  'ha annullato il piano': { en: 'called off the plan', es: 'ha cancelado el plan',
                             de: 'hat den Plan abgesagt', ja: '予定を中止しました' ,
    fr: 'a annulé le plan' },
  'ha annullato la decisione': { en: 'called off the decision',
    es: 'ha cancelado la decisión', de: 'hat die Entscheidung abgesagt',
    ja: '決めごとを取り下げました' ,
    fr: 'a annulé la décision' },
  'ha prenotato': { en: 'has booked', es: 'ha reservado', de: 'hat reserviert', ja: '予約しました' ,
    fr: 'a réservé' },
  'è a meno di {ore} ore dall’inizio': {
    en: 'is less than {ore} hours from the start',
    es: 'faltan menos de {ore} horas para empezar',
    de: 'es sind weniger als {ore} Stunden bis zum Beginn',
    ja: '開始まで {ore} 時間を切っています'
  ,
    fr: 'est à moins de {ore} heures du début' },
  ' (non sa quanto)': { en: ' (doesn’t know how much)', es: ' (no sabe cuánto)',
                        de: ' (weiß nicht, wie lange)', ja: '（どのくらいかは未定）' ,
    fr: ' (ne sait pas combien)' },
  'Sì: {chi}': { en: 'Yes: {chi}', es: 'Sí: {chi}', de: 'Ja: {chi}', ja: 'はい：{chi}' ,
    fr: 'Oui : {chi}' },
  'Nessuno ancora': { en: 'Nobody yet', es: 'Nadie todavía', de: 'Noch niemand', ja: 'まだ誰もいません' ,
    fr: 'Personne pour l’instant' },
  'Non vengono': { en: 'Not coming', es: 'No van', de: 'Kommen nicht', ja: '行けない人' ,
    fr: 'Ne viennent pas' },
  'Non hanno risposto': { en: 'Haven’t replied', es: 'No han respondido',
                          de: 'Haben nicht geantwortet', ja: '未回答' ,
    fr: 'Sans réponse' },

  /* ------------------------------------------------- creare e modificare */
  'Crea il piano': { en: 'Create the plan', es: 'Crear el plan',
                     de: 'Plan erstellen', ja: '予定をつくる' ,
    fr: 'Créer le plan' },
  'Crea gruppo': { en: 'Create group', es: 'Crear grupo',
                   de: 'Gruppe erstellen', ja: 'グループをつくる' ,
    fr: 'Créer le groupe' },
  'Modifica gruppo': { en: 'Edit group', es: 'Editar grupo',
                       de: 'Gruppe bearbeiten', ja: 'グループを編集' ,
    fr: 'Modifier le groupe' },
  'Icona, colore, nome e la sezione in cui lo tieni tu.': {
    en: 'Icon, colour, name, and the section where you keep it.',
    es: 'Icono, color, nombre y la sección en la que lo guardas.',
    de: 'Symbol, Farbe, Name und der Bereich, in dem du sie ablegst.',
    ja: 'アイコン、色、名前、そしてあなたが置いておくセクション。'
  ,
    fr: 'Icône, couleur, nom et la section où tu le ranges.' },
  'Una cerchia che userai più volte. Privata: si entra solo su invito.': {
    en: 'A circle you’ll use more than once. Private: you get in by invitation only.',
    es: 'Un círculo que usarás más de una vez. Privado: solo se entra por invitación.',
    de: 'Ein Kreis, den du öfter nutzen wirst. Privat: Zutritt nur auf Einladung.',
    ja: '何度も使うことになる集まりです。非公開で、招待からのみ参加できます。'
  ,
    fr: 'Un cercle que tu réutiliseras. Privé : on n’entre que sur invitation.' },
  'Gruppo aggiornato': { en: 'Group updated', es: 'Grupo actualizado',
                         de: 'Gruppe aktualisiert', ja: 'グループを更新しました' ,
    fr: 'Groupe mis à jour' },
  'Gruppo creato · privato, solo su invito': {
    en: 'Group created · private, invitation only',
    es: 'Grupo creado · privado, solo por invitación',
    de: 'Gruppe erstellt · privat, nur auf Einladung',
    ja: 'グループをつくりました · 非公開、招待制'
  ,
    fr: 'Groupe créé · privé, sur invitation seulement' },
  'Ogni modifica crea una nuova versione: tutti vedono cosa è cambiato e cosa c’era prima.': {
    en: 'Every change makes a new version: everyone sees what changed and what was there before.',
    es: 'Cada cambio crea una versión nueva: todos ven qué ha cambiado y qué había antes.',
    de: 'Jede Änderung erzeugt eine neue Fassung: Alle sehen, was sich geändert hat und was vorher da war.',
    ja: '変更するたびに新しい版ができます。何がどう変わったか、みんなが見られます。'
  ,
    fr: 'Chaque modification crée une nouvelle version : tout le monde voit ce qui a changé et ce qu’il y avait avant.' },
  'Vale solo per questa data.': { en: 'It only applies to this date.',
    es: 'Vale solo para esta fecha.', de: 'Gilt nur für dieses Datum.',
    ja: 'この日付にだけ適用されます。' ,
    fr: 'Ne vaut que pour cette date.' },
  'Data da decidere': { en: 'Date to be decided', es: 'Fecha por decidir',
                        de: 'Datum noch offen', ja: '日付は未定' ,
    fr: 'Date à décider' },
  'Luogo da decidere': { en: 'Place to be decided', es: 'Sitio por decidir',
                         de: 'Ort noch offen', ja: '場所は未定' ,
    fr: 'Lieu à décider' },
  'Decidiamo dopo': { en: 'We’ll decide later', es: 'Lo decidimos después',
                      de: 'Entscheiden wir später', ja: 'あとで決める' ,
    fr: 'On décide plus tard' },
  'Il piano è pronto': { en: 'The plan is ready', es: 'El plan está listo',
                         de: 'Der Plan steht', ja: '予定ができました' ,
    fr: 'Le plan est prêt' },
  'Piano creato': { en: 'Plan created', es: 'Plan creado',
                    de: 'Plan erstellt', ja: '予定をつくりました' ,
    fr: 'Plan créé' },
  'Nessun piano in programma': { en: 'No plans on', es: 'Ningún plan previsto',
                                 de: 'Keine Pläne', ja: '予定はありません' ,
    fr: 'Aucun plan au programme' },
  'Vota quando puoi': { en: 'Vote when you can', es: 'Vota cuando puedas',
                        de: 'Stimm ab, wenn du kannst', ja: '都合のいいときに投票を' ,
    fr: 'Vote quand tu peux' },
  'Vota qui · non serve installare niente': {
    en: 'Vote here · nothing to install', es: 'Vota aquí · no hace falta instalar nada',
    de: 'Hier abstimmen · nichts zu installieren', ja: 'ここで投票 · インストール不要' ,
    fr: 'Vote ici · rien à installer' },
  'Il tuo voto è registrato: tocca l’altro per cambiarlo.': {
    en: 'Your vote is in — tap the other one to change it.',
    es: 'Tu voto está registrado: toca el otro para cambiarlo.',
    de: 'Deine Stimme ist da — tipp die andere an, um sie zu ändern.',
    ja: '投票を受け付けました。もう一方を押せば変更できます。'
  ,
    fr: 'Ton vote est enregistré : touche l’autre pour changer.' },
  'Tocca per votare: vale subito.': { en: 'Tap to vote — it counts straight away.',
    es: 'Toca para votar: cuenta al momento.', de: 'Tippen zum Abstimmen — zählt sofort.',
    ja: '押すと投票できます。すぐ反映されます。' ,
    fr: 'Touche pour voter : ça compte tout de suite.' },
  'Tocca Sì o No.': { en: 'Tap Yes or No.', es: 'Toca Sí o No.',
                      de: 'Tipp auf Ja oder Nein.', ja: 'はい か いいえ を押してください。' ,
    fr: 'Touche Oui ou Non.' },
  'Con link': { en: 'By link', es: 'Con enlace', de: 'Per Link', ja: 'リンクで' ,
    fr: 'Par lien' },
  'Tutti': { en: 'Everyone', es: 'Todos', de: 'Alle', ja: '全員' ,
    fr: 'Tous' },
  'Conferma': { en: 'Confirm', es: 'Confirmar', de: 'Bestätigen', ja: '確定' ,
    fr: 'Confirmer' },
  'Chiudi la decisione': { en: 'Close the decision', es: 'Cerrar la decisión',
                           de: 'Entscheidung schließen', ja: '決めごとを締める' ,
    fr: 'Clore la décision' },
  'Annulla la decisione': { en: 'Call off the decision', es: 'Cancelar la decisión',
                            de: 'Entscheidung absagen', ja: '決めごとを取り下げる' ,
    fr: 'Annuler la décision' },
  'Tutti hanno risposto · Chiudi': { en: 'Everyone has replied · Close',
    es: 'Todos han respondido · Cerrar', de: 'Alle haben geantwortet · Schließen',
    ja: '全員が回答 · 締める' ,
    fr: 'Tout le monde a répondu · Clore' },
  'Tutti hanno votato · Conferma': { en: 'Everyone has voted · Confirm',
    es: 'Todos han votado · Confirmar', de: 'Alle haben abgestimmt · Bestätigen',
    ja: '全員が投票 · 確定' ,
    fr: 'Tout le monde a voté · Confirmer' },
  'Elimina qualcosa per fare spazio.': { en: 'Delete something to make room.',
    es: 'Elimina algo para hacer sitio.', de: 'Lösch etwas, um Platz zu schaffen.',
    ja: '空きを作るには何か削除してください。' ,
    fr: 'Supprime quelque chose pour faire de la place.' },
  'Conferma di avere almeno 16 anni': { en: 'Confirm that you’re at least 16',
    es: 'Confirma que tienes al menos 16 años', de: 'Bestätige, dass du mindestens 16 bist',
    ja: '16 歳以上であることを確認してください' ,
    fr: 'Confirme que tu as au moins 16 ans' },
  'Solo il nome': { en: 'Just the name', es: 'Solo el nombre',
                    de: 'Nur der Name', ja: '名前だけ' ,
    fr: 'Juste le nom' },
  'Simula i voti del gruppo': { en: 'Simulate the group’s votes',
    es: 'Simular los votos del grupo', de: 'Die Stimmen der Gruppe simulieren',
    ja: 'みんなの投票をシミュレート' ,
    fr: 'Simuler les votes du groupe' },
  'Simula 3 amici che votano': { en: 'Simulate 3 friends voting',
    es: 'Simular 3 amigos votando', de: '3 Freunde abstimmen lassen',
    ja: '友だち 3 人の投票をシミュレート' ,
    fr: 'Simuler 3 amis qui votent' },

  /* ------------------------------------------------- chi può votare */
  'Chiunque abbia il link': { en: 'Anyone with the link', es: 'Cualquiera con el enlace',
                              de: 'Alle mit dem Link', ja: 'リンクを持つ人なら誰でも' ,
    fr: 'Quiconque a le lien' },
  'Solo chi è nell’elenco': { en: 'Only those on the list', es: 'Solo quien esté en la lista',
                              de: 'Nur wer auf der Liste steht', ja: 'リストにある人だけ' ,
    fr: 'Seulement qui est sur la liste' },
  'Solo con un account': { en: 'Only with an account', es: 'Solo con una cuenta',
                           de: 'Nur mit Konto', ja: 'アカウントがある人だけ' ,
    fr: 'Seulement avec un compte' },
  'Scrive il suo nome ed entra. Vedi sempre chi ha votato': {
    en: 'They type their name and come in. You always see who voted',
    es: 'Escribe su nombre y entra. Siempre ves quién ha votado',
    de: 'Sie schreiben ihren Namen und kommen rein. Du siehst immer, wer abgestimmt hat',
    ja: '名前を書いて参加します。だれが投票したかは常に分かります'
  ,
    fr: 'Il écrit son nom et entre. Tu vois toujours qui a voté' },
  'Scrivi tu i nomi: chi apre il link sceglie il suo, e quel nome è preso': {
    en: 'You write the names: whoever opens the link picks theirs, and that name is taken',
    es: 'Escribes tú los nombres: quien abra el enlace elige el suyo, y ese nombre queda ocupado',
    de: 'Du schreibst die Namen: Wer den Link öffnet, wählt seinen, und der Name ist dann vergeben',
    ja: '名前はあなたが書きます。リンクを開いた人が自分の名前を選び、その名前は埋まります'
  ,
    fr: 'Tu écris les noms : qui ouvre le lien choisit le sien, et ce nom est pris' },
  'Serve entrare con Google o Apple. Il più chiuso, ma qualcuno non voterà': {
    en: 'They must sign in with Google or Apple. The tightest, but some people won’t vote',
    es: 'Hay que entrar con Google o Apple. El más cerrado, pero alguien no votará',
    de: 'Man muss sich mit Google oder Apple anmelden. Am dichtesten, aber manche stimmen dann nicht ab',
    ja: 'Google か Apple でのログインが必要です。いちばん厳しく、その分だけ投票しない人も出ます'
  ,
    fr: 'Il faut entrer avec Google ou Apple. Le plus fermé, mais certains ne voteront pas' },

  /* ===================================== i messaggi che l'app risponde
     Sono i toast di live.js: "Voto registrato", "Scrivi il tuo nome". Non
     passavano da nessuna traduzione perché live.js non conosceva il
     dizionario. Adesso li traduce il dispatcher, in un punto solo — sono 76 e
     passano tutti da lì. */

  /* --------------------------------------------------- fatto, riuscito */
  'Bentornato': { en: 'Welcome back', es: 'Bienvenido de nuevo',
                  de: 'Willkommen zurück', ja: 'おかえりなさい' ,
    fr: 'Content de te revoir' },
  'Benvenuto, {nome}': { en: 'Welcome, {nome}', es: 'Bienvenido, {nome}',
                         de: 'Willkommen, {nome}', ja: '{nome} さん、ようこそ' ,
    fr: 'Bienvenue, {nome}' },
  'Ci sei': { en: 'You’re in', es: 'Ya estás', de: 'Du bist dabei', ja: '参加しました' ,
    fr: 'Tu y es' },
  'Sei dentro': { en: 'You’re in', es: 'Estás dentro', de: 'Du bist drin', ja: '参加しました' ,
    fr: 'Tu es dedans' },
  'Aggiornato': { en: 'Updated', es: 'Actualizado', de: 'Aktualisiert', ja: '更新しました' ,
    fr: 'Mis à jour' },
  'Tolto': { en: 'Removed', es: 'Quitado', de: 'Entfernt', ja: '削除しました' ,
    fr: 'Retiré' },
  'Kimari! ✅': { en: 'Kimari! ✅', es: '¡Kimari! ✅', de: 'Kimari! ✅', ja: 'Kimari！✅' ,
    fr: 'Kimari ! ✅' },
  'Voto registrato': { en: 'Vote recorded', es: 'Voto registrado',
                       de: 'Stimme gespeichert', ja: '投票を記録しました' ,
    fr: 'Vote enregistré' },
  'Ti avvisiamo alla conferma': { en: 'We’ll let you know when it’s confirmed',
    es: 'Te avisamos cuando se confirme', de: 'Wir sagen Bescheid, sobald es bestätigt ist',
    ja: '確定したらお知らせします' ,
    fr: 'On te prévient à la confirmation' },
  'Opzione aggiunta: invia il voto per confermarla': {
    en: 'Option added — send your vote to confirm it',
    es: 'Opción añadida: envía tu voto para confirmarla',
    de: 'Option hinzugefügt — schick deine Stimme, um sie zu bestätigen',
    ja: '候補を追加しました。投票を送ると確定します'
  ,
    fr: 'Option ajoutée : envoie ton vote pour la confirmer' },
  'Piano aggiornato': { en: 'Plan updated', es: 'Plan actualizado',
                        de: 'Plan aktualisiert', ja: '予定を更新しました' ,
    fr: 'Plan mis à jour' },
  'Piano annullato': { en: 'Plan called off', es: 'Plan cancelado',
                       de: 'Plan abgesagt', ja: '予定を中止しました' ,
    fr: 'Plan annulé' },
  'Il gruppo lo sa': { en: 'The group knows', es: 'El grupo ya lo sabe',
                       de: 'Die Gruppe weiß Bescheid', ja: 'みんなに伝わりました' ,
    fr: 'Le groupe le sait' },
  'Gruppo salvato': { en: 'Group saved', es: 'Grupo guardado',
                      de: 'Gruppe gespeichert', ja: 'グループを保存しました' ,
    fr: 'Groupe enregistré' },
  'Gruppo sciolto': { en: 'Group dissolved', es: 'Grupo disuelto',
                      de: 'Gruppe aufgelöst', ja: 'グループを解散しました' ,
    fr: 'Groupe dissous' },
  'Sei uscito dal gruppo': { en: 'You’ve left the group', es: 'Has salido del grupo',
                             de: 'Du hast die Gruppe verlassen', ja: 'グループを抜けました' ,
    fr: 'Tu as quitté le groupe' },
  'Tolto dal gruppo': { en: 'Removed from the group', es: 'Quitado del grupo',
                        de: 'Aus der Gruppe entfernt', ja: 'グループから削除しました' ,
    fr: 'Retiré du groupe' },
  'Profilo aggiornato': { en: 'Profile updated', es: 'Perfil actualizado',
                          de: 'Profil aktualisiert', ja: 'プロフィールを更新しました' ,
    fr: 'Profil mis à jour' },
  'Commento tolto': { en: 'Comment removed', es: 'Comentario eliminado',
                      de: 'Kommentar entfernt', ja: 'コメントを削除しました' ,
    fr: 'Commentaire retiré' },
  'Foto tolta': { en: 'Photo removed', es: 'Foto eliminada',
                  de: 'Foto entfernt', ja: '写真を削除しました' ,
    fr: 'Photo retirée' },
  'Posto tolto': { en: 'Place removed', es: 'Sitio eliminado',
                   de: 'Ort entfernt', ja: '場所を削除しました' ,
    fr: 'Lieu retiré' },
  'Copertina cambiata': { en: 'Cover changed', es: 'Portada cambiada',
                          de: 'Titelbild geändert', ja: 'カバー写真を変えました' ,
    fr: 'Couverture changée' },
  'Aggiunto ai tuoi': { en: 'Added to yours', es: 'Añadido a los tuyos',
                        de: 'Zu deinen hinzugefügt', ja: '自分のリストに追加しました' ,
    fr: 'Ajouté aux tiens' },
  'Salvato tra i tuoi posti ★': { en: 'Saved to your places ★',
    es: 'Guardado en tus sitios ★', de: 'Zu deinen Orten gespeichert ★',
    ja: '自分の場所に保存しました ★' ,
    fr: 'Enregistré dans tes lieux ★' },
  'Link aggiunto': { en: 'Link added', es: 'Enlace añadido',
                     de: 'Link hinzugefügt', ja: 'リンクを追加しました' ,
    fr: 'Lien ajouté' },
  'Domanda aggiunta al piano': { en: 'Question added to the plan',
    es: 'Pregunta añadida al plan', de: 'Frage zum Plan hinzugefügt',
    ja: '予定に質問を追加しました' ,
    fr: 'Question ajoutée au plan' },
  'Domanda tolta': { en: 'Question removed', es: 'Pregunta eliminada',
                     de: 'Frage entfernt', ja: '質問を削除しました' ,
    fr: 'Question retirée' },
  'Spesa aggiunta': { en: 'Expense added', es: 'Gasto añadido',
                      de: 'Ausgabe hinzugefügt', ja: '費用を追加しました' ,
    fr: 'Dépense ajoutée' },
  'Spesa annullata': { en: 'Expense voided', es: 'Gasto anulado',
                       de: 'Ausgabe storniert', ja: '費用を取り消しました' ,
    fr: 'Dépense annulée' },
  'Pagamento registrato': { en: 'Payment recorded', es: 'Pago registrado',
                            de: 'Zahlung erfasst', ja: '支払いを記録しました' ,
    fr: 'Paiement enregistré' },
  'Proposta aperta': { en: 'Suggestion opened', es: 'Propuesta abierta',
                       de: 'Vorschlag eröffnet', ja: '提案を出しました' ,
    fr: 'Proposition ouverte' },
  'Proposta rifiutata': { en: 'Suggestion turned down', es: 'Propuesta rechazada',
                          de: 'Vorschlag abgelehnt', ja: '提案を却下しました' ,
    fr: 'Proposition refusée' },
  'Proposta ritirata': { en: 'Suggestion withdrawn', es: 'Propuesta retirada',
                         de: 'Vorschlag zurückgezogen', ja: '提案を取り下げました' ,
    fr: 'Proposition retirée' },
  'Ritardo annullato': { en: 'Delay cancelled', es: 'Retraso cancelado',
                         de: 'Verspätung zurückgenommen', ja: '遅刻の連絡を取り消しました' ,
    fr: 'Retard annulé' },
  'Ricaricato dal server': { en: 'Reloaded from the server',
    es: 'Recargado desde el servidor', de: 'Vom Server neu geladen',
    ja: 'サーバーから読み込み直しました' ,
    fr: 'Rechargé depuis le serveur' },
  'Link revocato: chi è già dentro resta': {
    en: 'Link revoked — anyone already in stays in',
    es: 'Enlace revocado: quien ya está dentro se queda',
    de: 'Link widerrufen — wer schon drin ist, bleibt',
    ja: 'リンクを無効にしました。すでに参加している人はそのままです'
  ,
    fr: 'Lien révoqué : qui est déjà dedans reste' },
  'Link revocato: chi è già entrato resta': {
    en: 'Link revoked — anyone who already joined stays in',
    es: 'Enlace revocado: quien ya entró se queda',
    de: 'Link widerrufen — wer schon beigetreten ist, bleibt',
    ja: 'リンクを無効にしました。すでに参加した人はそのままです'
  ,
    fr: 'Lien révoqué : qui est déjà entré reste' },

  /* ------------------------------------------- manca qualcosa, riprova */
  'Scrivi il tuo nome': { en: 'Type your name', es: 'Escribe tu nombre',
                          de: 'Schreib deinen Namen', ja: 'お名前を入力してください' ,
    fr: 'Écris ton nom' },
  'Scrivi un nome': { en: 'Type a name', es: 'Escribe un nombre',
                      de: 'Schreib einen Namen', ja: '名前を入力してください' ,
    fr: 'Écris un nom' },
  'Il nome serve': { en: 'The name is needed', es: 'Hace falta el nombre',
                     de: 'Der Name wird gebraucht', ja: '名前が必要です' ,
    fr: 'Il faut un nom' },
  'Dai un nome al gruppo': { en: 'Give the group a name', es: 'Ponle un nombre al grupo',
                             de: 'Gib der Gruppe einen Namen', ja: 'グループに名前をつけてください' ,
    fr: 'Donne un nom au groupe' },
  'Scrivi il nome della sezione': { en: 'Type the section name',
    es: 'Escribe el nombre de la sección', de: 'Schreib den Namen des Bereichs',
    ja: 'セクション名を入力してください' ,
    fr: 'Écris le nom de la section' },
  'Scrivi il nome del posto': { en: 'Type the name of the place',
    es: 'Escribe el nombre del sitio', de: 'Schreib den Namen des Ortes',
    ja: '場所の名前を入力してください' ,
    fr: 'Écris le nom du lieu' },
  'Scrivi la domanda': { en: 'Type the question', es: 'Escribe la pregunta',
                         de: 'Schreib die Frage', ja: '質問を入力してください' ,
    fr: 'Écris la question' },
  'Scrivi cosa hai pagato': { en: 'Type what you paid for',
    es: 'Escribe qué has pagado', de: 'Schreib, wofür du bezahlt hast',
    ja: '何の支払いか入力してください' ,
    fr: 'Écris ce que tu as payé' },
  'Scrivi l’importo': { en: 'Type the amount', es: 'Escribe el importe',
                        de: 'Schreib den Betrag', ja: '金額を入力してください' ,
    fr: 'Écris le montant' },
  'Scrivi l’opzione': { en: 'Type the option', es: 'Escribe la opción',
                        de: 'Schreib die Option', ja: '選択肢を入力してください' ,
    fr: 'Écris l’option' },
  'Importo non valido': { en: 'That amount isn’t valid', es: 'Importe no válido',
                          de: 'Der Betrag ist ungültig', ja: '金額が正しくありません' ,
    fr: 'Montant non valide' },
  'Incolla un link': { en: 'Paste a link', es: 'Pega un enlace',
                       de: 'Füg einen Link ein', ja: 'リンクを貼り付けてください' ,
    fr: 'Colle un lien' },
  'Scegli una data': { en: 'Pick a date', es: 'Elige una fecha',
                       de: 'Wähl ein Datum', ja: '日付を選んでください' ,
    fr: 'Choisis une date' },
  'Scegli data e ora': { en: 'Pick a date and time', es: 'Elige fecha y hora',
                         de: 'Wähl Datum und Uhrzeit', ja: '日時を選んでください' ,
    fr: 'Choisis la date et l’heure' },
  'Scegli per chi è la spesa': { en: 'Choose who the expense is for',
    es: 'Elige para quién es el gasto', de: 'Wähl, für wen die Ausgabe ist',
    ja: 'だれの費用か選んでください' ,
    fr: 'Choisis pour qui est la dépense' },
  'Segna almeno un’opzione per ogni domanda': {
    en: 'Tick at least one option for every question',
    es: 'Marca al menos una opción en cada pregunta',
    de: 'Markier mindestens eine Option pro Frage',
    ja: '各質問について、少なくとも一つ選んでください'
  ,
    fr: 'Coche au moins une option par question' },
  'Servono almeno 2 opzioni': { en: 'You need at least 2 options',
    es: 'Hacen falta al menos 2 opciones', de: 'Es braucht mindestens 2 Optionen',
    ja: '候補が 2 つ以上必要です' ,
    fr: 'Il faut au moins 2 options' },
  'Di quanto sei in ritardo?': { en: 'How late are you?', es: '¿Cuánto te retrasas?',
                                 de: 'Wie viel später kommst du?', ja: 'どのくらい遅れますか？' ,
    fr: 'Tu as combien de retard ?' },
  'Controlla l’email': { en: 'Check the email address', es: 'Revisa el correo',
                         de: 'Prüf die E-Mail-Adresse', ja: 'メールアドレスを確認してください' ,
    fr: 'Vérifie tes e-mails' },
  'Conferma prima di avere almeno 16 anni': {
    en: 'First confirm that you’re at least 16',
    es: 'Confirma primero que tienes al menos 16 años',
    de: 'Bestätige zuerst, dass du mindestens 16 bist',
    ja: 'まず 16 歳以上であることを確認してください'
  ,
    fr: 'Confirme d’abord que tu as au moins 16 ans' },
  'Prima conferma di avere almeno 16 anni': {
    en: 'First confirm that you’re at least 16',
    es: 'Confirma primero que tienes al menos 16 años',
    de: 'Bestätige zuerst, dass du mindestens 16 bist',
    ja: 'まず 16 歳以上であることを確認してください'
  ,
    fr: 'Confirme d’abord que tu as au moins 16 ans' },
  'Nessuna modifica': { en: 'Nothing changed', es: 'Sin cambios',
                        de: 'Nichts geändert', ja: '変更はありません' ,
    fr: 'Aucune modification' },
  'Massimo {n} persone': { en: 'Maximum {n} people', es: 'Máximo {n} personas',
                           de: 'Höchstens {n} Personen', ja: '最大 {n} 人' ,
    fr: 'Maximum {n} personnes' },
  'Nessun limite': { en: 'No limit', es: 'Sin límite', de: 'Kein Limit', ja: '上限なし' ,
    fr: 'Aucune limite' },
  'Annullato: l’account resta': { en: 'Cancelled — your account stays',
    es: 'Cancelado: tu cuenta se queda', de: 'Abgebrochen — dein Konto bleibt',
    ja: '取り消しました。アカウントはそのままです' ,
    fr: 'Annulé : le compte reste' },
  'Le opzioni delle domande si aggiungono creandole': {
    en: 'Options for questions are added when you create them',
    es: 'Las opciones de las preguntas se añaden al crearlas',
    de: 'Optionen für Fragen werden beim Erstellen hinzugefügt',
    ja: '質問の選択肢は、質問を作るときに追加します'
  ,
    fr: 'Les options des questions s’ajoutent à la création' },

  /* -------------------------------------------------- non trovato, rotto */
  'Gruppo non trovato': { en: 'Group not found', es: 'Grupo no encontrado',
                          de: 'Gruppe nicht gefunden', ja: 'グループが見つかりません' ,
    fr: 'Groupe introuvable' },
  'Piano non trovato': { en: 'Plan not found', es: 'Plan no encontrado',
                         de: 'Plan nicht gefunden', ja: '予定が見つかりません' ,
    fr: 'Plan introuvable' },
  'Proposta non trovata': { en: 'Suggestion not found', es: 'Propuesta no encontrada',
                            de: 'Vorschlag nicht gefunden', ja: '提案が見つかりません' ,
    fr: 'Proposition introuvable' },
  '{chi} non è attivo su Supabase': { en: '{chi} isn’t switched on in Supabase',
    es: '{chi} no está activo en Supabase', de: '{chi} ist in Supabase nicht aktiviert',
    ja: '{chi} は Supabase で有効になっていません' ,
    fr: '{chi} n’est pas actif sur Supabase' },
  'Chiavi passate': { en: 'Keys handed over', es: 'Llaves entregadas',
                      de: 'Schlüssel übergeben', ja: '権限を引き継ぎました' ,
    fr: 'Clés transmises' },
  'Scrivi come ti chiami': { en: 'Type what you’re called', es: 'Escribe cómo te llamas',
                             de: 'Schreib, wie du heißt', ja: 'お名前を入力してください' ,
    fr: 'Écris comment tu t’appelles' },
  // Messaggio da configurazione: succede quando l'indirizzo da cui gira l'app
  // non è fra quelli che Supabase accetta al ritorno da Google o Apple. Va
  // detto per esteso, con l'indirizzo dentro, o non si capisce cosa aggiungere.
  'Questo indirizzo non è fra i Redirect URLs di Supabase: {dove}': {
    en: 'This address isn’t among Supabase’s Redirect URLs: {dove}',
    es: 'Esta dirección no está entre las Redirect URLs de Supabase: {dove}',
    de: 'Diese Adresse steht nicht in den Redirect-URLs von Supabase: {dove}',
    ja: 'このアドレスは Supabase の Redirect URLs に登録されていません：{dove}'
  ,
    fr: 'Cette adresse n’est pas dans les Redirect URLs de Supabase : {dove}' },

  /* ===================================== app: le etichette dell'interfaccia
     Sono le parole brevi — bottoni, titoletti, segnaposto. Erano rimaste fuori
     da tutti i controlli perché il rilevatore cercava parole italiane comuni
     ("che", "con", "dove") e "Nuovo gruppo" non ne contiene nessuna. Sono
     metà dell'interfaccia: senza queste l'app risultava tradotta e a schermo
     era mezza italiana. */

  /* -------------------------------------------------------- azioni comuni */
  'Aggiungi': { en: 'Add', es: 'Añadir', de: 'Hinzufügen', ja: '追加' ,
    fr: 'Ajouter' },
  'aggiungi': { en: 'add', es: 'añadir', de: 'hinzufügen', ja: '追加' ,
    fr: 'ajouter' },
  'Rimuovi': { en: 'Remove', es: 'Quitar', de: 'Entfernen', ja: '削除' ,
    fr: 'Retirer' },
  'Togli': { en: 'Take off', es: 'Quitar', de: 'Wegnehmen', ja: '外す' ,
    fr: 'Enlever' },
  'Elimina': { en: 'Delete', es: 'Eliminar', de: 'Löschen', ja: '削除' ,
    fr: 'Supprimer' },
  'Modifica': { en: 'Edit', es: 'Editar', de: 'Bearbeiten', ja: '編集' ,
    fr: 'Modifier' },
  'Annulla': { en: 'Cancel', es: 'Cancelar', de: 'Abbrechen', ja: 'キャンセル' ,
    fr: 'Annuler' },
  'Chiudi': { en: 'Close', es: 'Cerrar', de: 'Schließen', ja: '閉じる' ,
    fr: 'Fermer' },
  'Indietro': { en: 'Back', es: 'Atrás', de: 'Zurück', ja: '戻る' ,
    fr: 'Retour' },
  'Scegli': { en: 'Choose', es: 'Elegir', de: 'Wählen', ja: '選ぶ' ,
    fr: 'Choisir' },
  'Condividi': { en: 'Share', es: 'Compartir', de: 'Teilen', ja: '共有' ,
    fr: 'Partager' },
  'Collega': { en: 'Link', es: 'Vincular', de: 'Verknüpfen', ja: '連携' ,
    fr: 'Relier' },
  'Applica ora': { en: 'Apply now', es: 'Aplicar ahora', de: 'Jetzt übernehmen', ja: '今すぐ反映' ,
    fr: 'Appliquer maintenant' },
  'Rifiuta': { en: 'Turn down', es: 'Rechazar', de: 'Ablehnen', ja: '却下' ,
    fr: 'Refuser' },
  'Proponi': { en: 'Suggest', es: 'Proponer', de: 'Vorschlagen', ja: '提案' ,
    fr: 'Proposer' },
  'Sollecita': { en: 'Nudge', es: 'Recordar', de: 'Anstupsen', ja: 'そっと催促' ,
    fr: 'Relancer' },
  'Silenzia': { en: 'Mute', es: 'Silenciar', de: 'Stumm', ja: '通知オフ' ,
    fr: 'Mettre en sourdine' },
  'Avvisami': { en: 'Let me know', es: 'Avísame', de: 'Sag mir Bescheid', ja: '知らせて' ,
    fr: 'Préviens-moi' },
  'Passa ★': { en: 'Make it ★', es: 'Pasar a ★', de: 'Zu ★ machen', ja: '★ にする' ,
    fr: 'Passer ★' },

  /* ------------------------------------------------ navigazione e sezioni */
  'Gruppi': { en: 'Groups', es: 'Grupos', de: 'Gruppen', ja: 'グループ' ,
    fr: 'Groupes' },
  'gruppi': { en: 'groups', es: 'grupos', de: 'Gruppen', ja: 'グループ' ,
    fr: 'groupes' },
  'Novità': { en: 'News', es: 'Novedades', de: 'Neues', ja: '新着' ,
    fr: 'Quoi de neuf' },
  'Persone': { en: 'People', es: 'Personas', de: 'Leute', ja: 'メンバー' ,
    fr: 'Personnes' },
  'Account': { en: 'Account', es: 'Cuenta', de: 'Konto', ja: 'アカウント' ,
    fr: 'Compte' },
  'Opzioni': { en: 'Options', es: 'Opciones', de: 'Optionen', ja: '設定' ,
    fr: 'Options' },
  'Commenti': { en: 'Comments', es: 'Comentarios', de: 'Kommentare', ja: 'コメント' ,
    fr: 'Commentaires' },
  'Spese': { en: 'Expenses', es: 'Gastos', de: 'Ausgaben', ja: '費用' ,
    fr: 'Dépenses' },
  'Saldi': { en: 'Balances', es: 'Saldos', de: 'Salden', ja: '精算' ,
    fr: 'Soldes' },
  'Storico': { en: 'History', es: 'Historial', de: 'Verlauf', ja: '履歴' ,
    fr: 'Historique' },
  'Allegati': { en: 'Attachments', es: 'Adjuntos', de: 'Anhänge', ja: '添付' ,
    fr: 'Pièces jointes' },
  'Allegati e foto': { en: 'Attachments and photos', es: 'Adjuntos y fotos',
                       de: 'Anhänge und Fotos', ja: '添付と写真' ,
    fr: 'Pièces jointes et photos' },
  'Contenuti': { en: 'Content', es: 'Contenidos', de: 'Inhalte', ja: 'コンテンツ' ,
    fr: 'Contenus' },
  'I miei posti': { en: 'My places', es: 'Mis sitios', de: 'Meine Orte', ja: '自分の場所' ,
    fr: 'Mes lieux' },
  'Calendario': { en: 'Calendar', es: 'Calendario', de: 'Kalender', ja: 'カレンダー' ,
    fr: 'Calendrier' },
  'Calendario di sistema': { en: 'System calendar', es: 'Calendario del sistema',
                             de: 'Systemkalender', ja: '端末のカレンダー' ,
    fr: 'Calendrier système' },
  'Mese precedente': { en: 'Previous month', es: 'Mes anterior',
                       de: 'Voriger Monat', ja: '前の月' ,
    fr: 'Mois précédent' },
  'Mese successivo': { en: 'Next month', es: 'Mes siguiente',
                       de: 'Nächster Monat', ja: '次の月' ,
    fr: 'Mois suivant' },
  'Niente in programma': { en: 'Nothing on', es: 'Nada previsto',
                           de: 'Nichts geplant', ja: '予定はありません' ,
    fr: 'Rien au programme' },
  'organizzati': { en: 'organised', es: 'organizados', de: 'organisiert', ja: '企画済み' ,
    fr: 'organisés' },

  /* ------------------------------------------------- creazione di un piano */
  'Cosa organizzi?': { en: 'What are you organising?', es: '¿Qué organizas?',
                       de: 'Was organisierst du?', ja: '何を企画しますか？' ,
    fr: 'Qu’est-ce que tu organises ?' },
  'Cena sabato': { en: 'Dinner on Saturday', es: 'Cena el sábado',
                   de: 'Essen am Samstag', ja: '土曜の夕食' ,
    fr: 'Dîner samedi' },
  /* I suggerimenti rapidi del titolo: erano scolpiti in italiano nel codice
     e comparivano tali e quali anche nell'app in tedesco (27/8/2026). */
  'Weekend al mare': { en: 'Weekend at the beach', es: 'Finde en la playa',
                       de: 'Wochenende am Meer', ja: '海で週末' ,
    fr: 'Week-end à la mer' },
  'Calcetto': { en: 'Five-a-side', es: 'Futbito', de: 'Kicken', ja: 'フットサル' ,
    fr: 'Foot à cinq' },
  'Compleanno di Anna': { en: 'Anna’s birthday', es: 'Cumpleaños de Anna',
                          de: 'Annas Geburtstag', ja: 'アンナの誕生日' ,
    fr: 'Anniversaire d’Anna' },
  'Giappone 2027': { en: 'Japan 2027', es: 'Japón 2027', de: 'Japan 2027', ja: '日本 2027' ,
    fr: 'Japon 2027' },
  'Da me': { en: 'At my place', es: 'En mi casa', de: 'Bei mir', ja: 'うちで' ,
    fr: 'Chez moi' },
  'Weekend': { en: 'Weekend', es: 'Finde', de: 'Wochenende', ja: '週末' ,
    fr: 'Week-end' },
  'Cambia emoji': { en: 'Change emoji', es: 'Cambiar emoji',
                    de: 'Emoji ändern', ja: '絵文字を変える' ,
    fr: 'Changer l’emoji' },
  'So già': { en: 'I already know', es: 'Ya lo sé', de: 'Weiß ich schon', ja: 'もう決まっている' ,
    fr: 'Je sais déjà' },
  'Decidiamo insieme': { en: 'Let’s decide together', es: 'Lo decidimos juntos',
                         de: 'Entscheiden wir gemeinsam', ja: 'みんなで決める' ,
    fr: 'On décide ensemble' },
  'Inizio': { en: 'Start', es: 'Inicio', de: 'Beginn', ja: '開始' ,
    fr: 'Début' },
  'Fine': { en: 'End', es: 'Fin', de: 'Ende', ja: '終了' ,
    fr: 'Fin' },
  '(facoltativa)': { en: '(optional)', es: '(opcional)', de: '(optional)', ja: '（任意）' ,
    fr: '(facultatif)' },
  'Titolo (facoltativo)': { en: 'Title (optional)', es: 'Título (opcional)',
                            de: 'Titel (optional)', ja: 'タイトル（任意）' ,
    fr: 'Titre (facultatif)' },
  'Si ripete': { en: 'Repeats', es: 'Se repite', de: 'Wiederholt sich', ja: '繰り返し' ,
    fr: 'Se répète' },
  'Quante volte': { en: 'How many times', es: 'Cuántas veces',
                    de: 'Wie oft', ja: '回数' ,
    fr: 'Combien de fois' },
  'Luogo': { en: 'Place', es: 'Sitio', de: 'Ort', ja: '場所' ,
    fr: 'Lieu' },
  'Indirizzo': { en: 'Address', es: 'Dirección', de: 'Adresse', ja: '住所' ,
    fr: 'Adresse' },
  'Indirizzo (facoltativo)': { en: 'Address (optional)', es: 'Dirección (opcional)',
                               de: 'Adresse (optional)', ja: '住所（任意）' ,
    fr: 'Adresse (facultative)' },
  'nome, indirizzo, menu': { en: 'name, address, menu', es: 'nombre, dirección, menú',
                             de: 'Name, Adresse, Karte', ja: '名前、住所、メニュー' ,
    fr: 'nom, adresse, menu' },
  'Pizza / Sushi / Carne': { en: 'Pizza / Sushi / Grill', es: 'Pizza / Sushi / Carne',
                             de: 'Pizza / Sushi / Fleisch', ja: 'ピザ／寿司／焼肉' ,
    fr: 'Pizza / Sushi / Viande' },
  'Mare / Montagna / Città': { en: 'Seaside / Mountains / City',
    es: 'Playa / Montaña / Ciudad', de: 'Meer / Berge / Stadt', ja: '海／山／街' ,
    fr: 'Mer / Montagne / Ville' },
  'es. "Cosa portiamo?"': { en: 'e.g. “What shall we bring?”',
    es: 'ej. «¿Qué llevamos?»', de: 'z.B. „Was bringen wir mit?“',
    ja: '例：「何を持っていく？」' ,
    fr: 'ex. « On apporte quoi ? »' },
  'Un\'opzione': { en: 'One option', es: 'Una opción', de: 'Eine Option', ja: '選択肢' ,
    fr: 'Une option' },
  'Scelta tra opzioni': { en: 'Pick between options', es: 'Elección entre opciones',
                          de: 'Auswahl zwischen Optionen', ja: '候補から選ぶ' ,
    fr: 'Choix entre options' },
  'Sì o No': { en: 'Yes or No', es: 'Sí o No', de: 'Ja oder Nein', ja: 'はい／いいえ' ,
    fr: 'Oui ou Non' },
  '👍 Sì': { en: '👍 Yes', es: '👍 Sí', de: '👍 Ja', ja: '👍 はい' ,
    fr: '👍 Oui' },
  '👎 No': { en: '👎 No', es: '👎 No', de: '👎 Nein', ja: '👎 いいえ' ,
    fr: '👎 Non' },
  'Fra 2 giorni alle 18:00': { en: 'In 2 days at 18:00', es: 'Dentro de 2 días a las 18:00',
                               de: 'In 2 Tagen um 18:00', ja: '2 日後の 18:00' ,
    fr: 'Dans 2 jours à 18:00' },
  'Massimo di persone': { en: 'Maximum number of people', es: 'Máximo de personas',
                          de: 'Höchstzahl an Personen', ja: '人数の上限' ,
    fr: 'Maximum de personnes' },
  'Aggiungi un nome': { en: 'Add a name', es: 'Añadir un nombre',
                        de: 'Namen hinzufügen', ja: '名前を追加' ,
    fr: 'Ajouter un nom' },
  '＋ Nuova': { en: '＋ New', es: '＋ Nueva', de: '＋ Neu', ja: '＋ 新規' ,
    fr: '＋ Nouvelle' },
  '＋ Nuovo ospite (web)': { en: '＋ New guest (web)', es: '＋ Invitado nuevo (web)',
                            de: '＋ Neuer Gast (Web)', ja: '＋ 新しいゲスト（ウェブ）' ,
    fr: '＋ Nouvel invité (web)' },
  'Icona': { en: 'Icon', es: 'Icono', de: 'Symbol', ja: 'アイコン' ,
    fr: 'Icône' },
  'Colore': { en: 'Colour', es: 'Color', de: 'Farbe', ja: '色' ,
    fr: 'Couleur' },
  'Icona, colore, nome, sezione': { en: 'Icon, colour, name, section',
    es: 'Icono, color, nombre, sección', de: 'Symbol, Farbe, Name, Bereich',
    ja: 'アイコン、色、名前、セクション' ,
    fr: 'Icône, couleur, nom, section' },

  /* ------------------------------------------------- il piano, giorno per giorno */
  'In decisione': { en: 'Being decided', es: 'En decisión',
                    de: 'Wird entschieden', ja: '決定中' ,
    fr: 'En décision' },
  'Il tuo piano': { en: 'Your plan', es: 'Tu plan', de: 'Dein Plan', ja: 'あなたの予定' ,
    fr: 'Ton plan' },
  'La tua decisione': { en: 'Your decision', es: 'Tu decisión',
                        de: 'Deine Entscheidung', ja: 'あなたの決めごと' ,
    fr: 'Ta décision' },
  // Due numeri: vanno da segnaposto, così ogni lingua li mette dove le servono
  // — in giapponese il conteggio precede il verbo e la frase si ribalta.
  '{n} su {tot} hanno votato': {
    en: '{n} of {tot} have voted', es: '{n} de {tot} han votado',
    de: '{n} von {tot} haben abgestimmt', ja: '{tot} 人中 {n} 人が投票済み'
  ,
    fr: '{n} sur {tot} ont voté' },
  'In decisione · {n} su {tot} hanno votato': {
    en: 'Being decided · {n} of {tot} have voted',
    es: 'En decisión · {n} de {tot} han votado',
    de: 'Wird entschieden · {n} von {tot} haben abgestimmt',
    ja: '決定中 · {tot} 人中 {n} 人が投票済み'
  ,
    fr: 'En décision · {n} sur {tot} ont voté' },
  'Annullato': { en: 'Called off', es: 'Cancelado', de: 'Abgesagt', ja: '中止' ,
    fr: 'Annulé' },
  'Kimari!': { en: 'Kimari!', es: '¡Kimari!', de: 'Kimari!', ja: 'Kimari！' ,
    fr: 'Kimari!' },
  'Ci sei?': { en: 'Are you in?', es: '¿Te apuntas?', de: 'Bist du dabei?', ja: '参加しますか？' ,
    fr: 'Tu en es ?' },
  'Le altre date': { en: 'The other dates', es: 'Las otras fechas',
                     de: 'Die anderen Termine', ja: 'ほかの日程' ,
    fr: 'Les autres dates' },
  'Orario': { en: 'Time', es: 'Hora', de: 'Uhrzeit', ja: '時刻' ,
    fr: 'Horaire' },
  'Il link': { en: 'The link', es: 'El enlace', de: 'Der Link', ja: 'リンク' ,
    fr: 'Le lien' },
  'Copia messaggio': { en: 'Copy the message', es: 'Copiar el mensaje',
                       de: 'Nachricht kopieren', ja: 'メッセージをコピー' ,
    fr: 'Copier le message' },
  'Condividi su WhatsApp': { en: 'Share on WhatsApp', es: 'Compartir por WhatsApp',
                             de: 'Auf WhatsApp teilen', ja: 'WhatsApp で共有' ,
    fr: 'Partager sur WhatsApp' },
  'Invita un amico su WhatsApp': { en: 'Invite a friend on WhatsApp',
    es: 'Invitar a un amigo por WhatsApp', de: 'Freund über WhatsApp einladen',
    ja: 'WhatsApp で友だちを誘う' ,
    fr: 'Inviter un ami sur WhatsApp' },
  'Revoca il link': { en: 'Revoke the link', es: 'Revocar el enlace',
                      de: 'Link widerrufen', ja: 'リンクを無効にする' ,
    fr: 'Révoquer le lien' },
  'Revoca il link d\'invito': { en: 'Revoke the invite link', es: 'Revocar el enlace de invitación',
                                de: 'Einladungslink widerrufen', ja: '招待リンクを無効にする' ,
    fr: 'Révoquer le lien d’invitation' },
  'Apri in Mappe': { en: 'Open in Maps', es: 'Abrir en Mapas',
                     de: 'In Karten öffnen', ja: 'マップで開く' ,
    fr: 'Ouvrir dans Maps' },
  'Apri la decisione': { en: 'Open the decision', es: 'Abrir la decisión',
                         de: 'Entscheidung öffnen', ja: '決めごとを開く' ,
    fr: 'Ouvrir la décision' },
  'Arrivo in ritardo': { en: 'I’ll be late', es: 'Llego tarde',
                         de: 'Ich komme später', ja: '遅れて行きます' ,
    fr: 'J’arrive en retard' },
  'Imprevisti dell\'ultimo minuto': { en: 'Last-minute hitches',
    es: 'Imprevistos de última hora', de: 'Was kurzfristig dazwischenkommt',
    ja: '直前のトラブル' ,
    fr: 'Imprévus de dernière minute' },
  'Se salta': { en: 'If it falls through', es: 'Si se cae',
                de: 'Wenn es platzt', ja: '中止になったら' ,
    fr: 'Si ça tombe à l’eau' },
  'Un motivo, se vuoi': { en: 'A reason, if you like', es: 'Un motivo, si quieres',
                          de: 'Ein Grund, wenn du magst', ja: '理由（任意）' ,
    fr: 'Une raison, si tu veux' },
  'Perché': { en: 'Why', es: 'Por qué', de: 'Warum', ja: '理由' ,
    fr: 'Pourquoi' },
  'Com\'è andata': { en: 'How it went', es: 'Qué tal fue',
                     de: 'Wie es war', ja: 'どうだった' ,
    fr: 'Comment ça s’est passé' },
  'Ho prenotato': { en: 'I’ve booked', es: 'He reservado',
                    de: 'Ich habe reserviert', ja: '予約しました' ,
    fr: 'J’ai réservé' },
  'Proponi un cambio': { en: 'Suggest a change', es: 'Proponer un cambio',
                         de: 'Änderung vorschlagen', ja: '変更を提案' ,
    fr: 'Proposer un changement' },
  'Proponi un\'altra opzione': { en: 'Suggest another option',
    es: 'Proponer otra opción', de: 'Andere Option vorschlagen', ja: '別の候補を提案' ,
    fr: 'Proposer une autre option' },
  'Ritira la proposta': { en: 'Withdraw the suggestion', es: 'Retirar la propuesta',
                          de: 'Vorschlag zurückziehen', ja: '提案を取り下げる' ,
    fr: 'Retirer la proposition' },
  'Ricevi il risultato': { en: 'Get the result', es: 'Recibe el resultado',
                           de: 'Ergebnis bekommen', ja: '結果を受け取る' ,
    fr: 'Recevoir le résultat' },
  'Nota (es. chiedi il tavolo fuori)': { en: 'Note (e.g. ask for a table outside)',
    es: 'Nota (ej. pide mesa fuera)', de: 'Notiz (z.B. nach einem Tisch draußen fragen)',
    ja: 'メモ（例：外の席をお願い）' ,
    fr: 'Note (ex. demande la table dehors)' },

  /* ------------------------------------------------------- soldi e allegati */
  'Aggiungi spesa': { en: 'Add an expense', es: 'Añadir gasto',
                      de: 'Ausgabe hinzufügen', ja: '費用を追加' ,
    fr: 'Ajouter une dépense' },
  'Importo': { en: 'Amount', es: 'Importe', de: 'Betrag', ja: '金額' ,
    fr: 'Montant' },
  'Ha pagato': { en: 'Paid by', es: 'Ha pagado', de: 'Bezahlt von', ja: '支払った人' ,
    fr: 'A payé' },
  'Diviso tra': { en: 'Split between', es: 'Dividido entre',
                  de: 'Geteilt unter', ja: '分担する人' ,
    fr: 'Partagé entre' },
  'Cosa (es. cena, benzina, casa)': { en: 'What for (e.g. dinner, petrol, the house)',
    es: 'Concepto (ej. cena, gasolina, casa)', de: 'Wofür (z.B. Essen, Benzin, Haus)',
    ja: '内容（例：夕食、ガソリン、宿）' ,
    fr: 'Quoi (ex. dîner, essence, maison)' },
  'Aggiungi un link': { en: 'Add a link', es: 'Añadir un enlace',
                        de: 'Link hinzufügen', ja: 'リンクを追加' ,
    fr: 'Ajouter un lien' },
  '🔗 Link': { en: '🔗 Link', es: '🔗 Enlace', de: '🔗 Link', ja: '🔗 リンク' ,
    fr: '🔗 Lien' },
  '📎 Allegato': { en: '📎 Attachment', es: '📎 Adjunto', de: '📎 Anhang', ja: '📎 添付' ,
    fr: '📎 Pièce jointe' },
  'https://…': { en: 'https://…', es: 'https://…', de: 'https://…', ja: 'https://…' ,
    fr: 'https://…' },
  'Copertina': { en: 'Cover', es: 'Portada', de: 'Titelbild', ja: 'カバー' ,
    fr: 'Couverture' },

  /* -------------------------------------------------- profilo e impostazioni */
  'Modifica profilo': { en: 'Edit profile', es: 'Editar perfil',
                        de: 'Profil bearbeiten', ja: 'プロフィールを編集' ,
    fr: 'Modifier le profil' },
  'Lingua': { en: 'Language', es: 'Idioma', de: 'Sprache', ja: '言語' ,
    fr: 'Langue' },
  'Italiano': { en: 'Italian', es: 'Italiano', de: 'Italienisch', ja: 'イタリア語' ,
    fr: 'Italien' },
  'Notifiche push': { en: 'Push notifications', es: 'Notificaciones push',
                      de: 'Push-Benachrichtigungen', ja: 'プッシュ通知' ,
    fr: 'Notifications push' },
  'Niente push, ma le novità restano': { en: 'No push, but the news stays',
    es: 'Sin notificaciones, pero las novedades se quedan',
    de: 'Kein Push, aber das Neue bleibt', ja: 'プッシュは届きませんが、新着には残ります' ,
    fr: 'Pas de push, mais les nouveautés restent' },
  'Esporta i miei dati': { en: 'Export my data', es: 'Exportar mis datos',
                           de: 'Meine Daten exportieren', ja: 'データを書き出す' ,
    fr: 'Exporter mes données' },
  'Elimina account': { en: 'Delete account', es: 'Eliminar cuenta',
                       de: 'Konto löschen', ja: 'アカウントを削除' ,
    fr: 'Supprimer le compte' },
  'Cancellazione': { en: 'Deletion', es: 'Eliminación', de: 'Löschung', ja: '削除について' ,
    fr: 'Suppression' },
  'Cosa raccogliamo': { en: 'What we collect', es: 'Qué recogemos',
                        de: 'Was wir erheben', ja: '取得する情報' ,
    fr: 'Ce qu’on collecte' },
  'Gruppi privati': { en: 'Private groups', es: 'Grupos privados',
                      de: 'Private Gruppen', ja: '非公開グループ' ,
    fr: 'Groupes privés' },
  'Termini, privacy ed età': { en: 'Terms, privacy and age',
    es: 'Términos, privacidad y edad', de: 'Bedingungen, Datenschutz und Alter',
    ja: '規約・プライバシー・年齢' ,
    fr: 'Conditions, confidentialité et âge' },
  'Termini, privacy ed età minima': { en: 'Terms, privacy and minimum age',
    es: 'Términos, privacidad y edad mínima', de: 'Bedingungen, Datenschutz und Mindestalter',
    ja: '規約・プライバシー・年齢制限' ,
    fr: 'Conditions, confidentialité et âge minimum' },
  'Età minima 16 anni.': { en: 'Minimum age 16.', es: 'Edad mínima 16 años.',
                           de: 'Mindestalter 16 Jahre.', ja: '16 歳以上が対象です。' ,
    fr: 'Âge minimum : 16 ans.' },
  'In breve, il testo vero lo scrive un avvocato.': {
    en: 'The short version — the real text is written by a lawyer.',
    es: 'En resumen; el texto de verdad lo escribe un abogado.',
    de: 'Kurz gefasst — den echten Text schreibt ein Anwalt.',
    ja: '要点だけです。正式な文面は弁護士が作成します。'
  ,
    fr: 'En bref ; le vrai texte, c’est un avocat qui l’écrit.' },
  'Kimari Unlimited': { en: 'Kimari Unlimited', es: 'Kimari Unlimited',
                        de: 'Kimari Unlimited', ja: 'Kimari Unlimited' ,
    fr: 'Kimari Unlimited' },
  'Unlimited': { en: 'Unlimited', es: 'Unlimited', de: 'Unlimited', ja: 'Unlimited' ,
    fr: 'Unlimited' },
  'Pass evento singolo': { en: 'Single-event pass', es: 'Pase de evento único',
                           de: 'Pass für ein einzelnes Event', ja: 'イベント単発パス' ,
    fr: 'Pass événement unique' },
  'Prototipo': { en: 'Prototype', es: 'Prototipo', de: 'Prototyp', ja: 'プロトタイプ' ,
    fr: 'Prototype' },
  'Kimari · prototipo app': { en: 'Kimari · app prototype', es: 'Kimari · prototipo de app',
                              de: 'Kimari · App-Prototyp', ja: 'Kimari · アプリのプロトタイプ' ,
    fr: 'Kimari · prototype de l’app' },

  /* ------------------------------------------------- app: gruppi e sezioni */
  'Nome del gruppo': { en: 'Group name', es: 'Nombre del grupo',
                       de: 'Name der Gruppe', ja: 'グループ名' ,
    fr: 'Nom du groupe' },
  'La tua sezione': { en: 'Your section', es: 'Tu sección',
                      de: 'Dein Bereich', ja: 'あなたのセクション' ,
    fr: 'Ta section' },
  'Nessuna': { en: 'None', es: 'Ninguna', de: 'Keiner', ja: 'なし' ,
    fr: 'Aucune' },
  'Nome della sezione, es. Milano': { en: 'Section name, e.g. Milan',
    es: 'Nombre de la sección, ej. Milán', de: 'Name des Bereichs, z.B. Mailand',
    ja: 'セクション名（例：ミラノ）' ,
    fr: 'Nom de la section, ex. Milan' },
  'Le sezioni sono solo tue: gli altri membri ordinano i gruppi a modo loro.': {
    en: 'Sections are yours alone — the other members sort their groups their own way.',
    es: 'Las secciones son solo tuyas: los demás miembros ordenan los grupos a su manera.',
    de: 'Bereiche gehören dir allein — die anderen Mitglieder ordnen ihre Gruppen, wie sie wollen.',
    ja: 'セクションはあなただけのものです。ほかのメンバーは自分のやり方でグループを並べます。'
  ,
    fr: 'Les sections ne sont qu’à toi : les autres membres rangent les groupes à leur façon.' },
  '★ amici. Gli altri si aggiungono anche dopo, con il link d\'invito.': {
    en: '★ friends. The others can join later, with the invite link.',
    es: '★ amigos. Los demás pueden entrar después, con el enlace de invitación.',
    de: '★ Freunde. Die anderen kommen auch später dazu, über den Einladungslink.',
    ja: '★ 友だち。ほかの人は招待リンクであとからでも参加できます。'
  ,
    fr: '★ amis. Les autres peuvent s’ajouter plus tard, avec le lien d’invitation.' },
  'Amici': { en: 'Friends', es: 'Amigos', de: 'Freunde', ja: '友だち' ,
    fr: 'Amis' },
  'amici': { en: 'friends', es: 'amigos', de: 'Freunde', ja: '友だち' ,
    fr: 'amis' },
  'piani': { en: 'plans', es: 'planes', de: 'Pläne', ja: '予定' ,
    fr: 'plans' },
  'Aggiungi amici': { en: 'Add friends', es: 'Añadir amigos',
                      de: 'Freunde hinzufügen', ja: '友だちを追加' ,
    fr: 'Ajouter des amis' },
  'Aggiungi un posto': { en: 'Add a place', es: 'Añadir un sitio',
                         de: 'Ort hinzufügen', ja: '場所を追加' ,
    fr: 'Ajouter un lieu' },
  '★ È tra i tuoi posti': { en: '★ It’s among your places', es: '★ Está entre tus sitios',
                            de: '★ Ist unter deinen Orten', ja: '★ 保存済みの場所です' ,
    fr: '★ C’est dans tes lieux' },
  '☆ Salva tra i miei posti': { en: '☆ Save to my places', es: '☆ Guardar en mis sitios',
                                de: '☆ Zu meinen Orten', ja: '☆ 自分の場所に保存' ,
    fr: '☆ Enregistrer dans mes lieux' },

  /* -------------------------------------------------- app: piano e conti */
  'Modifica il piano': { en: 'Edit the plan', es: 'Editar el plan',
                         de: 'Plan bearbeiten', ja: '予定を編集' ,
    fr: 'Modifier le plan' },
  'Opzioni del piano': { en: 'Plan options', es: 'Opciones del plan',
                         de: 'Optionen des Plans', ja: '予定の設定' ,
    fr: 'Options du plan' },
  'Salva e avvisa il gruppo': { en: 'Save and tell the group',
    es: 'Guardar y avisar al grupo', de: 'Speichern und der Gruppe Bescheid geben',
    ja: '保存してみんなに知らせる' ,
    fr: 'Enregistrer et prévenir le groupe' },
  'Chi viene': { en: 'Who’s coming', es: 'Quién viene', de: 'Wer kommt', ja: '参加する人' ,
    fr: 'Qui vient' },
  'Ci sono ✓': { en: 'I’m in ✓', es: 'Voy ✓', de: 'Ich bin dabei ✓', ja: '参加する ✓' ,
    fr: 'J’en suis ✓' },
  'Segna pagato': { en: 'Mark as paid', es: 'Marcar como pagado',
                    de: 'Als bezahlt markieren', ja: '支払い済みにする' ,
    fr: 'Marquer payé' },
  'Il link resta valido e mostra a tutti che è saltato. Nessuno perde i messaggi né le spese.': {
    en: 'The link still works and shows everyone it’s off. Nobody loses the messages or the expenses.',
    es: 'El enlace sigue siendo válido y muestra a todos que se ha cancelado. Nadie pierde los mensajes ni los gastos.',
    de: 'Der Link bleibt gültig und zeigt allen, dass es abgesagt ist. Niemand verliert Nachrichten oder Ausgaben.',
    ja: 'リンクはそのまま使え、中止になったことがみんなに表示されます。メッセージも費用も失われません。'
  ,
    fr: 'Le lien reste valide et montre à tous que c’est annulé. Personne ne perd les messages ni les dépenses.' },
  'Questo link resta sempre aggiornato: se qualcosa cambia, lo vedi qui con la versione nuova.': {
    en: 'This link stays up to date: if anything changes, you see it here in the new version.',
    es: 'Este enlace se mantiene al día: si algo cambia, lo ves aquí en la versión nueva.',
    de: 'Dieser Link bleibt aktuell: Ändert sich etwas, siehst du es hier in der neuen Fassung.',
    ja: 'このリンクは常に最新です。何か変わったら、新しい版としてここに表示されます。'
  ,
    fr: 'Ce lien reste toujours à jour : si quelque chose change, tu le vois ici avec la nouvelle version.' },
  'Questo link non porta a nessun piano. Chiedi all\'organizzatore di rimandartelo.': {
    en: 'This link doesn’t lead to any plan. Ask whoever organised it to send it again.',
    es: 'Este enlace no lleva a ningún plan. Pídele a quien lo organiza que te lo reenvíe.',
    de: 'Dieser Link führt zu keinem Plan. Bitte die Person, die organisiert, ihn noch mal zu schicken.',
    ja: 'このリンクはどの予定にもつながっていません。幹事の方にもう一度送ってもらってください。'
  ,
    fr: 'Ce lien ne mène à aucun plan. Demande à l’organisateur de te le renvoyer.' },

  /* ---------------------------------------- app: account, privacy, limiti */
  'Hai partecipato dal web?': { en: 'Did you take part from the web?',
    es: '¿Participaste desde la web?', de: 'Warst du übers Web dabei?',
    ja: 'ウェブから参加しましたか？' ,
    fr: 'Tu as participé depuis le web ?' },
  'Niente account: il nome serve solo agli amici per sapere chi ha risposto.': {
    en: 'No account: the name is just so your friends know who answered.',
    es: 'Sin cuenta: el nombre solo sirve para que tus amigos sepan quién respondió.',
    de: 'Kein Konto: Der Name ist nur da, damit deine Freunde wissen, wer geantwortet hat.',
    ja: 'アカウントは不要です。名前は、だれが答えたかを友だちが分かるためだけのものです。'
  ,
    fr: 'Pas de compte : le nom sert juste aux amis pour savoir qui a répondu.' },
  'Eliminare l\'account cancella profilo, voti e risposte. Nei piani a cui hai partecipato resti come «Membro eliminato», così agli altri non spariscono i conti e i messaggi.': {
    en: 'Deleting your account removes your profile, votes and answers. In the plans you took part in you stay as “Deleted member”, so the others don’t lose their tallies and messages.',
    es: 'Eliminar la cuenta borra tu perfil, tus votos y tus respuestas. En los planes en los que participaste quedas como «Miembro eliminado», para que los demás no pierdan las cuentas ni los mensajes.',
    de: 'Das Löschen deines Kontos entfernt Profil, Stimmen und Antworten. In den Plänen, an denen du teilgenommen hast, bleibst du als „Gelöschtes Mitglied“, damit den anderen Abrechnungen und Nachrichten nicht verschwinden.',
    ja: 'アカウントを削除すると、プロフィール・投票・回答が消えます。参加した予定では「退会したメンバー」として残るので、ほかの人の精算やメッセージは失われません。'
  ,
    fr: 'Supprimer le compte efface profil, votes et réponses. Dans les plans où tu as participé, tu restes « Membre supprimé », pour que les comptes et les messages des autres ne disparaissent pas.' },
  'Dall\'app o dal web. Lo storico condiviso resta come «Membro eliminato».': {
    en: 'From the app or the web. Shared history stays as “Deleted member”.',
    es: 'Desde la app o la web. El historial compartido queda como «Miembro eliminado».',
    de: 'Aus der App oder im Web. Der geteilte Verlauf bleibt als „Gelöschtes Mitglied“.',
    ja: 'アプリからでもウェブからでも。共有された履歴は「退会したメンバー」として残ります。'
  ,
    fr: 'Depuis l’app ou le web. L’historique partagé reste comme « Membre supprimé ».' },
  'Chi ha meno di 16 anni non può creare un account. Nei gruppi famiglia i nomi dei minori restano solo come nomi, senza altri dati.': {
    en: 'Under-16s can’t create an account. In family groups, children’s names stay as names only, with no other data.',
    es: 'Los menores de 16 años no pueden crear una cuenta. En los grupos familiares los nombres de los menores se quedan solo como nombres, sin más datos.',
    de: 'Unter 16 kann man kein Konto anlegen. In Familiengruppen bleiben die Namen von Kindern nur Namen, ohne weitere Daten.',
    ja: '16 歳未満の方はアカウントを作成できません。家族グループでは、お子さんの名前は名前としてだけ残り、ほかの情報は保存しません。'
  ,
    fr: 'Les moins de 16 ans ne peuvent pas créer de compte. Dans les groupes famille, les noms des mineurs restent de simples noms, sans autres données.' },
  'Nome, email se la dai, voti, risposte, commenti, allegati e foto che carichi. Niente rubrica, niente posizione in background.': {
    en: 'Your name, your email if you give it, votes, answers, comments, attachments and photos you upload. No address book, no background location.',
    es: 'Tu nombre, tu correo si lo das, votos, respuestas, comentarios, adjuntos y fotos que subas. Sin agenda, sin ubicación en segundo plano.',
    de: 'Dein Name, deine E-Mail falls du sie angibst, Stimmen, Antworten, Kommentare, Anhänge und Fotos, die du hochlädst. Kein Adressbuch, kein Standort im Hintergrund.',
    ja: '名前、（提供された場合は）メールアドレス、投票、回答、コメント、添付ファイル、アップロードした写真。連絡先やバックグラウンドの位置情報は取得しません。'
  ,
    fr: 'Ton nom, l’e-mail si tu le donnes, votes, réponses, commentaires, pièces jointes et photos que tu charges. Pas de contacts, pas de position en arrière-plan.' },
  'Si entra solo su invito. Chi non è in un piano non ne vede nulla.': {
    en: 'You get in by invitation only. Anyone not in a plan sees nothing of it.',
    es: 'Solo se entra por invitación. Quien no está en un plan no ve nada de él.',
    de: 'Zutritt nur auf Einladung. Wer nicht in einem Plan ist, sieht nichts davon.',
    ja: '参加は招待からのみです。予定に入っていない人には、その中身は一切見えません。'
  ,
    fr: 'On n’entre que sur invitation. Qui n’est pas dans un plan n’en voit rien.' },
  'Gli admin possono rimuovere commenti, allegati e persone. Puoi segnalare un contenuto o bloccare una persona.': {
    en: 'Admins can remove comments, attachments and people. You can report content or block a person.',
    es: 'Los admins pueden quitar comentarios, adjuntos y personas. Puedes denunciar contenido o bloquear a alguien.',
    de: 'Admins können Kommentare, Anhänge und Personen entfernen. Du kannst Inhalte melden oder jemanden blockieren.',
    ja: '管理者はコメント・添付・メンバーを削除できます。内容の報告や、特定の人のブロックもできます。'
  ,
    fr: 'Les admins peuvent retirer commentaires, pièces jointes et personnes. Tu peux signaler un contenu ou bloquer quelqu’un.' },
  'Cosa succede nei tuoi gruppi e nei piani in cui sei. Solo lì: chi non è in un piano non ne vede nulla. Le push le scegli tu nel Profilo; qui resta tutto.': {
    en: 'What’s happening in your groups and the plans you’re in. Only there: anyone not in a plan sees nothing of it. You choose the push notifications in your Profile; here everything stays.',
    es: 'Lo que pasa en tus grupos y en los planes en los que estás. Solo ahí: quien no está en un plan no ve nada de él. Las notificaciones las eliges tú en el Perfil; aquí se queda todo.',
    de: 'Was in deinen Gruppen und den Plänen passiert, in denen du bist. Nur dort: Wer nicht in einem Plan ist, sieht nichts davon. Die Push-Nachrichten wählst du im Profil; hier bleibt alles.',
    ja: 'あなたのグループと、参加している予定での出来事です。そこだけ——予定に入っていない人には何も見えません。プッシュ通知はプロフィールで選べます。ここにはすべて残ります。'
  ,
    fr: 'Ce qui se passe dans tes groupes et dans les plans où tu es. Seulement là : qui n’est pas dans un plan n’en voit rien. Les push, tu les choisis dans le Profil ; ici tout reste.' },
  'I limiti valgono per piano e li sblocca l\'Unlimited di chi organizza: paga uno, respira tutto il gruppo.': {
    en: 'The limits apply per plan and are lifted by the organiser’s Unlimited: one person pays, the whole group breathes.',
    es: 'Los límites son por plan y los desbloquea el Unlimited de quien organiza: paga uno, respira todo el grupo.',
    de: 'Die Grenzen gelten pro Plan und werden vom Unlimited der organisierenden Person aufgehoben: Einer zahlt, die ganze Gruppe atmet auf.',
    ja: '上限は予定ごとで、幹事の Unlimited で解除されます。ひとりが払えば、グループ全員が楽になります。'
  ,
    fr: 'Les limites valent par plan et l’Unlimited de l’organisateur les débloque : un seul paie, tout le groupe respire.' },
  '4,99 € una volta · un solo piano con limiti Unlimited: matrimoni, feste grandi, viaggi': {
    en: '€4.99 once · a single plan with Unlimited limits: weddings, big parties, trips',
    es: '4,99 € una vez · un solo plan con límites Unlimited: bodas, fiestas grandes, viajes',
    de: '4,99 € einmalig · ein einzelner Plan mit Unlimited-Grenzen: Hochzeiten, große Feste, Reisen',
    ja: '4,99 ユーロ 一回きり · 予定ひとつだけ Unlimited の上限に：結婚式、大きなパーティー、旅行'
  ,
    fr: '4,99 € une fois · un seul plan avec les limites Unlimited : mariages, grandes fêtes, voyages' },

  /* ------------------------------------------- app: parole corte e titoli */
  'Nuovo gruppo': { en: 'New group', es: 'Grupo nuevo', de: 'Neue Gruppe', ja: '新しいグループ' ,
    fr: 'Nouveau groupe' },
  'Icona del gruppo': { en: 'Group icon', es: 'Icono del grupo',
                        de: 'Gruppensymbol', ja: 'グループのアイコン' ,
    fr: 'Icône du groupe' },
  'I tuoi piani': { en: 'Your plans', es: 'Tus planes', de: 'Deine Pläne', ja: 'あなたの予定' ,
    fr: 'Tes plans' },
  'Come ti chiami?': { en: 'What’s your name?', es: '¿Cómo te llamas?',
                       de: 'Wie heißt du?', ja: 'お名前は？' ,
    fr: 'Comment tu t’appelles ?' },
  'Con chi?': { en: 'With whom?', es: '¿Con quién?', de: 'Mit wem?', ja: 'だれと？' ,
    fr: 'Avec qui ?' },
  'Quando?': { en: 'When?', es: '¿Cuándo?', de: 'Wann?', ja: 'いつ？' ,
    fr: 'Quand ?' },
  'Dove?': { en: 'Where?', es: '¿Dónde?', de: 'Wo?', ja: 'どこで？' ,
    fr: 'Où ?' },
  'Data e ora': { en: 'Date and time', es: 'Fecha y hora', de: 'Datum und Uhrzeit', ja: '日時' ,
    fr: 'Date et heure' },
  'Invia': { en: 'Send', es: 'Enviar', de: 'Senden', ja: '送信' ,
    fr: 'Envoyer' },
  'Vai al piano': { en: 'Go to the plan', es: 'Ir al plan', de: 'Zum Plan', ja: '予定を開く' ,
    fr: 'Aller au plan' },
  'Tutto pronto': { en: 'All set', es: 'Todo listo', de: 'Alles bereit', ja: '準備完了' ,
    fr: 'Tout est prêt' },
  'Copia solo il link': { en: 'Copy the link only', es: 'Copiar solo el enlace',
                          de: 'Nur den Link kopieren', ja: 'リンクだけコピー' ,
    fr: 'Copier juste le lien' },
  'Scrivi un commento': { en: 'Write a comment', es: 'Escribe un comentario',
                          de: 'Kommentar schreiben', ja: 'コメントを書く' ,
    fr: 'Écris un commentaire' },
  'Piano ricorrente': { en: 'Recurring plan', es: 'Plan recurrente',
                        de: 'Wiederkehrender Plan', ja: '繰り返しの予定' ,
    fr: 'Plan récurrent' },
  'Altro da decidere insieme?': { en: 'Anything else to decide together?',
    es: '¿Algo más que decidir juntos?', de: 'Noch etwas gemeinsam zu entscheiden?',
    ja: 'ほかに決めることは？' ,
    fr: 'Autre chose à décider ensemble ?' },
  'Non posso più venire': { en: 'I can’t make it any more', es: 'Ya no puedo ir',
                            de: 'Ich kann doch nicht', ja: '行けなくなりました' ,
    fr: 'Je ne peux plus venir' },
  'Scadenza del voto · facoltativa': { en: 'Voting deadline · optional',
    es: 'Fecha límite del voto · opcional', de: 'Abstimmungsfrist · optional',
    ja: '投票の締切 · 任意' ,
    fr: 'Échéance du vote · facultative' },
  'Gli altri possono proporre': { en: 'Others can suggest things',
    es: 'Los demás pueden proponer', de: 'Andere dürfen Vorschläge machen',
    ja: 'ほかの人も提案できる' ,
    fr: 'Les autres peuvent proposer' },
  'Altre date o luoghi ai voti, e cambi dopo la conferma': {
    en: 'More dates or places up for a vote, and changes after it’s confirmed',
    es: 'Más fechas o sitios a votación, y cambios tras la confirmación',
    de: 'Weitere Termine oder Orte zur Abstimmung, und Änderungen nach der Bestätigung',
    ja: '候補の日時や場所の追加、確定後の変更もできます'
  ,
    fr: 'D’autres dates ou lieux aux votes, et des changements après la confirmation' },
  '🔗 Solo con link': { en: '🔗 By link only', es: '🔗 Solo con enlace',
                        de: '🔗 Nur per Link', ja: '🔗 リンクのみ' ,
    fr: '🔗 Par lien seulement' },
  'Disponibile nelle 24 ore prima dell\'inizio': {
    en: 'Available in the 24 hours before it starts',
    es: 'Disponible en las 24 horas previas al inicio',
    de: 'Verfügbar in den 24 Stunden davor',
    ja: '開始 24 時間前から使えます' ,
    fr: 'Disponible dans les 24 heures avant le début' },
  'Apri il link come nuovo ospite (web)': {
    en: 'Open the link as a new guest (web)', es: 'Abrir el enlace como invitado nuevo (web)',
    de: 'Link als neuer Gast öffnen (Web)', ja: '新しいゲストとしてリンクを開く（ウェブ）' ,
    fr: 'Ouvrir le lien comme nouvel invité (web)' },

  /* ----------------------------------------- app: spiegazioni piu' lunghe */
  'Le sezioni (Roma, Bari…) sono tue e solo tue: servono a ordinare le cerchie, non le vedono gli altri. Ogni gruppo è privato: si entra solo su invito.': {
    en: 'Sections (Rome, Bari…) are yours and only yours — they’re for tidying your circles, and nobody else sees them. Every group is private: you get in by invitation only.',
    es: 'Las secciones (Roma, Bari…) son tuyas y solo tuyas: sirven para ordenar tus círculos y nadie más las ve. Cada grupo es privado: solo se entra por invitación.',
    de: 'Bereiche (Rom, Bari…) gehören dir allein — sie ordnen deine Kreise, und niemand sonst sieht sie. Jede Gruppe ist privat: Zutritt nur auf Einladung.',
    ja: 'セクション（ローマ、バーリなど）はあなただけのもので、グループを整理するためのものです。ほかの人には見えません。グループはすべて非公開で、招待からのみ参加できます。'
  ,
    fr: 'Les sections (Rome, Bari…) sont à toi et rien qu’à toi : elles servent à ranger tes cercles, les autres ne les voient pas. Chaque groupe est privé : on n’entre que sur invitation.' },
  'Versione web: chi riceve il link entra, scrive il nome e vota. L\'app con calendario e gruppi è per chi organizza.': {
    en: 'Web version: whoever gets the link comes in, types a name and votes. The app, with calendar and groups, is for whoever organises.',
    es: 'Versión web: quien recibe el enlace entra, escribe su nombre y vota. La app, con calendario y grupos, es para quien organiza.',
    de: 'Web-Version: Wer den Link bekommt, kommt rein, tippt einen Namen und stimmt ab. Die App mit Kalender und Gruppen ist für die, die organisieren.',
    ja: 'ウェブ版：リンクを受け取った人が開いて、名前を書いて投票します。カレンダーとグループのあるアプリは、幹事のためのものです。'
  ,
    fr: 'Version web : qui reçoit le lien entre, écrit son nom et vote. L’app avec calendrier et groupes est pour qui organise.' },
  'Nessun gruppo ancora. Creane uno per la famiglia, gli amici o il prossimo viaggio.': {
    en: 'No groups yet. Make one for the family, your friends, or the next trip.',
    es: 'Aún no hay grupos. Crea uno para la familia, los amigos o el próximo viaje.',
    de: 'Noch keine Gruppen. Leg eine an — für die Familie, die Freunde oder die nächste Reise.',
    ja: 'まだグループがありません。家族、友だち、次の旅行用に作ってみてください。'
  ,
    fr: 'Aucun groupe pour l’instant. Crées-en un pour la famille, les amis ou le prochain voyage.' },
  'Nessun piano ancora. Il primo lo crei tu: cena, weekend, partita. Oppure "Decidi qualcosa" per una domanda secca.': {
    en: 'No plans yet. You make the first one: dinner, a weekend, a match. Or “Decide something” for a straight question.',
    es: 'Aún no hay planes. El primero lo creas tú: una cena, un finde, un partido. O «Decide algo» para una pregunta directa.',
    de: 'Noch keine Pläne. Den ersten machst du: Essen, ein Wochenende, ein Spiel. Oder „Etwas entscheiden“ für eine schlichte Frage.',
    ja: 'まだ予定がありません。最初のひとつはあなたから。夕食、週末、試合。ひとこと聞きたいだけなら「決めよう」を。'
  ,
    fr: 'Aucun plan pour l’instant. Le premier, c’est toi qui le crées : dîner, week-end, match. Ou « Décide quelque chose » pour une question sèche.' },
  '★ creatore · ✦ admin. Gli admin possono rimuovere persone e cancellare commenti.': {
    en: '★ creator · ✦ admin. Admins can remove people and delete comments.',
    es: '★ creador · ✦ admin. Los admins pueden quitar personas y borrar comentarios.',
    de: '★ Ersteller · ✦ Admin. Admins können Leute entfernen und Kommentare löschen.',
    ja: '★ 作成者 · ✦ 管理者。管理者はメンバーの削除とコメントの削除ができます。'
  ,
    fr: '★ créateur · ✦ admin. Les admins peuvent retirer des personnes et effacer des commentaires.' },
  'Gli invitati ti vedranno così. Niente account, niente password.': {
    en: 'This is how the people you invite will see you. No account, no password.',
    es: 'Así te verán los invitados. Sin cuenta, sin contraseña.',
    de: 'So sehen dich die Eingeladenen. Kein Konto, kein Passwort.',
    ja: '招待した人にはこう表示されます。アカウントもパスワードもいりません。'
  ,
    fr: 'Les invités te verront comme ça. Pas de compte, pas de mot de passe.' },
  'Con un gruppo, i membri vedono il piano subito in app. Con il link, chi lo riceve entra dal web senza installare niente.': {
    en: 'With a group, the members see the plan right away in the app. With the link, whoever gets it comes in from the web without installing anything.',
    es: 'Con un grupo, los miembros ven el plan al momento en la app. Con el enlace, quien lo recibe entra desde la web sin instalar nada.',
    de: 'Mit einer Gruppe sehen die Mitglieder den Plan sofort in der App. Mit dem Link kommt jeder übers Web rein, ohne etwas zu installieren.',
    ja: 'グループなら、メンバーはアプリですぐ予定を見られます。リンクなら、受け取った人が何もインストールせずウェブから参加できます。'
  ,
    fr: 'Avec un groupe, les membres voient le plan direct dans l’app. Avec le lien, qui le reçoit entre par le web sans rien installer.' },
  'Gli invitati segnano tutte le opzioni che gli vanno bene. Vince quella compatibile con più persone; la conferma è tua.': {
    en: 'The people you invite tick every option that works for them. The one that suits the most people wins; confirming is up to you.',
    es: 'Los invitados marcan todas las opciones que les vengan bien. Gana la que funcione para más gente; confirmar te toca a ti.',
    de: 'Die Eingeladenen markieren alles, was ihnen passt. Es gewinnt die Option, die den meisten passt; bestätigen tust du.',
    ja: '招待された人は、都合のいい候補をすべて選びます。いちばん多くの人に合うものが勝ち、確定するのはあなたです。'
  ,
    fr: 'Les invités cochent toutes les options qui leur vont. Celle qui convient au plus de monde l’emporte ; la confirmation est à toi.' },
  'Sai già quando e dove: il piano nasce confermato e gli invitati rispondono solo "ci sono / forse / no".': {
    en: 'You already know when and where: the plan starts out confirmed and the people you invite just answer “in / maybe / out”.',
    es: 'Ya sabes cuándo y dónde: el plan nace confirmado y los invitados solo responden «voy / quizá / no».',
    de: 'Du weißt schon wann und wo: Der Plan startet bestätigt, und die Eingeladenen antworten nur „dabei / vielleicht / nein“.',
    ja: '日時も場所も決まっている場合、予定は最初から確定で始まり、招待された人は「参加／たぶん／不参加」を答えるだけです。'
  ,
    fr: 'Tu sais déjà quand et où : le plan naît confirmé et les invités répondent juste « j’en suis / peut-être / non ».' },
  'Il luogo lo decidete dopo. Il piano si può confermare anche senza: sulla pagina comparirà "Luogo da decidere".': {
    en: 'You’ll settle the place later. The plan can be confirmed without it — the page will say “Place to be decided”.',
    es: 'El sitio lo decidís después. El plan se puede confirmar igual: en la página pondrá «Sitio por decidir».',
    de: 'Den Ort klärt ihr später. Der Plan lässt sich auch ohne bestätigen — auf der Seite steht dann „Ort noch offen“.',
    ja: '場所はあとで決められます。なくても確定でき、ページには「場所は未定」と表示されます。'
  ,
    fr: 'Le lieu, vous le décidez plus tard. Le plan peut se confirmer sans : la page affichera « Lieu à décider ».' },
  'La scadenza è un promemoria per il gruppo. Il piano si chiude quando lo confermi tu.': {
    en: 'The deadline is a nudge for the group. The plan closes when you confirm it.',
    es: 'La fecha límite es un recordatorio para el grupo. El plan se cierra cuando lo confirmas tú.',
    de: 'Die Frist ist eine Erinnerung für die Gruppe. Der Plan schließt, wenn du ihn bestätigst.',
    ja: '締切はみんなへの目安です。予定が閉じるのは、あなたが確定したときです。'
  ,
    fr: 'L’échéance est un rappel pour le groupe. Le plan se ferme quand toi tu le confirmes.' },
  'Calcetto ogni martedì, cena ogni primo venerdì: una data per volta, ognuna con il suo "ci sono"': {
    en: 'Five-a-side every Tuesday, dinner every first Friday: one date at a time, each with its own “I’m in”',
    es: 'Fútbol cada martes, cena cada primer viernes: una fecha a la vez, cada una con su «voy»',
    de: 'Fußball jeden Dienstag, Essen jeden ersten Freitag: ein Termin nach dem anderen, jeder mit eigenem „Ich bin dabei“',
    ja: '毎週火曜のフットサル、毎月第一金曜の食事。日付ごとに一つずつ、それぞれに「参加する」があります'
  ,
    fr: 'Foot chaque mardi, dîner chaque premier vendredi : une date à la fois, chacune avec son « j’en suis »' },
  'Le proposte del gruppo non cambiano il piano da sole: decidi tu': {
    en: 'Suggestions from the group don’t change the plan by themselves — you decide',
    es: 'Las propuestas del grupo no cambian el plan por sí solas: decides tú',
    de: 'Vorschläge aus der Gruppe ändern den Plan nicht von allein — du entscheidest',
    ja: 'みんなの提案だけで予定は変わりません。決めるのはあなたです'
  ,
    fr: 'Les propositions du groupe ne changent pas le plan toutes seules : c’est toi qui décides' },
  'Nessun commento. Le cose da decidere passano dai voti; qui solo quello che serve al piano.': {
    en: 'No comments. Things to decide go through the vote; here goes only what the plan needs.',
    es: 'Sin comentarios. Lo que hay que decidir pasa por la votación; aquí solo lo que necesita el plan.',
    de: 'Keine Kommentare. Was zu entscheiden ist, läuft über die Abstimmung; hier steht nur, was der Plan braucht.',
    ja: 'コメントはまだありません。決めごとは投票で。ここには予定に必要なことだけを。'
  ,
    fr: 'Aucun commentaire. Ce qui est à décider passe par les votes ; ici, seulement ce qui sert au plan.' },
  'Commenti interni al piano, visibili solo a chi è dentro. Per chiacchierare c\'è WhatsApp.': {
    en: 'Comments live inside the plan, visible only to those in it. For chatting there’s WhatsApp.',
    es: 'Comentarios internos del plan, visibles solo para quien está dentro. Para charlar está WhatsApp.',
    de: 'Kommentare bleiben im Plan und sind nur für die Beteiligten sichtbar. Zum Plaudern gibt es WhatsApp.',
    ja: 'コメントは予定の中だけのもので、参加者にしか見えません。おしゃべりは WhatsApp で。'
  ,
    fr: 'Commentaires internes au plan, visibles seulement de qui est dedans. Pour bavarder, il y a WhatsApp.' },
  'Tutti lo vedono qui, senza cercarlo in chat': {
    en: 'Everyone sees it here, without hunting for it in the chat',
    es: 'Todos lo ven aquí, sin buscarlo en el chat',
    de: 'Alle sehen es hier, ohne im Chat danach zu suchen',
    ja: 'チャットを探さなくても、みんながここで見られます'
  ,
    fr: 'Tout le monde le voit ici, sans le chercher dans la discussion' },
  'Le foto restano nel piano, compresse; gli originali restano sul tuo telefono.': {
    en: 'Photos stay in the plan, compressed; the originals stay on your phone.',
    es: 'Las fotos se quedan en el plan, comprimidas; los originales siguen en tu teléfono.',
    de: 'Fotos bleiben im Plan, komprimiert; die Originale bleiben auf deinem Handy.',
    ja: '写真は圧縮されて予定に残ります。元の画像はあなたの端末にそのまま残ります。'
  ,
    fr: 'Les photos restent dans le plan, compressées ; les originaux restent sur ton téléphone.' },
  'Solo registrazione: i soldi passano fuori da Kimari (PayPal, Satispay, contanti). Le voci non si modificano, si annullano.': {
    en: 'Record-keeping only: the money moves outside Kimari (PayPal, Satispay, cash). Entries aren’t edited, they’re voided.',
    es: 'Solo registro: el dinero se mueve fuera de Kimari (PayPal, Bizum, efectivo). Las entradas no se modifican, se anulan.',
    de: 'Nur zum Festhalten: Das Geld fließt außerhalb von Kimari (PayPal, Satispay, bar). Einträge werden nicht geändert, sondern storniert.',
    ja: '記録のためだけの機能です。お金のやり取りは Kimari の外で行います（PayPal、Satispay、現金など）。記入は修正ではなく取り消しで直します。'
  ,
    fr: 'Juste un registre : l’argent passe hors de Kimari (PayPal, Satispay, espèces). Les entrées ne se modifient pas, elles s’annulent.' },
  'Parti uguali tra chi scegli. Si può annullare, non modificare.': {
    en: 'Split evenly among the people you pick. It can be voided, not edited.',
    es: 'A partes iguales entre quienes elijas. Se puede anular, no modificar.',
    de: 'Zu gleichen Teilen unter den Ausgewählten. Stornierbar, nicht änderbar.',
    ja: '選んだ人で均等に割ります。取り消しはできますが、修正はできません。'
  ,
    fr: 'À parts égales entre qui tu choisis. Annulable, pas modifiable.' },

  /* ------------------------------------------- toast trovati il 27/8/2026
     Cinque K.toast diretti in live.js non passavano da K.t. Le domande
     binarie scrivevano 'Sì'/'No' come nomi delle opzioni: si traducono alla
     creazione, nella lingua di chi organizza, come ogni suo altro testo. */
  'La schermata non si aggiorna: {errore}': {
    en: 'The screen won’t refresh: {errore}',
    es: 'La pantalla no se actualiza: {errore}',
    de: 'Der Bildschirm aktualisiert sich nicht: {errore}',
    ja: '画面を更新できません：{errore}'
  ,
    fr: 'L’écran ne se met pas à jour : {errore}' },
  'Salvato. Ricarico la schermata…': { en: 'Saved. Reloading…',
    es: 'Guardado. Recargando…', de: 'Gespeichert. Lade neu …',
    ja: '保存しました。再読み込みします…' ,
    fr: 'Enregistré. Je recharge l’écran…' },
  'Questo invito non è più valido': { en: 'This invite is no longer valid',
    es: 'Esta invitación ya no es válida', de: 'Diese Einladung ist nicht mehr gültig',
    ja: 'この招待はもう使えません' ,
    fr: 'Cette invitation n’est plus valide' },
  'Libreria Supabase non caricata: resto in modalità demo': {
    en: 'Supabase library not loaded: staying in demo mode',
    es: 'Librería de Supabase no cargada: sigo en modo demo',
    de: 'Supabase-Bibliothek nicht geladen: bleibe im Demomodus',
    ja: 'Supabase ライブラリを読み込めません。デモモードのままにします'
  ,
    fr: 'Bibliothèque Supabase non chargée : je reste en mode démo' },
  'Sei entrato ma non riesco a creare il tuo profilo. Riprova, o scrivimi.': {
    en: 'You’re signed in but I can’t create your profile. Try again, or write to me.',
    es: 'Has entrado pero no puedo crear tu perfil. Reintenta, o escríbeme.',
    de: 'Du bist drin, aber ich kann dein Profil nicht anlegen. Versuch’s nochmal oder schreib mir.',
    ja: 'ログインできましたが、プロフィールを作れません。もう一度試すか、ご連絡ください。'
  ,
    fr: 'Tu es connecté mais je n’arrive pas à créer ton profil. Réessaie, ou écris-moi.' },
  'Caricata': { en: 'Uploaded', es: 'Subida', de: 'Hochgeladen', ja: 'アップロードしました' ,
    fr: 'Chargée' },
  '{n} caricate': { en: '{n} uploaded', es: '{n} subidas', de: '{n} hochgeladen',
                    ja: '{n} 件アップロードしました' ,
    fr: '{n} chargées' },
  'Sì': { en: 'Yes', es: 'Sí', de: 'Ja', ja: 'はい' ,
    fr: 'Oui' },
  'No': { en: 'No', es: 'No', de: 'Nein', ja: 'いいえ' ,
    fr: 'Non' },

  /* --------------------------------------- Novità e feed, trovati il 27/8
     Provando l'app in inglese: "Tu created a plan", "1 h fa", "1 cosa da
     decidere". ago(), i "Tu", e mezzi feedItems erano scolpiti in italiano.
     La seconda persona ("hai creato") era un replace(/^ha /,'hai ') sul
     testo GIÀ tradotto: funzionava solo in italiano. Ora è una voce sua. */
  'adesso': { en: 'now', es: 'ahora', de: 'jetzt', ja: 'たった今', fr: 'à l’instant' },
  '{n} min fa': { en: '{n} min ago', es: 'hace {n} min', de: 'vor {n} Min.',
                  ja: '{n}分前', fr: 'il y a {n} min' },
  '{n} h fa': { en: '{n} h ago', es: 'hace {n} h', de: 'vor {n} Std.',
                ja: '{n}時間前', fr: 'il y a {n} h' },
  'ieri': { en: 'yesterday', es: 'ayer', de: 'gestern', ja: '昨日', fr: 'hier' },
  '{n} g fa': { en: '{n} d ago', es: 'hace {n} días', de: 'vor {n} Tagen',
                ja: '{n}日前', fr: 'il y a {n} j' },
  'Tu': { en: 'You', es: 'Tú', de: 'Du', ja: 'あなた', fr: 'Toi' },
  'nuovo': { en: 'new', es: 'nuevo', de: 'neu', ja: '新着', fr: 'nouveau' },
  'Creatore': { en: 'Creator', es: 'Creador', de: 'Ersteller', ja: '作成者', fr: 'Créateur' },
  '1 cosa da decidere': { en: '1 thing to decide', es: '1 cosa por decidir',
    de: '1 Sache zu entscheiden', ja: '決めることが1件', fr: '1 chose à décider' },
  '{n} cose da decidere': { en: '{n} things to decide', es: '{n} cosas por decidir',
    de: '{n} Sachen zu entscheiden', ja: '決めることが{n}件', fr: '{n} choses à décider' },
  'ha votato': { en: 'voted', es: 'ha votado', de: 'hat abgestimmt',
                 ja: 'が投票しました', fr: 'a voté' },
  'hai votato': { en: 'you voted', es: 'has votado', de: 'hast abgestimmt',
                  ja: 'が投票しました', fr: 'as voté' },
  'ha confermato': { en: 'confirmed', es: 'ha confirmado', de: 'hat bestätigt',
                     ja: 'が確定しました', fr: 'a confirmé' },
  'hai confermato': { en: 'you confirmed', es: 'has confirmado', de: 'hast bestätigt',
                      ja: 'が確定しました', fr: 'as confirmé' },
  'ha chiuso la decisione': { en: 'closed the decision', es: 'ha cerrado la decisión',
    de: 'hat die Entscheidung geschlossen', ja: 'が決定を締め切りました', fr: 'a clos la décision' },
  'hai chiuso la decisione': { en: 'you closed the decision', es: 'has cerrado la decisión',
    de: 'hast die Entscheidung geschlossen', ja: 'が決定を締め切りました', fr: 'as clos la décision' },
  'ha modificato il piano': { en: 'changed the plan', es: 'ha modificado el plan',
    de: 'hat den Plan geändert', ja: 'が予定を変更しました', fr: 'a modifié le plan' },
  'hai modificato il piano': { en: 'you changed the plan', es: 'has modificado el plan',
    de: 'hast den Plan geändert', ja: 'が予定を変更しました', fr: 'as modifié le plan' },
  'hai creato un piano': { en: 'you created a plan', es: 'has creado un plan',
    de: 'hast einen Plan erstellt', ja: 'が予定を作りました', fr: 'as créé un plan' },
  'hai aperto una decisione': { en: 'you opened a decision', es: 'has abierto una decisión',
    de: 'hast eine Entscheidung eröffnet', ja: 'が決定を開きました', fr: 'as ouvert une décision' },
  'sei entrato nel gruppo': { en: 'you joined the group', es: 'has entrado en el grupo',
    de: 'bist der Gruppe beigetreten', ja: 'がグループに参加しました', fr: 'as rejoint le groupe' },
  'ci sarai': { en: 'you’re in', es: 'estarás', de: 'bist dabei', ja: 'が参加します', fr: 'en es' },
  'forse ci sarai': { en: 'you might come', es: 'quizá estés', de: 'bist vielleicht dabei',
                      ja: 'が参加するかもしれません', fr: 'en es peut-être' },
  'ha commentato: “{testo}”': { en: 'commented: “{testo}”', es: 'ha comentado: «{testo}»',
    de: 'hat kommentiert: „{testo}“', ja: 'がコメントしました：「{testo}」', fr: 'a commenté : « {testo} »' },
  'hai commentato: “{testo}”': { en: 'you commented: “{testo}”', es: 'has comentado: «{testo}»',
    de: 'hast kommentiert: „{testo}“', ja: 'がコメントしました：「{testo}」', fr: 'as commenté : « {testo} »' },

  /* ------------------------------------ identità dell'ospite (0023, fix 4)
     Il claim "Sei uno di questi?" non c'è più: chiunque avesse il link poteva
     toccare un nome ed entrare come quella persona, per sempre. */
  'Dimmi chi sei: scrivi il tuo nome.': {
    en: 'Tell me who you are: type your name.',
    es: 'Dime quién eres: escribe tu nombre.',
    de: 'Sag mir, wer du bist: schreib deinen Namen.',
    ja: 'お名前を教えてください。',
    fr: 'Dis-moi qui tu es : écris ton nom.' },
  'Entra col tuo nome: non si può più entrare con quello di un altro.': {
    en: 'Join with your own name: you can no longer join as someone else.',
    es: 'Entra con tu nombre: ya no se puede entrar con el de otra persona.',
    de: 'Tritt mit deinem eigenen Namen bei: mit dem Namen anderer geht es nicht mehr.',
    ja: 'ご自身の名前で参加してください。他の人の名前では参加できなくなりました。',
    fr: 'Entre avec ton propre nom : on ne peut plus entrer avec celui d’un autre.' },
  'Non sei tu? Cambia': {
    en: 'Not you? Switch', es: '¿No eres tú? Cambiar',
    de: 'Nicht du? Wechseln', ja: '別の人ですか？切り替える',
    fr: 'Ce n’est pas toi ? Changer' },
  'Oppure entra col tuo account, così ritrovi i tuoi piani da ogni telefono.': {
    en: 'Or sign in, so you find your plans from any phone.',
    es: 'O entra con tu cuenta, así encuentras tus planes desde cualquier teléfono.',
    de: 'Oder melde dich an, dann findest du deine Pläne von jedem Handy aus.',
    ja: 'またはアカウントで入ると、どの端末からでも予定を見つけられます。',
    fr: 'Ou connecte-toi, comme ça tu retrouves tes plans depuis n’importe quel téléphone.' },

  /* ---------------------------------------- link personali (0024, fix 4) */
  'Genera link': { en: 'Create link', es: 'Generar enlace', de: 'Link erzeugen',
                   ja: 'リンクを作る', fr: 'Générer le lien' },
  'Copia': { en: 'Copy', es: 'Copiar', de: 'Kopieren', ja: 'コピー', fr: 'Copier' },
  'link generato': { en: 'link created', es: 'enlace generado', de: 'Link erzeugt',
                     ja: 'リンク作成済み', fr: 'lien généré' },
  'Link copiato: mandalo solo a {chi}': {
    en: 'Link copied: send it only to {chi}',
    es: 'Enlace copiado: mándaselo solo a {chi}',
    de: 'Link kopiert: schick ihn nur an {chi}',
    ja: 'リンクをコピーしました。{chi} だけに送ってください。',
    fr: 'Lien copié : envoie-le seulement à {chi}' },
  'Quel link è stato generato da un altro telefono: rigeneralo': {
    en: 'That link was created on another phone: create it again',
    es: 'Ese enlace se generó en otro teléfono: vuelve a generarlo',
    de: 'Dieser Link wurde auf einem anderen Handy erzeugt: erzeug ihn neu',
    ja: 'そのリンクは別の端末で作られました。作り直してください。',
    fr: 'Ce lien a été généré sur un autre téléphone : régénère-le' },
  'Un link per ognuno: chi lo apre entra con quel nome, e solo con quello. Mandalo alla persona giusta, non nel gruppo.': {
    en: 'One link each: whoever opens it joins with that name, and only that one. Send it to the right person, not to the group.',
    es: 'Un enlace para cada uno: quien lo abra entra con ese nombre, y solo con ese. Mándaselo a la persona correcta, no al grupo.',
    de: 'Ein Link pro Person: wer ihn öffnet, tritt mit diesem Namen bei, und nur mit diesem. Schick ihn der richtigen Person, nicht in die Gruppe.',
    ja: '一人にひとつのリンク。開いた人はその名前で参加します。グループではなく、本人に送ってください。',
    fr: 'Un lien par personne : qui l’ouvre entre avec ce nom, et seulement celui-là. Envoie-le à la bonne personne, pas au groupe.' },
  'Questo link è tuo: chi organizza l’ha mandato a te. Non girarlo.': {
    en: 'This link is yours: the organiser sent it to you. Don’t pass it on.',
    es: 'Este enlace es tuyo: quien organiza te lo ha mandado a ti. No lo reenvíes.',
    de: 'Dieser Link gehört dir: die Organisatorin hat ihn dir geschickt. Gib ihn nicht weiter.',
    ja: 'このリンクはあなた専用です。主催者があなたに送りました。転送しないでください。',
    fr: 'Ce lien est le tien : la personne qui organise te l’a envoyé. Ne le transfère pas.' },

  /* ------------------------------ pagina gruppo e risultati, stessa notte */
  'Gestisci': { en: 'Manage', es: 'Gestionar', de: 'Verwalten', ja: '管理', fr: 'Gérer' },
  'Info': { en: 'Info', es: 'Info', de: 'Infos', ja: '情報', fr: 'Infos' },
  'Privato, solo su invito · 1 persona': { en: 'Private, invite only · 1 person',
    es: 'Privado, solo por invitación · 1 persona', de: 'Privat, nur auf Einladung · 1 Person',
    ja: '招待制の非公開グループ · 1人', fr: 'Privé, sur invitation · 1 personne' },
  'Privato, solo su invito · {n} persone': { en: 'Private, invite only · {n} people',
    es: 'Privado, solo por invitación · {n} personas', de: 'Privat, nur auf Einladung · {n} Personen',
    ja: '招待制の非公開グループ · {n}人', fr: 'Privé, sur invitation · {n} personnes' },
  'Decidi qualcosa': { en: 'Decide something', es: 'Decide algo',
    de: 'Entscheidet etwas', ja: '何かを決める', fr: 'Décidez un truc' },
  'Invita con link': { en: 'Invite with a link', es: 'Invitar con enlace',
    de: 'Per Link einladen', ja: 'リンクで招待', fr: 'Inviter par lien' },
  'Una domanda secca per {nome}. Tu chiudi.': {
    en: 'One straight question for {nome}. You close it.',
    es: 'Una pregunta directa para {nome}. Tú la cierras.',
    de: 'Eine klare Frage an {nome}. Du schließt ab.',
    ja: '{nome} へのシンプルな質問。締めるのはあなた。',
    fr: 'Une question directe pour {nome}. C’est toi qui clos.' },
  'Es. Invitiamo anche Paolo?': { en: 'E.g. Should we invite Paolo too?',
    es: 'Ej. ¿Invitamos también a Paolo?', de: 'Z. B. Laden wir auch Paolo ein?',
    ja: '例：パオロも誘う？', fr: 'Ex. On invite aussi Paolo ?' },
  'Es. Cosa regaliamo a papà?': { en: 'E.g. What do we get dad?',
    es: 'Ej. ¿Qué le regalamos a papá?', de: 'Z. B. Was schenken wir Papa?',
    ja: '例：パパに何をあげる？', fr: 'Ex. Qu’est-ce qu’on offre à papa ?' },
  'più compatibile': { en: 'best fit', es: 'más compatible', de: 'passt am besten',
    ja: '最有力', fr: 'la plus compatible' },
  'persona': { en: 'person', es: 'persona', de: 'Person', ja: '人', fr: 'personne' },
  'persone': { en: 'people', es: 'personas', de: 'Personen', ja: '人', fr: 'personnes' },
  'Ti hanno invitato · 1 persona': { en: 'You’ve been invited · 1 person',
    es: 'Te han invitado · 1 persona', de: 'Du bist eingeladen · 1 Person',
    ja: '招待されています · 1人', fr: 'On t’a invité · 1 personne' },
  'Ti hanno invitato · {n} persone': { en: 'You’ve been invited · {n} people',
    es: 'Te han invitado · {n} personas', de: 'Du bist eingeladen · {n} Personen',
    ja: '招待されています · {n}人', fr: 'On t’a invité · {n} personnes' },
  'Serve solo al prototipo': { en: 'Prototype only', es: 'Solo para el prototipo',
    de: 'Nur für den Prototyp', ja: 'プロトタイプ専用です', fr: 'Réservé au prototype' },
  'Hai votato ✓ Ora tocca a te: conferma quando vuoi, anche prima che abbiano votato tutti.': {
    en: 'You voted ✓ Now it’s on you: confirm whenever you like, even before everyone has voted.',
    es: 'Has votado ✓ Ahora te toca a ti: confirma cuando quieras, incluso antes de que voten todos.',
    de: 'Du hast abgestimmt ✓ Jetzt bist du dran: bestätige, wann du willst — auch bevor alle abgestimmt haben.',
    ja: '投票しました ✓ 次はあなたの番：全員の投票を待たずに、いつでも確定できます。',
    fr: 'Tu as voté ✓ À toi de jouer : confirme quand tu veux, même avant que tout le monde ait voté.' },
  'Hai votato ✓ Ora tocca a te: chiudi quando vuoi, anche prima che abbiano votato tutti.': {
    en: 'You voted ✓ Now it’s on you: close whenever you like, even before everyone has voted.',
    es: 'Has votado ✓ Ahora te toca a ti: cierra cuando quieras, incluso antes de que voten todos.',
    de: 'Du hast abgestimmt ✓ Jetzt bist du dran: schließe ab, wann du willst — auch bevor alle abgestimmt haben.',
    ja: '投票しました ✓ 次はあなたの番：全員の投票を待たずに、いつでも締め切れます。',
    fr: 'Tu as voté ✓ À toi de jouer : clos quand tu veux, même avant que tout le monde ait voté.' },
  'Hai votato ✓ Il piano si aggiorna qui: quando {nome} conferma, lo vedi in questa pagina.': {
    en: 'You voted ✓ The plan updates here: when {nome} confirms, you’ll see it on this page.',
    es: 'Has votado ✓ El plan se actualiza aquí: cuando {nome} confirme, lo verás en esta página.',
    de: 'Du hast abgestimmt ✓ Der Plan aktualisiert sich hier: wenn {nome} bestätigt, siehst du es auf dieser Seite.',
    ja: '投票しました ✓ 予定はここで更新されます。{nome} が確定したら、このページに表示されます。',
    fr: 'Tu as voté ✓ Le plan se met à jour ici : quand {nome} confirmera, tu le verras sur cette page.' },
  /* ---------------- i cartellini in cima al piano, trovati il 28/8/2026
     Erano scolpiti sulla stessa riga di 'Si chiude': un cartellino e' corto
     e passa inosservato, ma sta in cima alla schermata piu' vista di tutte. */
  'Deciso': { en: 'Decided', es: 'Decidido', de: 'Entschieden', ja: '決定', fr: 'Décidé' },
  'prenotato': { en: 'booked', es: 'reservado', de: 'reserviert', ja: '予約済み', fr: 'réservé' },
  'Scaduto · in attesa di {chi}': {
    en: 'Expired · waiting for {chi}', es: 'Vencido · esperando a {chi}',
    de: 'Abgelaufen · wartet auf {chi}', ja: '締切 · {chi} 待ち',
    fr: 'Échu · en attente de {chi}' },

  'Hai votato ✓ Il risultato si aggiorna qui: quando {nome} chiude, lo vedi in questa pagina.': {
    en: 'You voted ✓ The result updates here: when {nome} closes it, you’ll see it on this page.',
    es: 'Has votado ✓ El resultado se actualiza aquí: cuando {nome} cierre, lo verás en esta página.',
    de: 'Du hast abgestimmt ✓ Das Ergebnis aktualisiert sich hier: wenn {nome} schließt, siehst du es auf dieser Seite.',
    ja: '投票しました ✓ 結果はここで更新されます。{nome} が締め切ったら、このページに表示されます。',
    fr: 'Tu as voté ✓ Le résultat se met à jour ici : quand {nome} clora, tu le verras sur cette page.' }
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
