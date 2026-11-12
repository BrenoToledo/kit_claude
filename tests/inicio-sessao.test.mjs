import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { criarProjeto, rodarHook } from './apoio.mjs';

const H = 'inicio-sessao.mjs';
const iniciar = (cwd) => rodarHook(H, { session_id: 's', cwd, hook_event_name: 'SessionStart' });

test('projeto ativo mostra fase e proxima acao', () => {
  const raiz = criarProjeto({ ativo: true, estado: '---\nfase: desenho\nproxima: rode /kit:desenhando-solucao\n---\n' });
  const r = iniciar(raiz);
  assert.equal(r.codigo, 0);
  assert.match(r.stdout, /Fase: desenho\./);
  assert.match(r.stdout, /Próxima ação: rode \/kit:desenhando-solucao\./);
  assert.match(r.stdout, /docs\/projeto\/ESTADO\.md/);
});

test('projeto ativo sem ESTADO sugere levantando-requisitos', () => {
  const r = iniciar(criarProjeto({ ativo: true }));
  assert.match(r.stdout, /Fase: não iniciada\./);
  assert.match(r.stdout, /\/kit:levantando-requisitos/);
});

test('projeto inativo sugere setup', () => {
  const r = iniciar(criarProjeto({ git: true }));
  assert.equal(r.codigo, 0);
  assert.match(r.stdout, /\/kit:setup/);
});

test('sem raiz nao imprime', () => {
  const r = iniciar(mkdtempSync(join(tmpdir(), 'vazio-')));
  assert.equal(r.codigo, 0);
  assert.equal(r.stdout, '');
});

test('saida tem no maximo 6 linhas', () => {
  const raiz = criarProjeto({ ativo: true, estado: '---\nfase: plano\nproxima: a\n---\n' });
  assert.ok(iniciar(raiz).stdout.trim().split('\n').length <= 6);
});

test('stdin vazio sai com 0', () => {
  const r = rodarHook(H, '', [], { cwd: mkdtempSync(join(tmpdir(), 'vazio-')) });
  assert.equal(r.codigo, 0);
  assert.equal(r.stderr, '');
});
