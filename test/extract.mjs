// Estrae lo script inline di index.html (l'ultimo <script> senza src).
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

export function readIndex(){ return readFileSync(join(root, 'index.html'), 'utf8'); }

export function extractInlineScript(html = readIndex()){
  const re = /<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi;
  const bodies = [...html.matchAll(re)].map(m => m[1]);
  if (!bodies.length) throw new Error('nessuno <script> inline trovato in index.html');
  return bodies[bodies.length - 1];
}

export function cdnTag(html = readIndex()){
  const m = html.match(/<script\b[^>]*\bsrc=["']([^"']+)["'][^>]*>/i);
  if (!m) throw new Error('nessun <script src> trovato');
  return { tag: m[0], src: m[1] };
}
