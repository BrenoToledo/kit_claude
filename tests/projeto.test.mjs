import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { criarProjeto } from './apoio.mjs';
import {
  acharRaiz, projetoAtivo, lerEstado, modoRapido, ligarRapido, desligarRapido, classificar,
} from '../plugins/kit/hooks/lib/projeto.mjs';

test('acharRaiz sobe ate a pasta com kit-estado', () => {
  const raiz = criarProjeto({ ativo: true });
  mkdirSync(join(raiz, 'src', 'app'), { recursive: true });
  assert.equal(acharRaiz(join(raiz, 'src', 'app')), raiz);
});

test('acharRaiz usa .git quando nao ha kit-estado', () => {
  const raiz = criarProjeto({ git: true });
  mkdirSync(join(raiz, 'a'));
  assert.equal(acharRaiz(join(raiz, 'a')), raiz);
});

test('acharRaiz sem marcador devolve null', () => {
  assert.equal(acharRaiz(mkdtempSync(join(tmpdir(), 'vazio-'))), null);
  assert.equal(acharRaiz('/caminho/que/nao/existe'), null);
  assert.equal(acharRaiz(undefined), null);
});

test('lerEstado tolera CRLF', () => {
  const raiz = criarProjeto({ estado: '---\r\nfase: desenho \r\nRequisitos:  aprovado\r\n---\r\n' });
  assert.deepEqual(lerEstado(raiz), { fase: 'desenho', requisitos: 'aprovado' });
});

test('lerEstado sem arquivo devolve objeto vazio', () => {
  assert.deepEqual(lerEstado(criarProjeto({})), {});
});

test('classificar', () => {
  assert.equal(classificar('docs/projeto/ESTADO.md', '/p'), 'livre');
  assert.equal(classificar('src\\app\\views.py', 'C:\\p'), 'codigo');
  assert.equal(
    classificar('C:\\Users\\Breno Toledo\\proj\\web\\Botao.tsx', 'C:\\Users\\Breno Toledo\\proj'),
    'interface',
  );
  assert.equal(classificar('app/templates/base.html', '/p'), 'interface');
  assert.equal(classificar('/p/app/templates/email.txt', '/p'), 'livre');
  assert.equal(classificar('package.json', '/p'), 'livre');
  assert.equal(classificar('main.st', '/p'), 'codigo');
  assert.equal(classificar('/p/docs/exemplo.py', '/p'), 'livre');
  assert.equal(classificar('.gitignore', '/p'), 'livre');
});

test('modoRapido vale ate a data gravada', () => {
  const raiz = criarProjeto({ ativo: true });
  assert.equal(modoRapido(raiz), false);
  ligarRapido(raiz, 4);
  assert.equal(modoRapido(raiz), true);
  assert.equal(modoRapido(raiz, new Date(Date.now() + 5 * 3600 * 1000)), false);
  desligarRapido(raiz);
  assert.equal(modoRapido(raiz), false);
  writeFileSync(join(raiz, '.claude', 'kit-rapido'), 'texto qualquer');
  assert.equal(modoRapido(raiz), false);
});

test('projetoAtivo falso com JSON invalido', () => {
  const raiz = criarProjeto({ ativo: true });
  assert.equal(projetoAtivo(raiz), true);
  writeFileSync(join(raiz, '.claude', 'kit-estado.json'), '{quebrado');
  assert.equal(projetoAtivo(raiz), false);
  assert.equal(projetoAtivo(criarProjeto({ ativo: false })), false);
});
