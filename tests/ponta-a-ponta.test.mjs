// Percorre o caminho de um projeto com os hooks reais e os modelos reais:
// setup → bloqueio → requisitos aprovados → tela bloqueada → simulado aprovado → liberado.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync, readFileSync, cpSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { rodarHook } from './apoio.mjs';

const MODELOS = join(dirname(fileURLToPath(import.meta.url)), '..', 'plugins', 'kit', 'modelos');

test('do setup ao codigo liberado', () => {
  const raiz = mkdtempSync(join(tmpdir(), 'e2e-'));
  spawnSync('git', ['init', '-q'], { cwd: raiz });
  const escrever = (arq) => rodarHook('bloqueio-codigo.mjs', { cwd: raiz, tool_name: 'Write', tool_input: { file_path: join(raiz, arq), content: '' } });
  const inicio = () => rodarHook('inicio-sessao.mjs', { cwd: raiz }).stdout;
  const estado = join(raiz, 'docs', 'projeto', 'ESTADO.md');
  const trocar = (de, para) => writeFileSync(estado, readFileSync(estado, 'utf8').replace(de, para));

  // antes do setup: só sugere, não bloqueia
  assert.match(inicio(), /\/kit:setup/);
  assert.equal(escrever('app.py').codigo, 0);

  // o que a skill setup faz
  mkdirSync(join(raiz, '.claude'));
  writeFileSync(join(raiz, '.claude', 'kit-estado.json'), JSON.stringify({ ativo: true, versao: '0.1.0', tipo: 'nenhum' }));
  cpSync(join(MODELOS, 'projeto', 'ESTADO.md'), estado, { recursive: true });
  cpSync(join(MODELOS, 'AGENTS.md'), join(raiz, 'AGENTS.md'));
  const d = JSON.parse(rodarHook('diagnostico.mjs', '', ['--raiz', raiz, '--home', raiz]).stdout);
  assert.equal(d.kitAtivo, true);
  assert.equal(d.estadoProjeto, true);

  // depois do setup: orienta e bloqueia código
  assert.match(inicio(), /Fase: requisitos\./);
  assert.equal(escrever('app.py').codigo, 2);
  assert.equal(escrever('docs/projeto/REQUISITOS.md').codigo, 0);

  // o que a skill levantando-requisitos faz ao receber o sim
  cpSync(join(MODELOS, 'projeto', 'REQUISITOS.md'), join(raiz, 'docs', 'projeto', 'REQUISITOS.md'));
  assert.equal(escrever('app.py').codigo, 2, 'arquivo sem aprovação ainda bloqueia');
  trocar('requisitos: pendente', 'requisitos: aprovado');
  trocar('fase: requisitos', 'fase: desenho');
  assert.equal(escrever('app.py').codigo, 0);
  assert.match(inicio(), /Fase: desenho\./);

  // tela só depois do simulado
  assert.equal(escrever('web/Pedido.tsx').codigo, 2);
  trocar('simulado: pendente', 'simulado: aprovado');
  assert.equal(escrever('web/Pedido.tsx').codigo, 0);

  // segredo continua bloqueado em qualquer fase
  const s = rodarHook('bloqueio-segredos.mjs', { cwd: raiz, tool_name: 'Write', tool_input: { file_path: join(raiz, 'settings.py'), content: 'SECRET_KEY = "django-insecure-9f8a7s6d5f4"' } });
  assert.equal(s.codigo, 2);
});

test('hook responde em menos de meio segundo, contando a partida do Node', () => {
  const raiz = mkdtempSync(join(tmpdir(), 'e2e-'));
  const t0 = performance.now();
  for (let i = 0; i < 5; i++) rodarHook('bloqueio-codigo.mjs', { cwd: raiz, tool_name: 'Write', tool_input: { file_path: 'a.py' } });
  const media = (performance.now() - t0) / 5;
  assert.ok(media < 500, `média de ${media.toFixed(0)} ms por chamada, incluindo a partida do Node`);
});
