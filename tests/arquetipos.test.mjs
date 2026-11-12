import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const S = join(dirname(fileURLToPath(import.meta.url)), '..', 'plugins', 'kit', 'skills', 'levantando-requisitos');
const NOMES = ['crud-interno', 'api-publica', 'ingestao-dados', 'backend-para-front', 'webhooks', 'script-pontual'];

test('os seis arquetipos existem, com secoes e de 6 a 10 perguntas', () => {
  for (const n of NOMES) {
    const t = readFileSync(join(S, 'arquetipos', `${n}.md`), 'utf8');
    for (const s of ['Quando é este', 'Perguntas', 'Erros comuns se pular']) assert.match(t, new RegExp(`^## ${s}`, 'm'), `${n}: ${s}`);
    const bloco = t.split(/^## Perguntas.*$/m)[1].split(/^## /m)[0];
    const q = (bloco.match(/^\d+\. /gm) || []).length;
    assert.ok(q >= 6 && q <= 10, `${n} tem ${q} perguntas`);
  }
});

test('tabela da skill e pasta de arquetipos batem', () => {
  const skill = readFileSync(join(S, 'SKILL.md'), 'utf8');
  const citados = [...skill.matchAll(/arquetipos\/([a-z-]+)\.md/g)].map((m) => m[1]);
  assert.deepEqual([...new Set(citados)].sort(), [...NOMES].sort());
  assert.deepEqual(readdirSync(join(S, 'arquetipos')).map((f) => f.replace('.md', '')).sort(), [...NOMES].sort());
});
