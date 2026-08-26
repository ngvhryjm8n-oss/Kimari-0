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
  'Fatto con': { en: 'Made with', es: 'Hecho con', de: 'Gemacht mit', ja: '作成' }
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
