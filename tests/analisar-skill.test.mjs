import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { rodarHook, criarProjeto } from './apoio.mjs';

const pasta = () => mkdtempSync(join(tmpdir(), 'spector-'));

// Falso skillspector: grava os argumentos recebidos e devolve o JSON pedido.
function falso(saida, codigo = 0) {
  const dir = pasta();
  const script = join(dir, 'skillspector-falso.mjs');
  writeFileSync(join(dir, 'saida.json'), typeof saida === 'string' ? saida : JSON.stringify(saida));
  writeFileSync(script, `import { readFileSync, writeFileSync } from 'node:fs';
writeFileSync(${JSON.stringify(join(dir, 'args.json'))}, JSON.stringify(process.argv.slice(2)));
process.stdout.write(readFileSync(${JSON.stringify(join(dir, 'saida.json'))}, 'utf8'));
process.exit(${codigo});
`);
  return { script, args: () => JSON.parse(readFileSync(join(dir, 'args.json'), 'utf8')) };
}

const unica = (recomendacao, issues = []) => ({
  risk_assessment: { score: issues.length ? 59 : 0, severity: issues.length ? 'HIGH' : 'LOW', recommendation: recomendacao },
  issues,
});
const ACHADO = {
  category: 'Prompt Injection', pattern: 'Instruction Override', severity: 'HIGH',
  location: { file: 'SKILL.md', start_line: 6 }, finding: 'Ignore all previous instructions',
};

function analisar(alvo, f, extra = [], opcoes = {}) {
  return rodarHook('analisar-skill.mjs', '', [alvo, ...extra], {
    env: { PATH: process.env.PATH, KIT_SKILLSPECTOR: f.script, ...(opcoes.env ?? {}) },
  });
}

function skill() {
  const dir = pasta();
  writeFileSync(join(dir, 'SKILL.md'), '---\nname: x\n---\n');
  return dir;
}

test('SAFE libera, com codigo 0 e sem LLM por padrao', () => {
  const f = falso(unica('SAFE'));
  const r = analisar(skill(), f);
  assert.equal(r.codigo, 0, r.stderr);
  assert.match(r.stdout, /SAFE/);
  const args = f.args();
  assert.equal(args[0], 'scan');
  assert.ok(args.includes('--no-llm'));
  assert.deepEqual(args.slice(args.indexOf('--format'), args.indexOf('--format') + 2), ['--format', 'json']);
});

test('--llm liga a analise semantica', () => {
  const f = falso(unica('SAFE'));
  analisar(skill(), f, ['--llm']);
  assert.ok(!f.args().includes('--no-llm'));
});

test('DO_NOT_INSTALL bloqueia com codigo 2 e mostra o achado', () => {
  const f = falso(unica('DO_NOT_INSTALL', [ACHADO]), 1);
  const r = analisar(skill(), f);
  assert.equal(r.codigo, 2);
  assert.match(r.stdout, /DO NOT INSTALL/);
  assert.match(r.stdout, /HIGH/);
  assert.match(r.stdout, /SKILL\.md:6/);
  assert.match(r.stdout, /Prompt Injection/);
});

test('CAUTION pede decisao com codigo 1', () => {
  const f = falso(unica('CAUTION', [{ ...ACHADO, severity: 'MEDIUM' }]));
  assert.equal(analisar(skill(), f).codigo, 1);
});

test('pasta sem SKILL.md vira varredura recursiva; plugin usa a pasta skills/', () => {
  const multi = { multi_skill: true, risk_recommendation: 'SAFE', max_risk_score: 0, skills: [{ name: 'a', ...unica('SAFE') }] };
  const colecao = pasta();
  mkdirSync(join(colecao, 'a'));
  writeFileSync(join(colecao, 'a', 'SKILL.md'), '');
  const f1 = falso(multi);
  assert.equal(analisar(colecao, f1).codigo, 0);
  assert.ok(f1.args().includes('--recursive'));
  assert.equal(f1.args()[1], colecao);

  const plugin = pasta();
  mkdirSync(join(plugin, 'skills', 'a'), { recursive: true });
  writeFileSync(join(plugin, 'skills', 'a', 'SKILL.md'), '');
  const f2 = falso(multi);
  analisar(plugin, f2);
  assert.equal(f2.args()[1], join(plugin, 'skills'));
});

test('varredura recursiva bloqueia se qualquer skill for DO_NOT_INSTALL', () => {
  const multi = {
    multi_skill: true, risk_recommendation: 'DO_NOT_INSTALL', max_risk_score: 59,
    skills: [{ name: 'boa', ...unica('SAFE') }, { name: 'ruim', ...unica('DO_NOT_INSTALL', [ACHADO]) }],
  };
  const r = analisar(pasta(), falso(multi, 1));
  assert.equal(r.codigo, 2);
  assert.match(r.stdout, /ruim/);
});

test('URL vai direto para o skillspector', () => {
  const f = falso(unica('SAFE'));
  analisar('https://github.com/user/skill', f);
  assert.equal(f.args()[1], 'https://github.com/user/skill');
  assert.ok(!f.args().includes('--recursive'));
});

test('--json devolve o resumo normalizado', () => {
  const r = analisar(skill(), falso(unica('DO_NOT_INSTALL', [ACHADO]), 1), ['--json']);
  const d = JSON.parse(r.stdout);
  assert.equal(d.recomendacao, 'DO_NOT_INSTALL');
  assert.equal(d.nota, 59);
  assert.equal(d.achados.length, 1);
  assert.deepEqual(d.achados[0], { skill: null, severidade: 'HIGH', categoria: 'Prompt Injection', local: 'SKILL.md:6', trecho: 'Ignore all previous instructions' });
});

test('sem skillspector instalado: codigo 3 e comando de instalacao', () => {
  const r = rodarHook('analisar-skill.mjs', '', [skill()], {
    env: { PATH: process.env.PATH, KIT_SKILLSPECTOR: join(pasta(), 'nao-existe') },
  });
  assert.equal(r.codigo, 3);
  assert.match(r.stdout + r.stderr, /uv tool install git\+https:\/\/github\.com\/NVIDIA\/skillspector\.git/);
});

test('saida que nao e JSON: codigo 4, nunca libera', () => {
  const r = analisar(skill(), falso('Traceback: erro interno', 1));
  assert.equal(r.codigo, 4);
});

test('sem alvo: codigo 4 com o uso', () => {
  const r = rodarHook('analisar-skill.mjs', '', [], { env: { PATH: process.env.PATH } });
  assert.equal(r.codigo, 4);
  assert.match(r.stderr, /Uso:/);
});

test('bloqueio fica registrado em kit-eventos.jsonl do projeto ativo', () => {
  const raiz = criarProjeto({ ativo: true });
  const f = falso(unica('DO_NOT_INSTALL', [ACHADO]), 1);
  rodarHook('analisar-skill.mjs', '', [skill(), '--raiz', raiz], { env: { PATH: process.env.PATH, KIT_SKILLSPECTOR: f.script } });
  const arq = join(raiz, '.claude', 'kit-eventos.jsonl');
  assert.ok(existsSync(arq));
  assert.equal(JSON.parse(readFileSync(arq, 'utf8').trim()).tipo, 'skill_bloqueada');
});

test('setup, verificacao de seguranca e CI chamam a analise', () => {
  const raiz = join(import.meta.dirname, '..');
  const ler = (...p) => readFileSync(join(raiz, ...p), 'utf8');
  assert.match(ler('plugins', 'kit', 'skills', 'setup', 'SKILL.md'), /terceiros\.md/);
  const terceiros = ler('plugins', 'kit', 'skills', 'setup', 'terceiros.md');
  assert.match(terceiros, /analisar-skill\.mjs/);
  assert.match(terceiros, /DO NOT INSTALL/);
  assert.match(terceiros, /--llm/);
  assert.match(ler('plugins', 'kit', 'skills', 'verificando-seguranca', 'SKILL.md'), /analisar-skill\.mjs/);
  assert.match(ler('.github', 'workflows', 'testes.yml'), /analisar-skill\.mjs plugins\/kit/);
});
