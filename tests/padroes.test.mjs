import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync, writeFileSync, mkdirSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { criarProjeto, rodarHook, APROVADO } from './apoio.mjs';

const KIT = join(dirname(fileURLToPath(import.meta.url)), '..', 'plugins', 'kit');
const ler = (...p) => readFileSync(join(KIT, ...p), 'utf8');
const PADROES = ['LOG.md', 'RUN.md', 'TESTE.md', 'CONFIG.md', 'SAUDE.md', 'QUALIDADE.md', 'CONTAINER.md', 'CI-CD.md'];

test('todos os padroes existem e nao dependem de linguagem', () => {
  for (const p of PADROES) {
    const t = ler('modelos', 'padroes', p);
    assert.match(t, /^# Padrão/m, p);
    assert.ok(t.split(/\s+/).length < 900, `${p} longo demais`);
  }
  assert.match(ler('modelos', 'padroes', 'QUALIDADE.md'), /SonarQube/);
  assert.match(ler('modelos', 'padroes', 'QUALIDADE.md'), /lint/i);
  assert.match(ler('modelos', 'padroes', 'CI-CD.md'), /test\.config/);
  assert.match(ler('modelos', 'padroes', 'CONFIG.md'), /\.env\.example/);
  assert.match(ler('modelos', 'padroes', 'SAUDE.md'), /\/saude/);
});

test('levantamento pergunta sobre lint, SonarQube, container e CI/CD', () => {
  const q = ler('skills', 'levantando-requisitos', 'perguntas-qualidade.md');
  for (const termo of [/lint/i, /SonarQube/, /cont[êe]iner|container/i, /CI\/CD|integração contínua/i]) assert.match(q, termo);
  assert.match(ler('skills', 'levantando-requisitos', 'SKILL.md'), /perguntas-qualidade\.md/);
  assert.match(ler('modelos', 'projeto', 'REQUISITOS.md'), /^## Qualidade e entrega/m);
});

test('setup copia a pasta de padroes e AGENTS lista os padroes', () => {
  assert.match(ler('skills', 'setup', 'SKILL.md'), /modelos\/padroes\//);
  const a = ler('modelos', 'AGENTS.md');
  for (const p of PADROES) assert.ok(a.includes(p), p);
});

test('test.bat usa CRLF, so ASCII e le test.config', () => {
  const bat = readFileSync(join(KIT, 'modelos', 'teste', 'test.bat'));
  const t = bat.toString('latin1');
  assert.ok(t.includes('\r\n') && !t.replace(/\r\n/g, '').includes('\n'));
  assert.ok(bat.every((b) => b < 128));
  assert.ok(t.includes('test.config'));
  assert.ok(existsSync(join(KIT, 'modelos', 'teste', 'test.config')));
  assert.ok(existsSync(join(KIT, 'modelos', 'ci', 'testes.yml')));
});

test('aprendizado: skill, modelo e encaixe', () => {
  const s = ler('skills', 'registrando-aprendizado', 'SKILL.md');
  assert.match(s, /gh pr create/);
  assert.match(s, /confirma/i);
  const m = ler('modelos', 'projeto', 'aprendizado.md');
  for (const sec of ['O que aconteceu', 'Evidência', 'Sugestão', 'Destino']) assert.match(m, new RegExp(`^## ${sec}`, 'm'));
  for (const sk of ['revisando', 'verificando-seguranca', 'reproduzindo-falha']) assert.match(ler('skills', sk, 'SKILL.md'), /registrando-aprendizado/, sk);
});

test('bloqueios e modo rapido ficam registrados em kit-eventos.jsonl', () => {
  const raiz = criarProjeto({ ativo: true });
  rodarHook('bloqueio-codigo.mjs', { cwd: raiz, tool_name: 'Write', tool_input: { file_path: join(raiz, 'app.py'), content: '' } });
  rodarHook('bloqueio-segredos.mjs', { cwd: raiz, tool_name: 'Write', tool_input: { file_path: join(raiz, 'a.py'), content: 'SENHA = "Abc12345xyz"' } });
  rodarHook('modo-rapido.mjs', '', ['ligar', '--raiz', raiz]);
  rodarHook('bloqueio-codigo.mjs', { cwd: raiz, tool_name: 'Write', tool_input: { file_path: join(raiz, 'app.py'), content: '' } });
  const linhas = readFileSync(join(raiz, '.claude', 'kit-eventos.jsonl'), 'utf8').trim().split('\n').map((l) => JSON.parse(l));
  assert.deepEqual(linhas.map((l) => l.tipo), ['bloqueio_requisito', 'bloqueio_segredo', 'modo_rapido_ligado']);
  for (const l of linhas) assert.match(l.ts, /^\d{4}-\d{2}-\d{2}T/);
  assert.ok(!JSON.stringify(linhas).includes('Abc12345xyz'));
});

test('projeto inativo nao grava eventos', () => {
  const raiz = criarProjeto({ git: true });
  rodarHook('bloqueio-segredos.mjs', { cwd: raiz, tool_name: 'Write', tool_input: { file_path: join(raiz, '.env'), content: '' } });
  assert.equal(existsSync(join(raiz, '.claude', 'kit-eventos.jsonl')), false);
});

test('medir resume eventos e tarefas', () => {
  const raiz = criarProjeto({ ativo: true, requisitos: true, estado: APROVADO });
  mkdirSync(join(raiz, 'docs', 'projeto', 'tarefas'), { recursive: true });
  const t = (n, status, rev) => writeFileSync(join(raiz, 'docs', 'projeto', 'tarefas', `00${n}-x.md`), `---\nstatus: ${status}\n---\n${rev ? '## Revisão\n- bloqueia: contrato\n' : ''}`);
  t(1, 'pronta'); t(2, 'pronta', true); t(3, 'em-andamento', true); t(4, 'pendente');
  writeFileSync(join(raiz, '.claude', 'kit-eventos.jsonl'), ['bloqueio_requisito', 'bloqueio_requisito', 'bloqueio_pronta', 'modo_rapido_ligado']
    .map((tipo) => JSON.stringify({ ts: '2026-11-11T00:00:00.000Z', tipo })).join('\n') + '\nlinha quebrada\n');
  const r = rodarHook('medir.mjs', '', ['--raiz', raiz, '--json']);
  assert.equal(r.codigo, 0, r.stderr);
  const m = JSON.parse(r.stdout);
  assert.deepEqual(m.eventos, { bloqueio_requisito: 2, bloqueio_pronta: 1, modo_rapido_ligado: 1 });
  assert.deepEqual(m.tarefas, { total: 4, pendente: 1, 'em-andamento': 1, 'em-revisao': 0, pronta: 2 });
  assert.equal(m.tarefasComRevisaoRegistrada, 2);
  assert.match(rodarHook('medir.mjs', '', ['--raiz', raiz]).stdout, /Tarefas: 4/);
});

test('diagnostico informa gh, .env.example e test.bat', () => {
  const raiz = mkdtempSync(join(tmpdir(), 'd-'));
  const d = JSON.parse(rodarHook('diagnostico.mjs', '', ['--raiz', raiz, '--home', raiz]).stdout);
  assert.equal(typeof d.ferramentas.gh, 'boolean');
  assert.equal(d.testBat, false);
  assert.equal(d.envExample, false);
  assert.equal(d.padroes, false);
});
