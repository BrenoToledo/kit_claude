#!/usr/bin/env node
// PreToolUse (Write|Edit|MultiEdit): uma tarefa só vira `pronta` com teste alterado
// desde que foi assumida e com `seguranca: ok`. Qualquer erro interno libera.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { lerEntrada, acharRaiz, projetoAtivo, lerCabecalho, registrarEvento } from './lib/projeto.mjs';

const TAREFA = /^docs\/projeto\/tarefas\/[^/]+\.md$/;
const PASTA_TESTE = /(^|\/)(tests?|__tests__|specs?)\//i;
const NOME_TESTE = /(^|\/)(test_[^/]*|[^/]*_test\.[a-z0-9]+|[^/]*\.(test|spec)\.[a-z0-9]+)$/i;

const barras = (p) => String(p).replace(/\\/g, '/');
const absoluto = (p) => /^([a-zA-Z]:)?\//.test(p);

function relativo(caminho, raiz, cwd) {
  let c = barras(caminho);
  if (!absoluto(c)) c = barras(join(cwd ?? raiz, c));
  const base = barras(raiz).replace(/\/+$/, '') + '/';
  return c.toLowerCase().startsWith(base.toLowerCase()) ? c.slice(base.length) : null;
}

function git(raiz, ...args) {
  const r = spawnSync('git', args, { cwd: raiz, encoding: 'utf8', timeout: 5000 });
  if (r.status !== 0) throw new Error('git');
  return r.stdout.split('\n').map((l) => l.trim()).filter(Boolean);
}

// Arquivos alterados desde o commit em que a tarefa passou a `em-andamento`.
function alteradosDesdeOInicio(raiz, rel) {
  const inicio = git(raiz, 'log', '--format=%H', '-S', 'status: em-andamento', '--', rel).pop();
  const diff = inicio ? git(raiz, 'diff', '--name-only', inicio) : git(raiz, 'diff', '--name-only', 'HEAD');
  return [...diff, ...git(raiz, 'ls-files', '--others', '--exclude-standard')];
}

function decidir(entrada) {
  const ti = entrada?.tool_input;
  const caminho = ti?.file_path;
  if (!caminho || typeof caminho !== 'string') return null;
  const raiz = acharRaiz(entrada.cwd);
  if (!raiz || !projetoAtivo(raiz)) return null;
  const rel = relativo(caminho, raiz, entrada.cwd);
  if (!rel || !TAREFA.test(rel.toLowerCase())) return null;

  let novo;      // cabeçalho que resultará da escrita, até onde dá para saber
  if (typeof ti.content === 'string') {
    novo = lerCabecalho(ti.content);
  } else {
    const trechos = [ti.new_string, ...(Array.isArray(ti.edits) ? ti.edits.map((e) => e?.new_string) : [])]
      .filter((t) => typeof t === 'string').join('\n');
    let atual = {};
    try { atual = lerCabecalho(readFileSync(join(raiz, rel), 'utf8')); } catch { /* arquivo novo */ }
    novo = { ...atual };
    const st = trechos.match(/^\s*status\s*:\s*(\S+)/m);
    const sg = trechos.match(/^\s*seguranca\s*:\s*(\S+)/m);
    if (st) novo.status = st[1];
    if (sg) novo.seguranca = sg[1];
    if (!st) return null;
  }
  if (novo.status !== 'pronta') return null;

  if (novo.seguranca !== 'ok') {
    return 'Bloqueado pelo kit: tarefa sem verificação de segurança. Rode /kit:verificando-seguranca; ela grava `seguranca: ok` quando não há achado em aberto.';
  }
  let alterados;
  try {
    alterados = alteradosDesdeOInicio(raiz, rel);
  } catch {
    return null; // sem git não há como conferir: libera
  }
  if (!alterados.some((a) => PASTA_TESTE.test(barras(a)) || NOME_TESTE.test(barras(a)))) {
    return 'Bloqueado pelo kit: nenhum arquivo de teste mudou desde que a tarefa foi assumida. Escreva o teste que prova o critério de pronto (regra 4) e rode /kit:revisando de novo.';
  }
  return null;
}

try {
  const entrada = await lerEntrada();
  const motivo = decidir(entrada);
  if (motivo) {
    registrarEvento(acharRaiz(entrada?.cwd), 'bloqueio_pronta');
    process.stderr.write(motivo + '\n');
    process.exitCode = 2;
  }
} catch {
  process.exitCode = 0;
}
