#!/usr/bin/env node
// Uso: node diagnostico.mjs [--raiz <pasta>] [--home <pasta>]
// Só leitura. Imprime um JSON com a situação do Claude Code e do projeto.
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, delimiter } from 'node:path';
import { homedir } from 'node:os';
import { acharRaiz, projetoAtivo } from './lib/projeto.mjs';

const args = process.argv.slice(2);
const opcao = (nome) => { const i = args.indexOf(nome); return i >= 0 ? args[i + 1] : undefined; };
const home = opcao('--home') ?? homedir();
const raiz = opcao('--raiz') ?? acharRaiz(process.cwd()) ?? process.cwd();

const lerJson = (p) => { try { return JSON.parse(readFileSync(p, 'utf8')); } catch { return null; } };
const listar = (p) => { try { return readdirSync(p, { withFileTypes: true }); } catch { return []; } };

function arquivoMd(p) {
  try {
    const texto = readFileSync(p, 'utf8');
    return { existe: true, linhas: texto.split('\n').length };
  } catch {
    return { existe: false, linhas: 0 };
  }
}

function noPath(nome) {
  const pastas = (process.env.PATH ?? '').split(delimiter).filter(Boolean);
  const exts = process.platform === 'win32'
    ? ['', ...(process.env.PATHEXT ?? '.EXE;.CMD;.BAT').split(';').filter(Boolean)]
    : [''];
  for (const pasta of pastas) {
    for (const ext of exts) {
      for (const candidato of [nome + ext, nome + ext.toLowerCase()]) {
        try { if (statSync(join(pasta, candidato)).isFile()) return true; } catch { /* segue */ }
      }
    }
  }
  return false;
}

const AUTOMACAO = /\.(acd|l5x|l5k|ap1[5-9]|ap20|zap1[5-9]|zap20)$/i;
function temAutomacao(pasta, nivel = 0) {
  for (const item of listar(pasta)) {
    if (item.isFile() && AUTOMACAO.test(item.name)) return true;
    if (item.isDirectory() && nivel < 2 && !item.name.startsWith('.') && item.name !== 'node_modules') {
      if (temAutomacao(join(pasta, item.name), nivel + 1)) return true;
    }
  }
  return false;
}

function tipoProjeto() {
  if (existsSync(join(raiz, 'manage.py'))) return 'django';
  if (temAutomacao(raiz)) return 'automacao';
  if (existsSync(join(raiz, 'package.json'))) return 'node';
  return 'nenhum';
}

function plugins() {
  const dado = lerJson(join(home, '.claude', 'plugins', 'installed_plugins.json'));
  const mapa = dado?.plugins;
  if (!mapa || typeof mapa !== 'object') return [];
  const chaves = Array.isArray(mapa) ? mapa.map((p) => p?.name).filter(Boolean) : Object.keys(mapa);
  return [...new Set(chaves.map((c) => String(c).split('@')[0]))];
}

const ajustes = lerJson(join(home, '.claude', 'settings.json')) ?? {};

const resultado = {
  claudeMdGlobal: arquivoMd(join(home, '.claude', 'CLAUDE.md')),
  claudeMdProjeto: arquivoMd(join(raiz, 'CLAUDE.md')),
  agentsMd: { existe: existsSync(join(raiz, 'AGENTS.md')) },
  skillsGlobais: listar(join(home, '.claude', 'skills')).filter((d) => d.isDirectory()).map((d) => d.name).sort(),
  plugins: plugins(),
  hooksUsuario: ajustes.hooks && typeof ajustes.hooks === 'object' ? Object.keys(ajustes.hooks) : [],
  ferramentas: { headroom: noPath('headroom'), rtk: noPath('rtk'), agy: noPath('agy') },
  proxy: process.env.ANTHROPIC_BASE_URL ?? ajustes.env?.ANTHROPIC_BASE_URL ?? null,
  tipoProjeto: tipoProjeto(),
  kitAtivo: projetoAtivo(raiz),
  estadoProjeto: existsSync(join(raiz, 'docs', 'projeto', 'ESTADO.md')),
  runBat: existsSync(join(raiz, 'run.bat')),
};

console.log(JSON.stringify(resultado, null, 2));
