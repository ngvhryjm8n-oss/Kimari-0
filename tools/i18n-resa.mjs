// Rende l'app in ogni lingua e cerca italiano rimasto A SCHERMO.
//
// È l'unico controllo che misura la cosa vera. Gli altri guardano il codice —
// quali stringhe passano da t(), quali voci ha il dizionario — e per tre volte
// mi hanno dato numeri rassicuranti mentre l'app era mezza italiana, perché
// ognuno era cieco su una categoria diversa: il testo scritto a mano
// nell'HTML, le etichette brevi senza parole-spia, gli argomenti di funzione.
//
// Qui invece si guarda il testo che finisce nel DOM. Se ci resta una parola
// italiana, la si vede — da qualunque categoria arrivi.
//
//   node tools/i18n-resa.mjs
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { JSDOM } from 'jsdom';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const HTML = readFileSync(join(root, 'app', 'index.html'), 'utf8');

// Parole che in italiano compaiono ovunque e nelle altre cinque lingue mai.
// Corte apposta: se compaiono, il testo intorno è italiano.
const SPIE = /\b(che|chi|con|dove|quando|della|degli|per|non|una|gli|tuoi|sono|questo|questa|senza|ancora|oppure|nessun|nessuna|tutti|piano|piani|gruppo|gruppi|posto|voto|voti|amici|spesa|spese|nome|link|indietro|annulla|salva|invia|scegli|conferma|elimina|modifica|aggiungi|rimuovi|chiudi|apri|entra|vota)\b/i;

// Parole che esistono uguali in più lingue: "link" in inglese e tedesco,
// "piano" in inglese (lo strumento musicale), "no". Senza questo l'inglese
// risulterebbe pieno di falsi allarmi.
const AMBIGUE = { en: /\b(link|piano|no|non|come|che)\b/i,
                  es: /\b(no|con|una|nombre|nome)\b/i,
                  de: /\b(link|piano|die|nome)\b/i,
                  ja: /\b(link|piano)\b/i };

const rendi = (lingua) => new Promise(resolve => {
  const dom = new JSDOM(HTML, {
    url: 'https://esempio.test/Kimari-0/app/',
    runScripts: 'dangerously', pretendToBeVisual: true,
    beforeParse(w) {
      Object.defineProperty(w.navigator, 'languages', { value: [lingua + '-XX', lingua] });
      Object.defineProperty(w.navigator, 'language', { value: lingua + '-XX' });
      w.localStorage.setItem('kimari_profilo', '1');
    }
  });
  setTimeout(() => resolve(dom), 400);
});

// In jsdom i moduli non girano, quindi live.js non parte e l'app resta con i
// dati finti: "Cena di famiglia", "Torneo di padel", "Papà". Sono contenuto
// scritto da una persona, non interfaccia, e nessuno li tradurrà mai. Si
// raccolgono da seed() e si escludono, invece di elencarli a mano — così se
// la demo cambia, il controllo continua a funzionare.
const DEMO = new Set();
{
  const da = HTML.indexOf('function seed()');
  const a = HTML.indexOf('\n}', da);
  if (da >= 0 && a > da) {
    for (const m of HTML.slice(da, a).matchAll(/(['"])((?:\\.|(?!\1)[^\\\n])*)\1/g)) {
      const x = m[2].trim();
      if (x.length > 2) DEMO.add(x);
    }
  }
  for (const m of HTML.matchAll(/const FRIENDS = \[([^\]]*)\]/g)) {
    for (const n of m[1].matchAll(/'([^']+)'/g)) DEMO.add(n[1]);
  }
}
const contieneDemo = r => [...DEMO].some(d => r.includes(d));

// IL METODO MIGLIORE, e ci sono arrivato tardi: invece di cercare parole
// italiane a occhio, si rende la stessa schermata in italiano e in un'altra
// lingua e si confronta. Quello che resta IDENTICO non è tradotto.
//
// Serviva perché la ricerca per parole-spia ha un punto cieco strutturale: le
// etichette corte. "Oggi" nel calendario è rimasta in italiano sotto
// un'interfaccia inglese, e lo strumento diceva "nessuna traccia di italiano".
// L'ha trovata Vincenzo guardando lo schermo — di nuovo.
const parole = testo => testo.split('\n').map(r => r.trim())
  .filter(r => r.length > 1 && /[a-zà-ù]/i.test(r));

// Cose che DEVONO restare uguali: il nome del prodotto, i numeri, le date
// (le fa toLocaleString, non il dizionario), i nomi propri della demo.
const uguali = /^(kimari|kimari!|\d|[+\-·✓×★✦🔔📷⏰🎉👍👎]|[A-Z]{1,3}$)/i;

let problemi = 0;

// Prima l'italiano, che è il metro di paragone.
const domIT = await rendi('it');
const testoIT = new Set(parole(
  (domIT.window.document.getElementById('app')?.textContent || '') + '\n' +
  (domIT.window.document.getElementById('sheet-root')?.textContent || '')));

for (const lingua of ['en', 'es', 'de', 'ja', 'fr']) {
  const dom = await rendi(lingua);
  const D = dom.window.document;

  // Solo #app e le schermate: fuori c'è lo <script>, e lì dentro il dizionario
  // ha tutte le chiavi italiane — cercandoci si troverebbe sempre qualcosa.
  const testo = (D.getElementById('app')?.textContent || '') + '\n' +
                (D.getElementById('sheet-root')?.textContent || '');

  const righe = testo.split('\n').map(r => r.trim()).filter(r => r.length > 2);
  // Due reti, non una. La prima cerca parole italiane: prende le frasi.
  const perParole = righe.filter(r =>
    SPIE.test(r) && !AMBIGUE[lingua].test(r) && !contieneDemo(r));

  // La seconda confronta con l'italiano: prende anche le etichette corte, che
  // la prima non puo' vedere perche' non contengono nessuna parola-spia.
  const identiche = parole(testo).filter(r =>
    testoIT.has(r) && !uguali.test(r) && !contieneDemo(r) && !AMBIGUE[lingua].test(r));

  const sospette = [...new Set([...perParole, ...identiche])];

  console.log('\n' + lingua + ': ' + righe.length + ' righe a schermo');
  if (!sospette.length) { console.log('  niente italiano'); continue; }
  problemi += sospette.length;
  // Si stampa la parola che ha fatto scattare il controllo: senza, davanti a
  // una riga lunga non si capisce cosa ci sia di sbagliato, e si perde tempo
  // a cercarlo — o peggio, la si archivia come falso allarme senza guardare.
  [...new Set(sospette)].slice(0, 12).forEach(r =>
    console.log('  · [' + (r.match(SPIE) || [''])[0] + '] ' + r.slice(0, 85)));
}

console.log('\n' + (problemi ? problemi + ' righe da guardare' : 'nessuna traccia di italiano'));

// Onestà su cosa questo controllo NON vede, perché un "tutto pulito" letto
// senza questa riga vale più di quanto dovrebbe: in jsdom i moduli non
// girano, quindi si vede solo la schermata iniziale con i dati finti. Le
// altre — un piano aperto, le spese, il profilo — vanno guardate in un
// browser vero. Ho preferito un controllo parziale e dichiarato a uno
// completo che non esiste.
console.log('(solo la schermata iniziale: in jsdom i moduli non girano,\n' +
            ' quindi le altre schermate non vengono mai disegnate)\n');
process.exit(problemi ? 1 : 0);
