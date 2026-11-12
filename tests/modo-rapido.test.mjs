import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { criarProjeto, rodarHook } from './apoio.mjs';

const escrever = (raiz) => rodarHook('bloqueio-codigo.mjs', { cwd: raiz, tool_name: 'Write', tool_input: { file_path: join(raiz, 'app.py'), content: '' } });

test('ligar grava data futura e bloqueio-codigo passa a liberar', () => {
  const raiz = criarProjeto({ ativo: true });
  assert.equal(escrever(raiz).codigo, 2);
  const r = rodarHook('modo-rapido.mjs', '', ['ligar', '--raiz', raiz]);
  assert.equal(r.codigo, 0);
  assert.match(r.stdout, /Modo rápido ligado até/);
  assert.equal(escrever(raiz).codigo, 0);
});

test('desligar volta a bloquear', () => {
  const raiz = criarProjeto({ ativo: true });
  rodarHook('modo-rapido.mjs', '', ['ligar', '--raiz', raiz]);
  const r = rodarHook('modo-rapido.mjs', '', ['desligar', '--raiz', raiz]);
  assert.match(r.stdout, /Modo rápido desligado\./);
  assert.equal(escrever(raiz).codigo, 2);
});

test('usa a pasta atual quando --raiz falta', () => {
  const raiz = criarProjeto({ ativo: true });
  const r = rodarHook('modo-rapido.mjs', '', ['ligar'], { cwd: raiz });
  assert.equal(r.codigo, 0);
  assert.equal(escrever(raiz).codigo, 0);
});

test('sem raiz sai com 1', () => {
  const r = rodarHook('modo-rapido.mjs', '', ['ligar'], { cwd: mkdtempSync(join(tmpdir(), 'vazio-')) });
  assert.equal(r.codigo, 1);
  assert.match(r.stdout, /Nenhum projeto encontrado\./);
});

test('acao desconhecida sai com 1', () => {
  const raiz = criarProjeto({ ativo: true });
  assert.equal(rodarHook('modo-rapido.mjs', '', ['talvez', '--raiz', raiz]).codigo, 1);
});
