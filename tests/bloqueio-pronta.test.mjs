import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { criarProjeto, rodarHook, APROVADO } from './apoio.mjs';

const H = 'bloqueio-pronta.mjs';
const git = (raiz, ...a) => spawnSync('git', ['-c', 'user.name=t', '-c', 'user.email=t@t', ...a], { cwd: raiz, encoding: 'utf8' });
const tarefa = (status, seguranca = 'pendente') =>
  `---\nstatus: ${status}\nresponsavel: claude\ndepende_de: []\ncontratos: [pedidos]\nexecutor: claude\nseguranca: ${seguranca}\n---\n\n# Tarefa 001\n`;

// Projeto ativo, com a tarefa 001 já assumida (commit com status em-andamento).
function projeto() {
  const raiz = criarProjeto({ ativo: true, requisitos: true, estado: APROVADO });
  mkdirSync(join(raiz, 'docs', 'projeto', 'tarefas'), { recursive: true });
  git(raiz, 'init', '-q');
  const arq = join(raiz, 'docs', 'projeto', 'tarefas', '001-criar-pedido.md');
  writeFileSync(arq, tarefa('pendente'));
  git(raiz, 'add', '-A'); git(raiz, 'commit', '-q', '-m', 'plano');
  writeFileSync(arq, tarefa('em-andamento'));
  git(raiz, 'add', '-A'); git(raiz, 'commit', '-q', '-m', 'assume 001');
  return { raiz, arq };
}
const gravar = (raiz, arq, content) => rodarHook(H, { cwd: raiz, tool_name: 'Write', tool_input: { file_path: arq, content } });
const editar = (raiz, arq, new_string) => rodarHook(H, { cwd: raiz, tool_name: 'Edit', tool_input: { file_path: arq, old_string: 'x', new_string } });

test('pronta sem teste alterado bloqueia', () => {
  const { raiz, arq } = projeto();
  writeFileSync(join(raiz, 'pedidos.py'), 'x = 1\n');
  const r = gravar(raiz, arq, tarefa('pronta', 'ok'));
  assert.equal(r.codigo, 2);
  assert.match(r.stderr, /teste/);
});

test('pronta sem seguranca ok bloqueia', () => {
  const { raiz, arq } = projeto();
  mkdirSync(join(raiz, 'tests'));
  writeFileSync(join(raiz, 'tests', 'test_pedidos.py'), 'def test_a(): pass\n');
  const r = gravar(raiz, arq, tarefa('pronta', 'pendente'));
  assert.equal(r.codigo, 2);
  assert.match(r.stderr, /\/kit:verificando-seguranca/);
});

test('pronta com teste novo e seguranca ok libera', () => {
  const { raiz, arq } = projeto();
  mkdirSync(join(raiz, 'tests'));
  writeFileSync(join(raiz, 'tests', 'test_pedidos.py'), 'def test_a(): pass\n');
  assert.equal(gravar(raiz, arq, tarefa('pronta', 'ok')).codigo, 0);
});

test('teste ja commitado depois de assumir a tarefa conta', () => {
  const { raiz, arq } = projeto();
  writeFileSync(join(raiz, 'pedidos.test.mjs'), '// teste\n');
  writeFileSync(arq, tarefa('em-revisao', 'ok'));
  git(raiz, 'add', '-A'); git(raiz, 'commit', '-q', '-m', 'implementa 001');
  assert.equal(gravar(raiz, arq, tarefa('pronta', 'ok')).codigo, 0);
});

test('Edit que muda so o status usa a seguranca gravada no arquivo', () => {
  const { raiz, arq } = projeto();
  writeFileSync(join(raiz, 'pedidos_test.go'), '// teste\n');
  assert.equal(editar(raiz, arq, 'status: pronta').codigo, 2);
  writeFileSync(arq, tarefa('em-revisao', 'ok'));
  assert.equal(editar(raiz, arq, 'status: pronta').codigo, 0);
});

test('outros status e outros arquivos passam', () => {
  const { raiz, arq } = projeto();
  assert.equal(gravar(raiz, arq, tarefa('em-revisao')).codigo, 0);
  assert.equal(gravar(raiz, join(raiz, 'docs', 'projeto', 'PLANO.md'), 'status: pronta').codigo, 0);
  assert.equal(gravar(raiz, join(raiz, 'notas.md'), '---\nstatus: pronta\n---\n').codigo, 0);
});

test('texto que cita pronta fora do cabecalho nao bloqueia', () => {
  const { raiz, arq } = projeto();
  assert.equal(gravar(raiz, arq, tarefa('em-revisao') + '\nQuando ficar com status: pronta, avisar.\n').codigo, 0);
});

test('projeto inativo, stdin vazio e pasta sem git liberam', () => {
  const r = rodarHook(H, '');
  assert.equal(r.codigo, 0);
  assert.equal(r.stderr, '');
  const inativo = criarProjeto({ ativo: false });
  mkdirSync(join(inativo, 'docs', 'projeto', 'tarefas'), { recursive: true });
  assert.equal(gravar(inativo, join(inativo, 'docs', 'projeto', 'tarefas', '001-a.md'), tarefa('pronta')).codigo, 0);
  const semGit = criarProjeto({ ativo: true });
  mkdirSync(join(semGit, 'docs', 'projeto', 'tarefas'), { recursive: true });
  assert.equal(gravar(semGit, join(semGit, 'docs', 'projeto', 'tarefas', '001-a.md'), tarefa('pronta', 'ok')).codigo, 0);
});

test('caminho com barra invertida e CRLF', () => {
  const { raiz, arq } = projeto();
  const r = gravar(raiz, 'docs\\projeto\\tarefas\\001-criar-pedido.md', tarefa('pronta', 'ok').replace(/\n/g, '\r\n'));
  assert.equal(r.codigo, 2, 'sem teste alterado deve bloquear também com CRLF e barra invertida');
});

test('modelo de tarefa tem em-revisao e seguranca', () => {
  const m = readFileSync(new URL('../plugins/kit/modelos/projeto/tarefa.md', import.meta.url), 'utf8');
  assert.match(m, /^seguranca: pendente$/m);
  assert.match(m, /em-revisao/);
});
