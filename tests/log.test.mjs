import { test } from 'node:test';
import assert from 'node:assert/strict';
import { writeFileSync, readFileSync, existsSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { rodarHook, criarProjeto } from './apoio.mjs';
import { validarLinha, validarTexto } from '../plugins/kit/hooks/lib/log.mjs';

const KIT = join(dirname(fileURLToPath(import.meta.url)), '..', 'plugins', 'kit');
const base = (extra = {}) => ({
  ts: '2026-11-11T23:30:00.123Z', nivel: 'info', evento: 'pedido_criado', msg: 'Pedido criado',
  servico: 'loja-api', versao: 'a1b2c3d', ambiente: 'producao', id_correlacao: 'c-001', ...extra,
});
const erro = (extra = {}) => base({
  nivel: 'erro', evento: 'pedido_falhou', msg: 'Estoque insuficiente',
  entrada: { produto_id: 7, quantidade: 3 }, estado: { estoque: 2, versao_registro: 14 },
  erro: { tipo: 'EstoqueInsuficiente', mensagem: 'pedido 3, estoque 2', pilha: 'Traceback...' }, ...extra,
});

test('evento valido nao tem erros', () => {
  assert.deepEqual(validarLinha(base()), []);
  assert.deepEqual(validarLinha(erro()), []);
});

test('campo obrigatorio ausente', () => {
  const { id_correlacao, ...sem } = base();
  assert.match(validarLinha(sem).join(';'), /id_correlacao/);
});

test('ts fora do formato UTC com milissegundos', () => {
  assert.match(validarLinha(base({ ts: '2026-11-11 23:30:00' })).join(';'), /ts/);
  assert.match(validarLinha(base({ ts: '2026-11-11T20:30:00.123-03:00' })).join(';'), /ts/);
});

test('nivel e evento fora do padrao', () => {
  assert.match(validarLinha(base({ nivel: 'ERROR' })).join(';'), /nivel/);
  assert.match(validarLinha(base({ evento: 'Pedido Criado' })).join(';'), /evento/);
});

test('erro sem entrada, estado ou erro e invalido', () => {
  const { entrada, ...semEntrada } = erro();
  assert.match(validarLinha(semEntrada).join(';'), /entrada/);
  const { estado, ...semEstado } = erro();
  assert.match(validarLinha(semEstado).join(';'), /estado/);
  assert.match(validarLinha(erro({ erro: { tipo: 'X' } })).join(';'), /erro\.mensagem/);
  assert.match(validarLinha(erro({ nivel: 'critico', erro: undefined })).join(';'), /erro/);
});

test('entrada e estado vazios sao aceitos quando declarados', () => {
  assert.deepEqual(validarLinha(erro({ entrada: {}, estado: null })), []);
});

test('dado sensivel no log e invalido', () => {
  assert.match(validarLinha(base({ dados: { senha: 'abc12345' } })).join(';'), /sens/);
  assert.match(validarLinha(erro({ entrada: { cliente: { cpf: '529.982.247-25' } } })).join(';'), /sens/);
  assert.match(validarLinha(base({ dados: { Authorization: 'Bearer xyz' } })).join(';'), /sens/);
  assert.deepEqual(validarLinha(base({ dados: { senha: '***', cpf: '***.***.***-25' } })), []);
});

test('validarTexto aponta a linha com problema e ignora linhas vazias', () => {
  const texto = [JSON.stringify(base()), '', 'nao e json', JSON.stringify(base({ nivel: 'x' }))].join('\r\n');
  const r = validarTexto(texto);
  assert.equal(r.linhas, 3);
  assert.deepEqual(r.erros.map((e) => e.linha), [3, 4]);
});

test('validar-log pela linha de comando', () => {
  const dir = mkdtempSync(join(tmpdir(), 'log-'));
  const bom = join(dir, 'bom.jsonl'); const ruim = join(dir, 'ruim.jsonl');
  writeFileSync(bom, JSON.stringify(base()) + '\n' + JSON.stringify(erro()) + '\n');
  writeFileSync(ruim, JSON.stringify(base({ ts: 'ontem' })) + '\n');
  const a = rodarHook('validar-log.mjs', '', [bom]);
  assert.equal(a.codigo, 0); assert.match(a.stdout, /2 eventos, 0 problemas/);
  const b = rodarHook('validar-log.mjs', '', [ruim]);
  assert.equal(b.codigo, 1); assert.match(b.stdout, /linha 1/);
  assert.equal(rodarHook('validar-log.mjs', '', [join(dir, 'nao-existe')]).codigo, 1);
});

test('extrair-falha gera o arquivo de reproducao', () => {
  const raiz = criarProjeto({ ativo: true });
  const log = join(raiz, 'app.jsonl');
  writeFileSync(log, [
    JSON.stringify(erro({ ts: '2026-11-11T23:30:02.000Z' })),
    JSON.stringify(base({ id_correlacao: 'outra', evento: 'outra_coisa' })),
    JSON.stringify(base({ ts: '2026-11-11T23:30:01.000Z', evento: 'pedido_recebido', msg: 'Pedido recebido' })),
  ].join('\n'));
  const r = rodarHook('extrair-falha.mjs', '', [log, 'c-001', '--raiz', raiz]);
  assert.equal(r.codigo, 0, r.stdout + r.stderr);
  const saida = join(raiz, 'docs', 'projeto', 'falhas', 'c-001.md');
  assert.ok(existsSync(saida));
  const t = readFileSync(saida, 'utf8');
  assert.ok(t.indexOf('pedido_recebido') < t.indexOf('pedido_falhou'), 'linha do tempo em ordem de ts');
  assert.ok(!t.includes('outra_coisa'));
  for (const s of ['## Linha do tempo', '## Entrada', '## Estado', '## Erro', '## Teste que reproduz']) assert.ok(t.includes(s), s);
  assert.match(t, /"quantidade": 3/);
  assert.match(t, /a1b2c3d/);
});

test('extrair-falha sem id lista as correlacoes com erro; id inexistente sai com 1', () => {
  const raiz = criarProjeto({ ativo: true });
  const log = join(raiz, 'app.jsonl');
  writeFileSync(log, JSON.stringify(erro()) + '\n' + JSON.stringify(base({ id_correlacao: 'ok-1' })) + '\n');
  const lista = rodarHook('extrair-falha.mjs', '', [log]);
  assert.equal(lista.codigo, 0);
  assert.match(lista.stdout, /c-001/);
  assert.ok(!lista.stdout.includes('ok-1'));
  assert.equal(rodarHook('extrair-falha.mjs', '', [log, 'nao-existe', '--raiz', raiz]).codigo, 1);
});

test('referencia em Python produz log que passa no validador', (t) => {
  const py = ['python3', 'python'].find((c) => spawnSync(c, ['--version']).status === 0);
  if (!py) return t.skip('Python não encontrado');
  const pasta = join(KIT, 'modelos', 'log', 'python');
  const proprios = spawnSync(py, ['-m', 'unittest', 'test_kit_log', '-q'], { cwd: pasta, encoding: 'utf8' });
  assert.equal(proprios.status, 0, proprios.stderr);
  const script = `
import kit_log, sys
kit_log.configurar(servico="loja-api", versao="a1b2c3d", ambiente="teste")
with kit_log.correlacao("c-9"):
    kit_log.evento("pedido_recebido", "Pedido recebido", produto_id=7, senha="abc12345")
    try:
        raise ValueError("estoque 2, pedido 3")
    except ValueError as e:
        kit_log.falha("pedido_falhou", e, entrada={"produto_id": 7, "cpf": "529.982.247-25"}, estado={"estoque": 2})
`;
  const r = spawnSync(py, ['-c', script], { cwd: pasta, encoding: 'utf8' });
  assert.equal(r.status, 0, r.stderr);
  const v = validarTexto(r.stdout);
  assert.equal(v.linhas, 2);
  assert.deepEqual(v.erros, []);
  assert.ok(!r.stdout.includes('abc12345') && !r.stdout.includes('529.982.247-25'), 'dado sensível mascarado');
  const falha = JSON.parse(r.stdout.trim().split('\n')[1]);
  assert.equal(falha.id_correlacao, 'c-9');
  assert.equal(falha.erro.tipo, 'ValueError');
  assert.equal(falha.estado.estoque, 2);
});

test('padrao documentado e encaixado no metodo', () => {
  const ler = (...p) => readFileSync(join(KIT, ...p), 'utf8');
  const padrao = ler('modelos', 'padroes', 'LOG.md');
  for (const c of ['ts', 'nivel', 'evento', 'msg', 'servico', 'versao', 'ambiente', 'id_correlacao', 'entrada', 'estado', 'erro']) assert.ok(padrao.includes('`' + c + '`'), c);
  assert.match(ler('modelos', 'projeto', 'contrato.md'), /^## Logs/m);
  assert.match(ler('modelos', 'AGENTS.md'), /^10\. \*\*/m);
  assert.match(ler('skills', 'revisando', 'SKILL.md'), /id_correlacao/);
  assert.match(ler('skills', 'setup', 'SKILL.md'), /docs\/padroes\//);
});
