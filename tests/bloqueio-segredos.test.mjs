import { test } from 'node:test';
import assert from 'node:assert/strict';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { criarProjeto, rodarHook } from './apoio.mjs';
import { acharSegredo, nomeSecreto } from '../plugins/kit/hooks/bloqueio-segredos.mjs';

const H = 'bloqueio-segredos.mjs';
const escrever = (arquivo, content) => rodarHook(H, { cwd: '/tmp', tool_name: 'Write', tool_input: { file_path: arquivo, content } });
const bash = (cwd, command) => rodarHook(H, { cwd, tool_name: 'Bash', tool_input: { command } });

test('escrever .env bloqueia', () => {
  assert.equal(escrever('/p/.env', 'A=1').codigo, 2);
  assert.equal(escrever('C:\\p\\.env.production', 'A=1').codigo, 2);
  assert.equal(escrever('/p/chave.pem', 'x').codigo, 2);
});

test('escrever .env.example libera', () => {
  assert.equal(escrever('/p/.env.example', 'A=').codigo, 0);
  assert.equal(escrever('/p/.env.modelo', 'A=').codigo, 0);
});

test('nomeSecreto', () => {
  assert.equal(nomeSecreto('a/b/id_rsa'), true);
  assert.equal(nomeSecreto('ambiente.py'), false);
  assert.equal(nomeSecreto('.envrc.md'), false);
});

test('chave privada no conteudo bloqueia', () => {
  assert.equal(escrever('/p/a.py', '-----BEGIN RSA PRIVATE KEY-----\nabc').codigo, 2);
  assert.equal(escrever('/p/a.py', 'k = "AKIAABCDEFGHIJKLMNOP"').codigo, 2);
});

test('senha literal bloqueia', () => {
  const r = escrever('/p/settings.py', 'SENHA = "Abc12345xyz"');
  assert.equal(r.codigo, 2);
  assert.match(r.stderr, /variável de ambiente/);
});

test('senha vinda de os.environ libera', () => {
  assert.equal(escrever('/p/settings.py', 'password = os.environ["DB_PASS"]').codigo, 0);
  assert.equal(escrever('/p/a.js', 'const token = process.env.TOKEN;').codigo, 0);
});

test('valor de exemplo libera', () => {
  assert.equal(escrever('/p/a.py', 'api_key = "changeme-exemplo"').codigo, 0);
  assert.equal(escrever('/p/a.py', 'password = "${DB_PASSWORD}"').codigo, 0);
  assert.equal(escrever('/p/a.py', 'senha = "<sua-senha-aqui>"').codigo, 0);
  assert.equal(escrever('/p/a.py', 'senha = "********"').codigo, 0);
});

test('codigo comum libera', () => {
  assert.equal(escrever('/p/a.py', 'def soma(a, b):\n    return a + b\n').codigo, 0);
  assert.equal(acharSegredo('token = ler_token()'), null);
});

test('segredo no new_string de Edit bloqueia', () => {
  const r = rodarHook(H, { cwd: '/tmp', tool_name: 'Edit', tool_input: { file_path: '/p/a.py', old_string: 'x', new_string: 'TOKEN = "ghp_' + 'a'.repeat(36) + '"' } });
  assert.equal(r.codigo, 2);
});

test('segredo em edits de MultiEdit bloqueia', () => {
  const r = rodarHook(H, { cwd: '/tmp', tool_name: 'MultiEdit', tool_input: { file_path: '/p/a.py', edits: [{ old_string: 'a', new_string: 'b' }, { old_string: 'c', new_string: 'senha = "SuperSecreta123"' }] } });
  assert.equal(r.codigo, 2);
});

test('mensagem nao repete o valor', () => {
  const r = escrever('/p/settings.py', 'SENHA = "Abc12345xyz"');
  assert.ok(!r.stderr.includes('Abc12345xyz'));
});

test('git add .env bloqueia', () => {
  assert.equal(bash('/tmp', 'git add .env').codigo, 2);
  assert.equal(bash('/tmp', 'git add src/app.py "config/.env.production"').codigo, 2);
});

test('git add -A com .env fora do gitignore bloqueia; no gitignore libera', () => {
  const raiz = criarProjeto({});
  spawnSync('git', ['init', '-q'], { cwd: raiz });
  writeFileSync(join(raiz, '.env'), 'A=1');
  const r = bash(raiz, 'git add -A');
  assert.equal(r.codigo, 2);
  assert.match(r.stderr, /\.gitignore/);
  assert.equal(bash(raiz, 'git add . && git commit -m x').codigo, 2);
  assert.equal(bash(raiz, 'git commit -am "x"').codigo, 2);
  writeFileSync(join(raiz, '.gitignore'), '.env\n');
  assert.equal(bash(raiz, 'git add -A').codigo, 0);
});

test('git add -A sem .env libera', () => {
  const raiz = criarProjeto({});
  spawnSync('git', ['init', '-q'], { cwd: raiz });
  assert.equal(bash(raiz, 'git add -A').codigo, 0);
});

test('comando sem git libera', () => {
  assert.equal(bash('/tmp', 'cat .env.example && npm test').codigo, 0);
});

test('stdin vazio libera', () => {
  const r = rodarHook(H, '');
  assert.equal(r.codigo, 0);
  assert.equal(r.stderr, '');
});

test('mensagem de commit que cita .env nao bloqueia', () => {
  assert.equal(bash('/tmp', 'git commit -m "trata o arquivo .env na leitura"').codigo, 0);
  assert.equal(bash('/tmp', "git commit -m 'remove id_rsa do exemplo' && git push").codigo, 0);
  assert.equal(bash('/tmp', 'git commit --message="ajusta .env.production"').codigo, 0);
  assert.equal(bash('/tmp', 'git add .env -m "x"').codigo, 2);
});
