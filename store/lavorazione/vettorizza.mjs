// Ricostruisce store/icona.svg dalla icona-192.png (a tutto quadro).
//
// L'icona esiste solo a 192px: ingrandirla per gli store lascia i bordi
// morbidi. Ma e' arte piatta a sei colori, quindi si puo' vettorizzare:
// quantizza, traccia i contorni di ogni colore, semplifica, ammorbidisce,
// emette un path SVG per regione. Niente dipendenze: il PNG lo decodifica
// zlib di Node, il resto e' geometria.
//
//   node store/lavorazione/vettorizza.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { inflateSync } from 'node:zlib';

const SRC = new URL('./icona-192-quadrata2.png', import.meta.url);
const OUT = new URL('../icona.svg', import.meta.url);

// ---------- decodifica PNG (solo il caso di questo file: palette 8 bit)
const buf = readFileSync(SRC);
let pos = 8; const idat = []; let palette = null, larg = 0, alt = 0, tipo = -1;
while (pos < buf.length) {
  const len = buf.readUInt32BE(pos); const nome = buf.toString('ascii', pos + 4, pos + 8);
  const dati = buf.subarray(pos + 8, pos + 8 + len);
  if (nome === 'IHDR') { larg = dati.readUInt32BE(0); alt = dati.readUInt32BE(4); tipo = dati[9]; }
  if (nome === 'PLTE') palette = dati;
  if (nome === 'IDAT') idat.push(dati);
  pos += 12 + len;
}
if (tipo !== 3 && tipo !== 2 && tipo !== 6) throw new Error('tipo PNG inatteso: ' + tipo);
const raw = inflateSync(Buffer.concat(idat));
const bpp = tipo === 3 ? 1 : (tipo === 2 ? 3 : 4);
const stride = larg * bpp;
// defiltra
const px = Buffer.alloc(alt * stride);
const paeth = (a, b, c) => { const p = a + b - c, pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c); return pa <= pb && pa <= pc ? a : (pb <= pc ? b : c); };
for (let y = 0; y < alt; y++) {
  const f = raw[y * (stride + 1)]; const riga = raw.subarray(y * (stride + 1) + 1, (y + 1) * (stride + 1));
  for (let x = 0; x < stride; x++) {
    const a = x >= bpp ? px[y * stride + x - bpp] : 0;
    const b = y > 0 ? px[(y - 1) * stride + x] : 0;
    const c = (x >= bpp && y > 0) ? px[(y - 1) * stride + x - bpp] : 0;
    let v = riga[x];
    if (f === 1) v += a; else if (f === 2) v += b; else if (f === 3) v += (a + b) >> 1; else if (f === 4) v += paeth(a, b, c);
    px[y * stride + x] = v & 255;
  }
}
const rgbDi = (x, y) => {
  if (tipo === 3) { const i = px[y * stride + x] * 3; return [palette[i], palette[i + 1], palette[i + 2]]; }
  const i = y * stride + x * bpp; return [px[i], px[i + 1], px[i + 2]];
};

// ---------- quantizzazione sui sei colori veri dell'icona
const COLORI = [
  ['#0071FD', [0, 113, 253]],   // fondo
  ['#20222A', [32, 34, 42]],    // corpo e occhi
  ['#FDFDFD', [253, 253, 253]], // faccia, pancia, luci degli occhi
  ['#F9C9D8', [249, 201, 216]], // guance
  ['#FF9500', [255, 149, 0]],   // becco
  ['#34C759', [52, 199, 89]],   // spunta
];
const idx = new Int8Array(larg * alt);
const conta = new Array(COLORI.length).fill(0);
for (let y = 0; y < alt; y++) for (let x = 0; x < larg; x++) {
  const [r, g, b] = rgbDi(x, y); let mig = 0, md = 1e9;
  for (let k = 0; k < COLORI.length; k++) {
    const [, [cr, cg, cb]] = COLORI[k];
    const d = (r - cr) ** 2 + (g - cg) ** 2 + (b - cb) ** 2;
    if (d < md) { md = d; mig = k; }
  }
  idx[y * larg + x] = mig; conta[mig]++;
}
console.log('pixel per colore:', COLORI.map(([n], k) => n + ':' + conta[k]).join(' '));

// ---------- contorni per colore: marching squares su ogni componente
function componenti(colore) {
  // etichetta le componenti connesse del colore (4-conn)
  const lab = new Int32Array(larg * alt).fill(-1); const comp = [];
  for (let y = 0; y < alt; y++) for (let x = 0; x < larg; x++) {
    const i = y * larg + x;
    if (idx[i] !== colore || lab[i] >= 0) continue;
    const id = comp.length; const coda = [i]; lab[i] = id; let n = 0;
    while (coda.length) {
      const j = coda.pop(); n++;
      const jx = j % larg, jy = (j / larg) | 0;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = jx + dx, ny = jy + dy;
        if (nx < 0 || ny < 0 || nx >= larg || ny >= alt) continue;
        const k = ny * larg + nx;
        if (idx[k] === colore && lab[k] < 0) { lab[k] = id; coda.push(k); }
      }
    }
    comp.push(n);
  }
  return { lab, comp };
}

// contorno esterno di una componente: cammina lungo il bordo (Moore tracing)
function contorno(lab, id) {
  // trova il pixel piu' in alto a sinistra
  let sx = -1, sy = -1;
  for (let y = 0; y < alt && sx < 0; y++) for (let x = 0; x < larg; x++)
    if (lab[y * larg + x] === id) { sx = x; sy = y; break; }
  const dentro = (x, y) => x >= 0 && y >= 0 && x < larg && y < alt && lab[y * larg + x] === id;
  // Moore-neighbor tracing con criterio di Jacob
  const DIR = [[1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1], [0, -1], [1, -1]];
  const punti = []; let cx = sx, cy = sy, d = 6; // arrivo da sopra
  do {
    punti.push([cx, cy]);
    let trovato = false;
    for (let k = 0; k < 8; k++) {
      const nd = (d + 6 + k) % 8; // gira a sinistra rispetto a come sei arrivato
      const nx = cx + DIR[nd][0], ny = cy + DIR[nd][1];
      if (dentro(nx, ny)) { cx = nx; cy = ny; d = nd; trovato = true; break; }
    }
    if (!trovato) break; // pixel isolato
    if (punti.length > 20000) throw new Error('contorno impazzito');
  } while (cx !== sx || cy !== sy);
  return punti;
}

// Ramer-Douglas-Peucker
function semplifica(p, eps) {
  if (p.length < 3) return p;
  const d2 = (a, b, c) => { // distanza al quadrato di c dal segmento ab
    const dx = b[0] - a[0], dy = b[1] - a[1];
    const l2 = dx * dx + dy * dy || 1;
    let t = ((c[0] - a[0]) * dx + (c[1] - a[1]) * dy) / l2;
    t = Math.max(0, Math.min(1, t));
    const px2 = a[0] + t * dx - c[0], py2 = a[1] + t * dy - c[1];
    return px2 * px2 + py2 * py2;
  };
  const tieni = new Uint8Array(p.length); tieni[0] = tieni[p.length - 1] = 1;
  const pila = [[0, p.length - 1]];
  while (pila.length) {
    const [i, j] = pila.pop(); let m = -1, mv = -1;
    for (let k = i + 1; k < j; k++) { const v = d2(p[i], p[j], p[k]); if (v > mv) { mv = v; m = k; } }
    if (mv > eps * eps) { tieni[m] = 1; pila.push([i, m], [m, j]); }
  }
  return p.filter((_, k) => tieni[k]);
}

// Chaikin: smussa gli spigoli (chiuso)
function smussa(p) {
  const q = [];
  for (let i = 0; i < p.length; i++) {
    const a = p[i], b = p[(i + 1) % p.length];
    q.push([a[0] * .75 + b[0] * .25, a[1] * .75 + b[1] * .25]);
    q.push([a[0] * .25 + b[0] * .75, a[1] * .25 + b[1] * .75]);
  }
  return q;
}

const aPath = p => 'M' + p.map(([x, y]) => `${(+x).toFixed(1)} ${(+y).toFixed(1)}`).join('L') + 'Z';

// ---------- componi: fondo pieno + regioni dal piu' grande al piu' piccolo
let corpo = '';
const regioni = [];
for (let colore = 1; colore < COLORI.length; colore++) {
  const { lab, comp } = componenti(colore);
  comp.forEach((n, id) => {
    if (n < 12) return; // granelli d'antialias
    let punti = contorno(lab, id);
    punti = semplifica(punti, 1.1);
    punti = smussa(smussa(punti));
    regioni.push({ n, fill: COLORI[colore][0], d: aPath(punti) });
  });
}
regioni.sort((a, b) => b.n - a.n);
// Il tratto dello stesso colore allarga ogni regione di un pixel: copre
// l'alone dei pixel d'antialias fra scuro e bianco, che quantizzano blu.
for (const r of regioni) corpo += `  <path fill="${r.fill}" stroke="${r.fill}" stroke-width="2" stroke-linejoin="round" d="${r.d}"/>\n`;
console.log('regioni:', regioni.length);

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 192 192">
  <rect width="192" height="192" fill="#0071FD"/>
${corpo}</svg>\n`;
writeFileSync(OUT, svg);
console.log('scritto', OUT.pathname, svg.length, 'caratteri');
