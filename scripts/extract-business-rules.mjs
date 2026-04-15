/**
 * Extrai regras de negócio e gera notas Markdown para Obsidian.
 *
 * Escopo (padrão): lista curada de arquivos/pastas (regras de domínio, validação, métricas).
 * Escopo ampliado: `npm run extract:business-rules -- --all`
 *
 * Agregação (padrão): **um .md por módulo** (arquivo fonte), com seções por exportação.
 * Granularidade antiga: `npm run extract:business-rules -- --per-export`
 *
 * Filtro manual: `node scripts/extract-business-rules.mjs --only=hooks/useProjectMetrics.ts,utils/validation.ts`
 *
 * IA: `--ai` (Gemini via VITE_GEMINI_API_KEY). Em modo módulo, uma chamada por exportação (mesclada no mesmo .md).
 *
 * Pastas permitidas no escopo ampliado: services/, hooks/, utils/, store/, api/
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const OUT_DIR = path.join(ROOT, 'docs', 'obsidian', 'business-rules');
const TYPES_FILE = path.join(ROOT, 'types.ts');

const SCAN_DIRS = ['services', 'hooks', 'utils', 'store', 'api'];

/**
 * Lista curada: regras de domínio QA/Agile (validação, métricas, Jira, integridade, STLC).
 * - Termina com `/` → inclui todo o subtree (prefixo).
 * - Caso contrário → arquivo exato.
 *
 * De fora de propósito (infra ou baixa densidade de regra de negócio), mas podem ser
 * incluídos com `--only=` ou `--all`: p.ex. `utils/rateLimiter.ts`, `services/supabaseCircuitBreaker.ts`,
 * `api/supabaseProxy.ts`, `hooks/useAutoSave.ts`, `utils/savedFiltersService.ts`, `services/dbService.ts`.
 */
const CURATED_INCLUDE_PATHS = [
  'utils/validation.ts',
  'utils/dataIntegrityService.ts',
  'utils/bugAutoCreation.ts',
  'utils/jiraStatusCategorizer.ts',
  'utils/taskHelpers.ts',
  'utils/projectDashboardDeterministicMetrics.ts',
  'utils/testPyramidFromCases.ts',
  'utils/workspaceAnalytics.ts',
  'utils/estimationService.ts',
  'utils/checklistService.ts',
  'utils/stlcPhaseDetector.ts',
  'hooks/useProjectMetrics.ts',
  'hooks/useQualityMetrics.ts',
  'hooks/useTaskFilters.ts',
  'services/taskTestStatusService.ts',
  'services/backupService.ts',
  'services/jira/syncJiraProject.ts',
  'services/ai/testGenerationValidators.ts',
  'store/middleware.ts',
];

const argv = process.argv.slice(2);
const USE_AI = argv.includes('--ai');
const USE_ALL = argv.includes('--all');
/** Padrão: um arquivo .md por módulo (fonte). */
const PER_MODULE = !argv.includes('--per-export');
const ONLY_ARG = argv.find((a) => a.startsWith('--only='));
const ONLY_PATHS = ONLY_ARG ? ONLY_ARG.slice('--only='.length).split(',').map((s) => s.trim().replace(/\\/g, '/')).filter(Boolean) : null;

const MAX_EXPORTS_PER_FILE = 60;

/** @type {Set<string>} */
let ENTITY_NAMES = new Set();

function loadEntityNames() {
  if (!fs.existsSync(TYPES_FILE)) return;
  const text = fs.readFileSync(TYPES_FILE, 'utf8');
  for (const m of text.matchAll(/export\s+(?:interface|type|enum)\s+(\w+)/g)) {
    ENTITY_NAMES.add(m[1]);
  }
}

function loadKeyFromDotEnv() {
  for (const name of ['.env.local', '.env']) {
    const envPath = path.join(ROOT, name);
    if (!fs.existsSync(envPath)) continue;
    const text = fs.readFileSync(envPath, 'utf8');
    for (const line of text.split(/\r?\n/)) {
      const m = line.match(/^\s*VITE_GEMINI_API_KEY\s*=\s*(.*)$/);
      if (m) return m[1].trim().replace(/^["']|["']$/g, '');
    }
  }
  return '';
}

function slugify(s) {
  return s
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/[^a-zA-Z0-9-_]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 120) || 'rule';
}

function extractBalancedBraces(content, openBraceIndex) {
  if (openBraceIndex < 0) return '';
  let depth = 0;
  for (let i = openBraceIndex; i < content.length; i++) {
    const c = content[i];
    if (c === '{') depth++;
    else if (c === '}') {
      depth--;
      if (depth === 0) return content.slice(openBraceIndex, i + 1);
    }
  }
  return content.slice(openBraceIndex, Math.min(openBraceIndex + 4000, content.length));
}

/** Fecha `(` em `openParenIndex` (contagem simples; suficiente para assinaturas exportadas). */
function findClosingParen(content, openParenIndex) {
  let depth = 0;
  for (let i = openParenIndex; i < content.length; i++) {
    const c = content[i];
    if (c === '(') depth++;
    else if (c === ')') {
      depth--;
      if (depth === 0) return i;
    }
  }
  return -1;
}

/**
 * `export const name = (async)?` com parâmetros em várias linhas até `) : Tipo? => {`.
 */
function extractConstArrowMultiline(content, seen, results) {
  const headRe = /\bexport\s+const\s+(\w+)\s*=\s*(?:async\s*)?/g;
  let m;
  while ((m = headRe.exec(content)) !== null) {
    const name = m[1];
    if (seen.has(`ca:${name}`)) continue;
    let pos = headRe.lastIndex;
    while (pos < content.length && /\s/.test(content[pos])) pos++;
    if (content[pos] === '<') {
      let d = 0;
      for (; pos < content.length; pos++) {
        if (content[pos] === '<') d++;
        else if (content[pos] === '>') {
          d--;
          if (d === 0) {
            pos++;
            break;
          }
        }
      }
    }
    while (pos < content.length && /\s/.test(content[pos])) pos++;
    if (content[pos] !== '(') continue;
    const closeParen = findClosingParen(content, pos);
    if (closeParen < 0) continue;
    const windowAfter = content.slice(closeParen + 1, closeParen + 1200);
    const arrowMatch = windowAfter.match(/=>\s*\{/);
    if (!arrowMatch) continue;
    const openBrace = closeParen + 1 + arrowMatch.index + arrowMatch[0].length - 1;
    const exportStart = m.index;
    const body = extractBalancedBraces(content, openBrace);
    const snippet = (content.slice(exportStart, openBrace) + body).slice(0, 12000);
    const jsdoc = findPrecedingJsdoc(content, exportStart);
    seen.add(`ca:${name}`);
    results.push({ name, jsdoc, snippet });
  }
}

function findPrecedingJsdoc(content, exportStart) {
  const windowStart = Math.max(0, exportStart - 6000);
  const before = content.slice(windowStart, exportStart);
  const matches = [...before.matchAll(/\/\*\*([\s\S]*?)\*\/\s*$/g)];
  if (matches.length === 0) return '';
  return matches[matches.length - 1][1].trim();
}

function jsdocSummary(jsdoc) {
  if (!jsdoc) return '';
  return jsdoc
    .split(/\n/)
    .map((l) => l.replace(/^\s*\*?\s?/, '').trim())
    .filter((l) => l && !l.startsWith('@'))
    .join(' ')
    .slice(0, 500);
}

function humanizeExportName(name) {
  return name
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/_/g, ' ')
    .trim();
}

function titleCaseWords(s) {
  return s.replace(/\w\S*/g, (w) => w.charAt(0).toUpperCase() + w.slice(1));
}

function parenBalanceOk(expr) {
  let n = 0;
  for (const c of expr) {
    if (c === '(') n++;
    else if (c === ')') n--;
    if (n < 0) return false;
  }
  return n === 0;
}

function extractIfSteps(snippet, max = 12) {
  const steps = [];
  const re = /if\s*\(([^)]{1,200})\)/g;
  let m;
  while ((m = re.exec(snippet)) !== null && steps.length < max) {
    const cond = m[1].replace(/\s+/g, ' ').trim();
    if (cond.length > 8 && parenBalanceOk(cond)) {
      steps.push(`Avaliar condição: \`${cond.slice(0, 180)}${cond.length > 180 ? '…' : ''}\``);
    }
  }
  return steps;
}

function findRelatedEntities(snippet) {
  const found = new Set();
  const re = /\b([A-Z][a-zA-Z0-9]*)\b/g;
  let m;
  while ((m = re.exec(snippet)) !== null) {
    const w = m[1];
    if (ENTITY_NAMES.has(w)) found.add(w);
  }
  return [...found];
}

function collectTsFiles(dir, acc = []) {
  if (!fs.existsSync(dir)) return acc;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (e.name === 'node_modules' || e.name === 'dist' || e.name === 'dev-dist') continue;
      collectTsFiles(full, acc);
    } else if (e.isFile() && /\.tsx?$/.test(e.name) && !/\.(test|spec)\.[jt]sx?$/.test(e.name)) {
      acc.push(full);
    }
  }
  return acc;
}

function underScanRoots(rel) {
  if (rel.startsWith('tests/')) return false;
  return SCAN_DIRS.some((d) => rel === d || rel.startsWith(`${d}/`));
}

function matchesCuratedPath(rel, patterns) {
  for (const p of patterns) {
    const norm = p.replace(/\\/g, '/').replace(/^\.\//, '');
    if (norm.endsWith('/')) {
      if (rel === norm.slice(0, -1) || rel.startsWith(norm)) return true;
    } else if (rel === norm) return true;
  }
  return false;
}

function resolveTargetFiles() {
  const allFiles = [];
  for (const d of SCAN_DIRS) {
    collectTsFiles(path.join(ROOT, d), allFiles);
  }
  const unique = [...new Set(allFiles)];

  if (ONLY_PATHS && ONLY_PATHS.length > 0) {
    const resolved = [];
    for (const p of ONLY_PATHS) {
      const abs = path.join(ROOT, p);
      if (fs.existsSync(abs) && fs.statSync(abs).isFile()) {
        resolved.push(abs);
      } else {
        console.warn(`[extract-business-rules] Ignorado (não encontrado): ${p}`);
      }
    }
    return resolved.filter((abs) => underScanRoots(path.relative(ROOT, abs).replace(/\\/g, '/')));
  }

  if (USE_ALL) {
    return unique.filter((abs) => underScanRoots(path.relative(ROOT, abs).replace(/\\/g, '/')));
  }

  return unique.filter((abs) => {
    const rel = path.relative(ROOT, abs).replace(/\\/g, '/');
    return underScanRoots(rel) && matchesCuratedPath(rel, CURATED_INCLUDE_PATHS);
  });
}

/**
 * @param {string} content
 * @returns {{ name: string, jsdoc: string, snippet: string }[]}
 */
function extractExportedFunctions(content) {
  const results = [];
  const seen = new Set();

  const fnRe = /\bexport\s+(?:async\s+)?function\s+(\w+)\s*(?:<[^>]*>)?\s*\([^)]*\)\s*(?::[^{]+)?\s*\{/g;
  let m;
  while ((m = fnRe.exec(content)) !== null) {
    const name = m[1];
    if (seen.has(`fn:${name}`)) continue;
    const exportStart = m.index;
    const open = content.indexOf('{', m.index);
    const body = extractBalancedBraces(content, open);
    const snippet = (content.slice(exportStart, open) + body).slice(0, 12000);
    const jsdoc = findPrecedingJsdoc(content, exportStart);
    seen.add(`fn:${name}`);
    results.push({ name, jsdoc, snippet });
  }

  extractConstArrowMultiline(content, seen, results);

  const zodRe = /\bexport\s+const\s+(\w+Schema)\s*=\s*z\.object\s*\(\{/g;
  while ((m = zodRe.exec(content)) !== null) {
    const name = m[1];
    if (seen.has(`zod:${name}`)) continue;
    const exportStart = m.index;
    const open = content.indexOf('{', m.index);
    const body = extractBalancedBraces(content, open);
    const snippet = (content.slice(exportStart, open) + body).slice(0, 12000);
    const jsdoc = findPrecedingJsdoc(content, exportStart);
    seen.add(`zod:${name}`);
    results.push({ name, jsdoc, snippet });
  }

  return results;
}

function heuristicRule(relPath, exportName, jsdoc, snippet) {
  const summary = jsdocSummary(jsdoc);
  const title = summary
    ? summary.split(/[.!?]/)[0].slice(0, 80).trim()
    : titleCaseWords(humanizeExportName(exportName));
  const description =
    summary ||
    `Regra derivada da exportação \`${exportName}\` em \`${relPath}\`: lógica e validações implementadas no código.`;
  let steps = extractIfSteps(snippet);
  if (steps.length === 0) {
    steps = [
      'Revisar o trecho de código de origem para condições explícitas (if/else, early returns, filtros).',
      'Confirmar integração com tipos de domínio e serviços referenciados no arquivo.',
    ];
  }
  const related = findRelatedEntities(snippet);
  return { title: title || humanizeExportName(exportName), description, steps, relatedEntities: related };
}

function parseJsonFromModelText(text) {
  const t = (text || '').trim();
  const fence = t.match(/```(?:json)?\s*([\s\S]*?)```/);
  const raw = fence ? fence[1].trim() : t;
  try {
    return JSON.parse(raw);
  } catch {
    const start = raw.indexOf('{');
    const end = raw.lastIndexOf('}');
    if (start >= 0 && end > start) return JSON.parse(raw.slice(start, end + 1));
    throw new Error('JSON inválido');
  }
}

async function callGemini(relPath, exportName, snippet) {
  const apiKey = (process.env.VITE_GEMINI_API_KEY || '').trim() || loadKeyFromDotEnv();
  if (!apiKey) throw new Error('Sem VITE_GEMINI_API_KEY');

  const model = (process.env.VITE_GEMINI_MODEL || 'gemini-2.5-flash').replace(/^models\//, '');
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;
  const prompt = `Arquivo: ${relPath}
Exportação: ${exportName}

Analise o código TypeScript abaixo e responda APENAS com um JSON válido (sem markdown), neste formato exato:
{"title":"título curto em português","description":"1 a 3 frases em português","steps":["passo verificável 1","passo 2"],"relatedEntities":["NomesExatosDeTiposDoDominioSeHouver"]}

Código:
${snippet.slice(0, 14000)}`;

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.2, maxOutputTokens: 2048 },
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = data?.error?.message || res.statusText;
    throw new Error(msg);
  }
  const text = data?.candidates?.[0]?.content?.parts?.map((p) => p.text).join('') || '';
  return parseJsonFromModelText(text);
}

function formatSingleRuleMd({ relPath, title, description, steps, references }) {
  const fmFileOrigin = relPath.replace(/\\/g, '/');
  const lines = [
    '---',
    'tag: business-rule',
    'status: active',
    `file_origin: ${fmFileOrigin}`,
    '---',
    '',
    `# ${title}`,
    '',
    `**Descrição:** ${description}`,
    '',
    '**Lógica Aplicada:**',
    '',
  ];
  for (const s of steps) {
    lines.push(`- [ ] ${s}`);
  }
  lines.push('', '**Referências:**', '');
  if (references.length === 0) lines.push('_Nenhuma entidade tipada detectada automaticamente._');
  else lines.push(references.map((r) => `[[${r}]]`).join(' '));
  lines.push('');
  return lines.join('\n');
}

/**
 * @param {object} p
 * @param {string} p.relPath
 * @param {string} p.moduleTitle
 * @param {string} p.moduleOverview
 * @param {{ exportName: string, title: string, description: string, steps: string[], references: string[] }[]} p.sections
 * @param {string[]} p.mergedReferences
 */
function formatModuleMd({ relPath, moduleTitle, moduleOverview, sections, mergedReferences }) {
  const fmFileOrigin = relPath.replace(/\\/g, '/');
  const lines = [
    '---',
    'tag: business-rule',
    'status: active',
    `file_origin: ${fmFileOrigin}`,
    'aggregate: module',
    '---',
    '',
    `# ${moduleTitle}`,
    '',
    `**Descrição:** ${moduleOverview}`,
    '',
    `**Exportações analisadas:** ${sections.length}`,
    '',
  ];

  for (const sec of sections) {
    lines.push(`## \`${sec.exportName}\``, '', `**Descrição:** ${sec.description}`, '', '**Lógica Aplicada:**', '');
    for (const s of sec.steps) {
      lines.push(`- [ ] ${s}`);
    }
    lines.push('');
    if (sec.references.length > 0) {
      lines.push('**Referências (trecho):**', '', sec.references.map((r) => `[[${r}]]`).join(' '), '', '---', '');
    } else {
      lines.push('**Referências (trecho):** _Nenhuma entidade tipada detectada neste export._', '', '---', '');
    }
  }

  lines.push('**Referências (módulo):**', '');
  if (mergedReferences.length === 0) lines.push('_Nenhuma entidade tipada agregada._');
  else lines.push(mergedReferences.map((r) => `[[${r}]]`).join(' '));
  lines.push('');
  return lines.join('\n');
}

async function describeExport(rel, ex, useAi) {
  if (useAi) {
    try {
      const ai = await callGemini(rel, ex.name, ex.snippet);
      const title = String(ai.title || '').trim();
      const description = String(ai.description || '').trim();
      const steps = Array.isArray(ai.steps) ? ai.steps.map(String) : [];
      let relatedEntities = Array.isArray(ai.relatedEntities) ? ai.relatedEntities.map(String) : [];
      relatedEntities = [...new Set([...relatedEntities, ...findRelatedEntities(ex.snippet)])].filter((x) =>
        ENTITY_NAMES.has(x),
      );
      return { exportName: ex.name, title, description, steps, references: relatedEntities };
    } catch {
      /* fallthrough */
    }
  }
  const h = heuristicRule(rel, ex.name, ex.jsdoc, ex.snippet);
  const related = [...new Set([...h.relatedEntities, ...findRelatedEntities(ex.snippet)])].filter((x) =>
    ENTITY_NAMES.has(x),
  );
  return {
    exportName: ex.name,
    title: h.title,
    description: h.description,
    steps: h.steps,
    references: related,
  };
}

async function main() {
  loadEntityNames();

  const targets = resolveTargetFiles().sort((a, b) => a.localeCompare(b));

  if (targets.length === 0) {
    console.warn('[extract-business-rules] Nenhum arquivo alvo. Use --all, ajuste CURATED_INCLUDE_PATHS ou --only=...');
  }

  fs.mkdirSync(OUT_DIR, { recursive: true });

  /** @type {{ slug: string, title: string, relPath: string, file: string }[]} */
  const indexRows = [];

  for (const abs of targets) {
    const rel = path.relative(ROOT, abs).replace(/\\/g, '/');
    const content = fs.readFileSync(abs, 'utf8');
    let exports = extractExportedFunctions(content);
    if (exports.length > MAX_EXPORTS_PER_FILE) {
      exports = exports.slice(0, MAX_EXPORTS_PER_FILE);
      console.warn(`[extract-business-rules] ${rel}: truncado a ${MAX_EXPORTS_PER_FILE} exportações.`);
    }

    if (exports.length === 0) continue;

    if (PER_MODULE) {
      /** @type {Awaited<ReturnType<typeof describeExport>>[]} */
      const sections = [];
      for (const ex of exports) {
        sections.push(await describeExport(rel, ex, USE_AI));
      }
      const mergedRefs = [...new Set(sections.flatMap((s) => s.references))].sort();
      const base = path.basename(rel, path.extname(rel));
      const moduleTitle = `Módulo: ${titleCaseWords(humanizeExportName(base))}`;
      const moduleOverview = `Agregado de \`${rel}\` com ${sections.length} exportação(ões) relevante(s) (funções, const arrow e schemas Zod \`*Schema\`).`;
      const slug = slugify(rel.replace(/\.tsx?$/, ''));
      const mdName = `${slug}.md`;
      const mdPath = path.join(OUT_DIR, mdName);
      const md = formatModuleMd({
        relPath: rel,
        moduleTitle,
        moduleOverview,
        sections,
        mergedReferences: mergedRefs,
      });
      fs.writeFileSync(mdPath, md, 'utf8');
      indexRows.push({ slug, title: moduleTitle, relPath: rel, file: mdName });
    } else {
      let count = 0;
      for (const ex of exports) {
        if (count >= 40) break;
        const row = await describeExport(rel, ex, USE_AI);
        const baseSlug = slugify(`${path.dirname(rel)}-${ex.name}`);
        const mdName = `${baseSlug}.md`;
        const mdPath = path.join(OUT_DIR, mdName);
        const md = formatSingleRuleMd({
          relPath: rel,
          title: row.title,
          description: row.description,
          steps: row.steps,
          references: row.references,
        });
        fs.writeFileSync(mdPath, md, 'utf8');
        indexRows.push({ slug: baseSlug, title: row.title, relPath: rel, file: mdName });
        count++;
      }
    }
  }

  const scopeHint = ONLY_PATHS
    ? '`--only=` personalizado'
    : USE_ALL
      ? 'todas as pastas services/, hooks/, utils/, store/, api/'
      : 'lista curada `CURATED_INCLUDE_PATHS`';
  const modeHint = PER_MODULE ? 'um .md por módulo (arquivo fonte)' : 'um .md por exportação (até 40 por arquivo)';

  const indexPath = path.join(OUT_DIR, 'Index_Regras.md');
  const indexBody = [
    '---',
    'tag: business-rules-index',
    'status: active',
    '---',
    '',
    '# Índice de Regras de Negócio',
    '',
    `Escopo: ${scopeHint}. Modo: ${modeHint}.`,
    '',
    '| Regra | Arquivo de origem |',
    '| --- | --- |',
    ...indexRows.map((r) => `| [[${r.slug}]] | \`${r.relPath}\` |`),
    '',
  ].join('\n');

  fs.writeFileSync(indexPath, indexBody, 'utf8');

  console.log(
    `[extract-business-rules] ${indexRows.length} nota(s) → ${path.relative(ROOT, OUT_DIR)} | módulo: ${PER_MODULE ? 'sim' : 'não'} | escopo: ${USE_ALL ? 'all' : ONLY_PATHS ? 'only' : 'curated'} | IA: ${USE_AI ? 'sim' : 'não'}`,
  );
}

main().catch((e) => {
  console.error('[extract-business-rules]', e);
  process.exit(1);
});
