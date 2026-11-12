#!/usr/bin/env node
// PreToolUse (escrita de arquivo e Bash): impede gravar ou versionar segredos.
// Vale em qualquer projeto. Qualquer erro interno libera.
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import { lerEntrada, acharRaiz } from './lib/projeto.mjs';

const ENV_MODELOS = ['.env.example', '.env.sample', '.env.modelo', '.env.template'];
const EXT_SECRETAS = ['.pem', '.pfx', '.p12'];
const NOMES_SECRETOS = ['id_rsa', 'id_ed25519'];

const PADROES = [
  ['chave privada', /-----BEGIN [A-Z ]*PRIVATE KEY-----/],
  ['chave de acesso da AWS', /AKIA[0-9A-Z]{16}/],
  ['chave da API da Anthropic', /sk-ant-[A-Za-z0-9_-]{20,}/],
  ['token do GitHub', /ghp_[A-Za-z0-9]{36}/],
];
const ATRIBUICAO = /(password|passwd|senha|secret|token|api_?key)\w*["']?\s*[:=]\s*(["'])([^"'\r\n]{8,})\2/gi;
const VALOR_INOCENTE = /\$\{|<|os\.environ|process\.env|exemplo|example|changeme|xxxx/i;

export function nomeSecreto(caminho) {
  const nome = String(caminho).replace(/\\/g, '/').split('/').pop().toLowerCase();
  if (nome === '.env') return true;
  if (nome.startsWith('.env.')) return !ENV_MODELOS.includes(nome);
  if (NOMES_SECRETOS.includes(nome)) return true;
  return EXT_SECRETAS.some((e) => nome.endsWith(e));
}

// Devolve o tipo de segredo encontrado, nunca o valor.
export function acharSegredo(texto) {
  if (!texto || typeof texto !== 'string') return null;
  for (const [tipo, padrao] of PADROES) if (padrao.test(texto)) return tipo;
  for (const m of texto.matchAll(ATRIBUICAO)) {
    const valor = m[3];
    if (VALOR_INOCENTE.test(valor) || /^\*+$/.test(valor)) continue;
    return 'senha ou token escrito no código';
  }
  return null;
}

function textosDaEscrita(ti) {
  const lista = [ti.content, ti.new_string, ti.new_source];
  if (Array.isArray(ti.edits)) for (const e of ti.edits) lista.push(e?.new_string);
  return lista.filter((t) => typeof t === 'string');
}

function decidirEscrita(ti) {
  const caminho = ti.file_path ?? ti.notebook_path;
  if (caminho && nomeSecreto(caminho)) return 'arquivo de segredos';
  for (const t of textosDaEscrita(ti)) {
    const tipo = acharSegredo(t);
    if (tipo) return tipo;
  }
  return null;
}

function decidirBash(comando, cwd) {
  if (typeof comando !== 'string' || !/\bgit\s+(add|commit)\b/.test(comando)) return null;
  // A mensagem do commit é texto livre: não conta como lista de arquivos.
  const semMensagem = comando.replace(/(-m|--message)(\s+|=)("[^"]*"|'[^']*'|\S+)/g, ' ');
  const palavras = semMensagem.split(/[\s;&|]+/).map((p) => p.replace(/^["']|["']$/g, ''));
  if (palavras.some((p) => p && !p.startsWith('-') && nomeSecreto(p))) return 'arquivo de segredos no commit';
  const tudo = /\bgit\s+add\s+(-A|--all|\.)(?=\s|$|[;&|])/.test(comando) || /\bgit\s+commit\s+(?:-[a-zA-Z]*a[a-zA-Z]*|--all)\b/.test(comando);
  if (!tudo) return null;
  const raiz = acharRaiz(cwd) ?? cwd;
  if (!raiz || !existsSync(join(raiz, '.env'))) return null;
  const r = spawnSync('git', ['check-ignore', '-q', '.env'], { cwd: raiz, timeout: 3000 });
  if (r.status === 1) return '.env seria incluído no commit; adicione .env ao .gitignore antes';
  return null;
}

export function decidir(entrada) {
  const ti = entrada?.tool_input;
  if (!ti || typeof ti !== 'object') return null;
  if (entrada.tool_name === 'Bash') return decidirBash(ti.command, entrada.cwd);
  return decidirEscrita(ti);
}

const chamadoDireto = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (chamadoDireto) {
  try {
    const motivo = decidir(await lerEntrada());
    if (motivo) {
      process.stderr.write(`Bloqueado pelo kit: possível segredo (${motivo}). Guarde o valor em variável de ambiente.\n`);
      process.exitCode = 2;
    }
  } catch {
    process.exitCode = 0;
  }
}
