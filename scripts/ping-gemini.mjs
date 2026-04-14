/**
 * Teste rápido da API Gemini (Developer API).
 * Uso: npm run ping:gemini (local ou GitHub Actions → workflow "Gemini API smoke").
 * Lê VITE_GEMINI_API_KEY de process.env ou da primeira linha correspondente no .env (não imprime a chave).
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { setTimeout as delay } from 'node:timers/promises';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');

function loadKeyFromDotEnv() {
  for (const name of ['.env.local', '.env']) {
    const envPath = path.join(root, name);
    if (!fs.existsSync(envPath)) continue;
    const text = fs.readFileSync(envPath, 'utf8');
    for (const line of text.split(/\r?\n/)) {
      const m = line.match(/^\s*VITE_GEMINI_API_KEY\s*=\s*(.*)$/);
      if (m) return m[1].trim().replace(/^["']|["']$/g, '');
    }
  }
  return '';
}

const apiKey = (process.env.VITE_GEMINI_API_KEY || '').trim() || loadKeyFromDotEnv();
if (!apiKey) {
  console.error('[ping-gemini] Defina VITE_GEMINI_API_KEY no ambiente ou no .env na raiz do projeto.');
  process.exit(2);
}

const envModel = (process.env.VITE_GEMINI_MODEL || '').trim();
/** Ordem: env primeiro; depois nomes frequentes na API v1beta (ListModels confirma o seu projeto). */
const defaults = [
  'gemini-2.5-flash',
  'gemini-2.5-flash-lite',
  'gemini-2.0-flash',
  'gemini-1.5-flash-latest',
  'gemini-1.5-flash-8b',
  'gemini-3-flash',
  'gemini-1.5-flash',
];
const tryModels = envModel ? [envModel, ...defaults] : defaults;

const seen = new Set();
const models = tryModels.filter((m) => {
  if (!m || seen.has(m)) return false;
  seen.add(m);
  return true;
});

let success = false;
for (const model of models) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;
  const body = {
    contents: [{ parts: [{ text: 'Responda exatamente com a palavra: PONG' }] }],
  };
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const msg = data?.error?.message || data?.error?.status || res.status;
      console.log(`[ping-gemini] Modelo "${model}": falhou (${res.status}) —`, msg);
      continue;
    }
    const text =
      data?.candidates?.[0]?.content?.parts?.map((p) => p.text).join('')?.trim() || '(sem texto)';
    console.log(`[ping-gemini] OK — modelo "${model}" respondeu:`, text.slice(0, 200));
    success = true;
    break;
  } catch (e) {
    console.log(`[ping-gemini] Modelo "${model}": erro de rede —`, e?.message || e);
  }
}

if (success) {
  await delay(150);
  process.exitCode = 0;
} else {
  console.error('[ping-gemini] Nenhum modelo respondeu com sucesso. Verifique chave, cota (429) ou nome do modelo.');
  process.exitCode = 1;
}
