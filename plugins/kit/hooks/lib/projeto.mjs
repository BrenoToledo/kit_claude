// Funções comuns aos hooks do kit. Sem dependências; só leitura, exceto ligar/desligarRapido.
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';

const LIVRE_PASTAS = ['docs/', '.claude/', '.github/'];
const LIVRE_EXT = ['.md', '.txt', '.json', '.yaml', '.yml', '.toml', '.ini', '.cfg', '.lock', '.gitignore', '.csv'];
const INTERFACE_EXT = ['.html', '.htm', '.css', '.scss', '.sass', '.less', '.jsx', '.tsx', '.vue', '.svelte'];

export async function lerEntrada() {
  try {
    if (process.stdin.isTTY) return null;
    let texto = '';
    for await (const parte of process.stdin) texto += parte;
    if (!texto.trim()) return null;
    const dado = JSON.parse(texto);
    return dado && typeof dado === 'object' ? dado : null;
  } catch {
    return null;
  }
}

function subir(inicio, marcador) {
  let atual = inicio;
  for (let i = 0; i < 64; i++) {
    if (existsSync(join(atual, marcador))) return atual;
    const pai = dirname(atual);
    if (pai === atual) return null;
    atual = pai;
  }
  return null;
}

export function acharRaiz(cwd) {
  if (!cwd || typeof cwd !== 'string' || !existsSync(cwd)) return null;
  return subir(cwd, join('.claude', 'kit-estado.json')) ?? subir(cwd, '.git');
}

export function projetoAtivo(raiz) {
  try {
    const dado = JSON.parse(readFileSync(join(raiz, '.claude', 'kit-estado.json'), 'utf8'));
    return dado?.ativo === true;
  } catch {
    return false;
  }
}

// Lê as linhas `chave: valor` do cabeçalho entre o primeiro par de `---`. Tolera CRLF.
export function lerCabecalho(texto) {
  const bloco = String(texto ?? '').replace(/^\uFEFF/, '').match(/^---[ \t]*\r?\n([\s\S]*?)\r?\n---/);
  if (!bloco) return {};
  const campos = {};
  for (const linha of bloco[1].split(/\r?\n/)) {
    const m = linha.match(/^\s*([^:#\s][^:]*?)\s*:\s*(.*?)\s*$/);
    if (m) campos[m[1].toLowerCase()] = m[2];
  }
  return campos;
}

export function lerEstado(raiz) {
  try {
    return lerCabecalho(readFileSync(join(raiz, 'docs', 'projeto', 'ESTADO.md'), 'utf8'));
  } catch {
    return {};
  }
}

const arquivoRapido = (raiz) => join(raiz, '.claude', 'kit-rapido');

export function modoRapido(raiz, agora = new Date()) {
  try {
    const ate = Date.parse(readFileSync(arquivoRapido(raiz), 'utf8').trim());
    return Number.isFinite(ate) && ate > agora.getTime();
  } catch {
    return false;
  }
}

export function ligarRapido(raiz, horas = 4) {
  const ate = new Date(Date.now() + horas * 3600 * 1000).toISOString();
  mkdirSync(join(raiz, '.claude'), { recursive: true });
  writeFileSync(arquivoRapido(raiz), ate + '\n');
  return ate;
}

export function desligarRapido(raiz) {
  mkdirSync(join(raiz, '.claude'), { recursive: true });
  writeFileSync(arquivoRapido(raiz), new Date(0).toISOString() + '\n');
}

const normal = (p) => String(p).replace(/\\/g, '/').toLowerCase();

export function classificar(caminho, raiz) {
  let rel = normal(caminho);
  const base = raiz ? normal(raiz).replace(/\/+$/, '') + '/' : null;
  if (base && rel.startsWith(base)) rel = rel.slice(base.length);
  rel = rel.replace(/^\.\//, '');
  const nome = rel.slice(rel.lastIndexOf('/') + 1);
  const ponto = nome.lastIndexOf('.');
  const ext = ponto >= 0 ? nome.slice(ponto) : '';
  if (LIVRE_PASTAS.some((p) => rel.startsWith(p)) || LIVRE_EXT.includes(ext)) return 'livre';
  if (INTERFACE_EXT.includes(ext) || /(^|\/)(templates|static)\//.test(rel)) return 'interface';
  return 'codigo';
}
