import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { criarProjeto, rodarHook, APROVADO } from './apoio.mjs';

const H = 'bloqueio-codigo.mjs';
const escrever = (raiz, arquivo, cwd = raiz) => rodarHook(H, {
  session_id: 's1', cwd, tool_name: 'Write', tool_input: { file_path: arquivo, content: 'x' },
});

test('projeto inativo libera', () => {
  const raiz = criarProjeto({ ativo: false });
  assert.equal(escrever(raiz, join(raiz, 'app.py')).codigo, 0);
  const soGit = criarProjeto({ git: true });
  assert.equal(escrever(soGit, join(soGit, 'app.py')).codigo, 0);
});

test('stdin vazio libera sem erro', () => {
  const r = rodarHook(H, '');
  assert.equal(r.codigo, 0);
  assert.equal(r.stderr, '');
});

test('JSON invalido libera', () => {
  const r = rodarHook(H, '{nao e json');
  assert.equal(r.codigo, 0);
  assert.equal(r.stderr, '');
});

test('sem requisitos bloqueia codigo', () => {
  const raiz = criarProjeto({ ativo: true });
  const r = escrever(raiz, join(raiz, 'app.py'));
  assert.equal(r.codigo, 2);
  assert.match(r.stderr, /\/kit:levantando-requisitos/);
  assert.match(r.stderr, /\/kit:rapido/);
});

test('requisitos pendentes bloqueia', () => {
  const raiz = criarProjeto({ ativo: true, requisitos: true, estado: '---\nrequisitos: pendente\n---\n' });
  assert.equal(escrever(raiz, join(raiz, 'app.py')).codigo, 2);
});

test('estado aprovado sem o arquivo REQUISITOS bloqueia', () => {
  const raiz = criarProjeto({ ativo: true, estado: APROVADO });
  assert.equal(escrever(raiz, join(raiz, 'app.py')).codigo, 2);
});

test('documentacao sempre passa', () => {
  const raiz = criarProjeto({ ativo: true });
  assert.equal(escrever(raiz, join(raiz, 'docs', 'projeto', 'DESENHO.md')).codigo, 0);
  assert.equal(escrever(raiz, join(raiz, 'README.md')).codigo, 0);
});

test('requisitos aprovados libera codigo', () => {
  const raiz = criarProjeto({ ativo: true, requisitos: true, estado: APROVADO });
  assert.equal(escrever(raiz, join(raiz, 'app.py')).codigo, 0);
});

test('interface sem simulado bloqueia', () => {
  const raiz = criarProjeto({ ativo: true, requisitos: true, estado: APROVADO });
  const r = escrever(raiz, join(raiz, 'web', 'Botao.tsx'));
  assert.equal(r.codigo, 2);
  assert.match(r.stderr, /simulado/);
  assert.match(r.stderr, /\/kit:desenhando-solucao/);
});

test('interface com simulado aprovado libera', () => {
  const raiz = criarProjeto({ ativo: true, requisitos: true, estado: '---\nrequisitos: aprovado\nsimulado: aprovado\n---\n' });
  assert.equal(escrever(raiz, join(raiz, 'web', 'Botao.tsx')).codigo, 0);
});

test('simulado nao-se-aplica libera interface', () => {
  const raiz = criarProjeto({ ativo: true, requisitos: true, estado: '---\nrequisitos: aprovado\nsimulado: nao-se-aplica\n---\n' });
  assert.equal(escrever(raiz, join(raiz, 'app', 'templates', 'base.html')).codigo, 0);
});

test('modo rapido dentro do prazo libera; vencido bloqueia', () => {
  const futuro = new Date(Date.now() + 3600 * 1000).toISOString();
  const passado = new Date(Date.now() - 3600 * 1000).toISOString();
  const a = criarProjeto({ ativo: true, rapidoAte: futuro });
  assert.equal(escrever(a, join(a, 'app.py')).codigo, 0);
  const b = criarProjeto({ ativo: true, rapidoAte: passado });
  assert.equal(escrever(b, join(b, 'app.py')).codigo, 2);
});

test('sessao em subpasta acha a raiz', () => {
  const raiz = criarProjeto({ ativo: true });
  mkdirSync(join(raiz, 'src'));
  assert.equal(escrever(raiz, 'views.py', join(raiz, 'src')).codigo, 2);
});

test('caminho Windows com espaco e raiz inexistente libera', () => {
  const r = rodarHook(H, {
    session_id: 's', cwd: 'C:\\Users\\Breno Toledo\\x', tool_name: 'Write',
    tool_input: { file_path: 'C:\\Users\\Breno Toledo\\x\\a.py', content: '' },
  });
  assert.equal(r.codigo, 0);
  assert.equal(r.stderr, '');
});

test('notebook usa notebook_path', () => {
  const raiz = criarProjeto({ ativo: true });
  const r = rodarHook(H, { cwd: raiz, tool_name: 'NotebookEdit', tool_input: { notebook_path: join(raiz, 'a.ipynb') } });
  assert.equal(r.codigo, 2);
});
