import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { rodarHook } from './apoio.mjs';

const KIT = join(dirname(fileURLToPath(import.meta.url)), '..', 'plugins', 'kit');
const bat = readFileSync(join(KIT, 'modelos', 'run', 'run.bat'));

test('run.bat usa CRLF e so ASCII', () => {
  const texto = bat.toString('latin1');
  assert.ok(texto.includes('\r\n'));
  assert.equal(texto.replace(/\r\n/g, '').includes('\n'), false, 'há LF sem CR');
  assert.ok(bat.every((b) => b < 128), 'há caractere fora do ASCII: o cmd do Windows pode exibir errado');
});

test('run.bat traz os comandos documentados', () => {
  const texto = bat.toString('latin1');
  for (const c of ['start', 'stop', 'status', 'restart', 'logs', '--forcar', 'run.config', '.run', 'taskkill']) assert.ok(texto.includes(c), c);
});

test('modelo de run.config e documento existem e combinam', () => {
  const cfg = readFileSync(join(KIT, 'modelos', 'run', 'run.config'), 'utf8');
  assert.match(cfg, /^#.*nome \| porta \| comando/m);
  const doc = readFileSync(join(KIT, 'modelos', 'padroes', 'RUN.md'), 'utf8');
  for (const c of ['run.bat stop', 'run.bat status', 'run.bat restart', 'run.bat logs', '--forcar', 'run.config']) assert.ok(doc.includes(c), c);
  assert.match(readFileSync(join(KIT, 'skills', 'setup', 'SKILL.md'), 'utf8'), /run\.bat/);
  assert.match(readFileSync(join(KIT, 'modelos', 'AGENTS.md'), 'utf8'), /run\.bat/);
});

test('diagnostico informa se ha run.bat', () => {
  const raiz = mkdtempSync(join(tmpdir(), 'run-'));
  const d = () => JSON.parse(rodarHook('diagnostico.mjs', '', ['--raiz', raiz, '--home', raiz]).stdout);
  assert.equal(d().runBat, false);
  writeFileSync(join(raiz, 'run.bat'), '');
  assert.equal(d().runBat, true);
});
