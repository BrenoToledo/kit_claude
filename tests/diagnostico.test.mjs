import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { rodarHook } from './apoio.mjs';

const pasta = () => mkdtempSync(join(tmpdir(), 'diag-'));
const diag = (raiz, home, env = {}) => {
  const r = rodarHook('diagnostico.mjs', '', ['--raiz', raiz, '--home', home], { env: { PATH: process.env.PATH, ...env } });
  assert.equal(r.codigo, 0, r.stderr);
  return JSON.parse(r.stdout);
};
const CHAVES = ['claudeMdGlobal', 'claudeMdProjeto', 'agentsMd', 'skillsGlobais', 'plugins', 'hooksUsuario',
  'ferramentas', 'proxy', 'tipoProjeto', 'kitAtivo', 'estadoProjeto', 'runBat', 'testBat', 'envExample', 'padroes'];

test('pasta vazia', () => {
  const d = diag(pasta(), pasta());
  assert.deepEqual(Object.keys(d).sort(), [...CHAVES].sort());
  assert.deepEqual(d.claudeMdGlobal, { existe: false, linhas: 0 });
  assert.equal(d.agentsMd.existe, false);
  assert.deepEqual(d.plugins, []);
  assert.deepEqual(d.skillsGlobais, []);
  assert.equal(d.tipoProjeto, 'nenhum');
  assert.equal(d.kitAtivo, false);
  assert.equal(d.proxy, null);
  assert.equal(typeof d.ferramentas.headroom, 'boolean');
});

test('projeto django', () => {
  const raiz = pasta();
  writeFileSync(join(raiz, 'manage.py'), '');
  assert.equal(diag(raiz, pasta()).tipoProjeto, 'django');
});

test('projeto automacao', () => {
  const raiz = pasta();
  mkdirSync(join(raiz, 'linha2'));
  writeFileSync(join(raiz, 'linha2', 'Programa.L5X'), '');
  assert.equal(diag(raiz, pasta()).tipoProjeto, 'automacao');
});

test('projeto node', () => {
  const raiz = pasta();
  writeFileSync(join(raiz, 'package.json'), '{}');
  assert.equal(diag(raiz, pasta()).tipoProjeto, 'node');
});

test('CLAUDE.md de 250 linhas', () => {
  const home = pasta();
  mkdirSync(join(home, '.claude'));
  writeFileSync(join(home, '.claude', 'CLAUDE.md'), Array(250).fill('linha').join('\n'));
  assert.deepEqual(diag(pasta(), home).claudeMdGlobal, { existe: true, linhas: 250 });
});

test('installed_plugins invalido nao quebra', () => {
  const home = pasta();
  mkdirSync(join(home, '.claude', 'plugins'), { recursive: true });
  writeFileSync(join(home, '.claude', 'plugins', 'installed_plugins.json'), '{quebrado');
  assert.deepEqual(diag(pasta(), home).plugins, []);
});

test('le plugins, skills, hooks e proxy do usuario', () => {
  const home = pasta();
  mkdirSync(join(home, '.claude', 'plugins'), { recursive: true });
  mkdirSync(join(home, '.claude', 'skills', 'unslop'), { recursive: true });
  writeFileSync(join(home, '.claude', 'plugins', 'installed_plugins.json'),
    JSON.stringify({ version: 2, plugins: { 'superpowers@claude-plugins-official': [{}], 'caveman@caveman': [{}] } }));
  writeFileSync(join(home, '.claude', 'settings.json'),
    JSON.stringify({ hooks: { PreToolUse: [] }, env: { ANTHROPIC_BASE_URL: 'http://localhost:8787' } }));
  const d = diag(pasta(), home);
  assert.deepEqual(d.plugins.sort(), ['caveman', 'superpowers']);
  assert.deepEqual(d.skillsGlobais, ['unslop']);
  assert.deepEqual(d.hooksUsuario, ['PreToolUse']);
  assert.equal(d.proxy, 'http://localhost:8787');
});

test('kit ativo e estado do projeto', () => {
  const raiz = pasta();
  mkdirSync(join(raiz, '.claude'));
  mkdirSync(join(raiz, 'docs', 'projeto'), { recursive: true });
  writeFileSync(join(raiz, '.claude', 'kit-estado.json'), '{"ativo": true}');
  writeFileSync(join(raiz, 'docs', 'projeto', 'ESTADO.md'), '---\n---\n');
  writeFileSync(join(raiz, 'AGENTS.md'), '');
  const d = diag(raiz, pasta());
  assert.equal(d.kitAtivo, true);
  assert.equal(d.estadoProjeto, true);
  assert.equal(d.agentsMd.existe, true);
});

test('acha ferramenta no PATH', () => {
  const bin = pasta();
  writeFileSync(join(bin, process.platform === 'win32' ? 'agy.cmd' : 'agy'), '', { mode: 0o755 });
  const d = diag(pasta(), pasta(), { PATH: bin, PATHEXT: '.CMD;.EXE' });
  assert.equal(d.ferramentas.agy, true);
  assert.equal(d.ferramentas.headroom, false);
});
