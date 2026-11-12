import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync, mkdirSync, copyFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { lerEstado } from '../plugins/kit/hooks/lib/projeto.mjs';

const M = join(dirname(fileURLToPath(import.meta.url)), '..', 'plugins', 'kit', 'modelos');
const ler = (...p) => readFileSync(join(M, ...p), 'utf8');

test('todos os modelos existem', () => {
  for (const a of ['AGENTS.md', 'CLAUDE.md', 'projeto/ESTADO.md', 'projeto/REQUISITOS.md', 'projeto/DESENHO.md',
    'projeto/PLANO.md', 'projeto/DECISOES.md', 'projeto/contrato.md', 'projeto/tarefa.md']) {
    assert.ok(existsSync(join(M, a)), `falta ${a}`);
  }
});

test('ESTADO modelo e lido por lerEstado', () => {
  const raiz = mkdtempSync(join(tmpdir(), 'kit-'));
  mkdirSync(join(raiz, 'docs', 'projeto'), { recursive: true });
  copyFileSync(join(M, 'projeto', 'ESTADO.md'), join(raiz, 'docs', 'projeto', 'ESTADO.md'));
  assert.deepEqual(lerEstado(raiz), {
    fase: 'requisitos', requisitos: 'pendente', simulado: 'pendente', proxima: 'rode /kit:levantando-requisitos',
  });
});

test('AGENTS tem nove regras numeradas', () => {
  assert.equal((ler('AGENTS.md').match(/^[1-9]\. \*\*/gm) || []).length, 9);
  assert.ok(!/claude code/i.test(ler('AGENTS.md')), 'AGENTS.md não pode depender do Claude Code');
});

test('CLAUDE tem menos de 100 linhas', () => {
  assert.ok(ler('CLAUDE.md').split('\n').length < 100);
  assert.match(ler('CLAUDE.md'), /AGENTS\.md/);
});

test('contrato e tarefa tem os campos de frontmatter', () => {
  const c = ler('projeto', 'contrato.md');
  for (const campo of ['nome:', 'status:']) assert.ok(c.includes(campo), campo);
  for (const s of ['Quem fornece', 'Quem consome', 'Entrada', 'Saída', 'Erros', 'Exemplo']) assert.match(c, new RegExp(`^## ${s}`, 'm'));
  const t = ler('projeto', 'tarefa.md');
  for (const campo of ['status:', 'responsavel:', 'depende_de:', 'contratos:', 'executor:']) assert.ok(t.includes(campo), campo);
  for (const s of ['Objetivo', 'Critério de pronto', 'Teste que prova', 'Notas']) assert.match(t, new RegExp(`^## ${s}`, 'm'));
});

test('REQUISITOS e DESENHO tem as secoes', () => {
  const r = ler('projeto', 'REQUISITOS.md');
  for (const s of ['Pedido original', 'Arquétipo', 'Respostas', 'Perfil de segurança', 'Ordem de construção', 'Fora de escopo', 'Aprovação']) assert.match(r, new RegExp(`^## ${s}`, 'm'));
  const d = ler('projeto', 'DESENHO.md');
  for (const s of ['Visão geral', 'Partes e responsabilidades', 'Contratos', 'Telas', 'Decisões']) assert.match(d, new RegExp(`^## ${s}`, 'm'));
});
