#!/usr/bin/env node
// Uso: node analisar-skill.mjs <pasta | SKILL.md | .zip | URL> [--llm] [--json] [--raiz <projeto>]
// Roda o SkillSpector (NVIDIA) numa skill ou plugin de terceiros antes da instalação.
// Saída: 0 SAFE, 1 CAUTION, 2 DO_NOT_INSTALL, 3 SkillSpector ausente, 4 erro (nunca libera).
// Sem --llm, a análise é só estática: nada do conteúdo sai da máquina.
import { existsSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { acharRaiz, registrarEvento } from './lib/projeto.mjs';

const INSTALAR = 'uv tool install git+https://github.com/NVIDIA/skillspector.git';
const CODIGO = { SAFE: 0, CAUTION: 1, DO_NOT_INSTALL: 2 };
const MAX_ACHADOS = 20;

const args = process.argv.slice(2);
const opcao = (nome) => { const i = args.indexOf(nome); return i >= 0 ? args[i + 1] : undefined; };
const raizProjeto = opcao('--raiz') ?? acharRaiz(process.cwd());
const alvo = args.find((a, i) => !a.startsWith('--') && args[i - 1] !== '--raiz');

function sair(codigo, mensagem) {
  if (mensagem) console.error(mensagem);
  process.exit(codigo);
}

if (!alvo) sair(4, 'Uso: node analisar-skill.mjs <pasta | SKILL.md | .zip | URL> [--llm] [--json] [--raiz <projeto>]');

// Pasta sem SKILL.md é uma coleção; plugin traz as skills em skills/.
function montarAlvo(entrada) {
  const ehPasta = !/^https?:\/\//.test(entrada) && existsSync(entrada) && statSync(entrada).isDirectory();
  if (!ehPasta || existsSync(join(entrada, 'SKILL.md'))) return { caminho: entrada, recursivo: false };
  const skills = join(entrada, 'skills');
  if (existsSync(skills) && statSync(skills).isDirectory()) return { caminho: skills, recursivo: true };
  return { caminho: entrada, recursivo: true };
}

const { caminho, recursivo } = montarAlvo(alvo);
const scan = ['scan', caminho, '--format', 'json'];
if (!args.includes('--llm')) scan.push('--no-llm');
if (recursivo) scan.push('--recursive');

// KIT_SKILLSPECTOR troca o executável (testes); um .mjs/.js roda pelo próprio Node.
const bin = process.env.KIT_SKILLSPECTOR ?? 'skillspector';
const [cmd, cmdArgs] = /\.m?js$/.test(bin) ? [process.execPath, [bin, ...scan]] : [bin, scan];
const r = spawnSync(cmd, cmdArgs, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });

if (r.error?.code === 'ENOENT') sair(3, `SkillSpector não encontrado. Instale com:\n  ${INSTALAR}`);

let dado;
try {
  dado = JSON.parse(r.stdout);
} catch {
  sair(4, `SkillSpector não devolveu JSON (código ${r.status}). Trate como não verificado.\n${String(r.stderr ?? '').slice(-800)}`);
}

const achadosDe = (issues, skill) => (issues ?? []).map((i) => ({
  skill,
  severidade: i.severity ?? '?',
  categoria: i.category ?? i.pattern ?? '?',
  local: i.location?.file ? `${i.location.file}:${i.location.start_line ?? '?'}` : '?',
  trecho: String(i.finding ?? '').slice(0, 120),
}));

const resumo = dado.multi_skill
  ? {
    recomendacao: dado.risk_recommendation,
    nota: dado.max_risk_score,
    skills: (dado.skills ?? []).map((s) => ({ nome: s.name, recomendacao: s.risk_assessment?.recommendation, nota: s.risk_assessment?.score })),
    achados: (dado.skills ?? []).flatMap((s) => achadosDe(s.issues, s.name)),
  }
  : {
    recomendacao: dado.risk_assessment?.recommendation,
    nota: dado.risk_assessment?.score,
    achados: achadosDe(dado.issues, null),
  };

// Recomendação desconhecida conta como erro: na dúvida, não instala.
const codigo = CODIGO[resumo.recomendacao] ?? 4;
if (codigo === 2) registrarEvento(raizProjeto, 'skill_bloqueada');

if (args.includes('--json')) {
  console.log(JSON.stringify(resumo, null, 2));
} else {
  const texto = String(resumo.recomendacao ?? 'DESCONHECIDA').replace(/_/g, ' ');
  console.log(`SkillSpector: ${texto} (nota ${resumo.nota ?? '?'}/100)${args.includes('--llm') ? '' : ' — só análise estática'}`);
  for (const s of resumo.skills ?? []) console.log(`  ${s.nome}: ${String(s.recomendacao).replace(/_/g, ' ')} (${s.nota ?? '?'}/100)`);
  for (const a of resumo.achados.slice(0, MAX_ACHADOS)) {
    console.log(`- ${a.severidade} ${a.categoria} — ${a.skill ? a.skill + '/' : ''}${a.local} — ${a.trecho}`);
  }
  if (resumo.achados.length > MAX_ACHADOS) console.log(`… e mais ${resumo.achados.length - MAX_ACHADOS} achados.`);
}
process.exit(codigo);
