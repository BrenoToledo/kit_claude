#!/usr/bin/env node
// Uso: node medir.mjs [--raiz <pasta>] [--json]
// Resume o uso do kit no projeto: bloqueios, modo rápido e situação das tarefas.
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { acharRaiz, lerCabecalho } from './lib/projeto.mjs';

const args = process.argv.slice(2);
const i = args.indexOf('--raiz');
const raiz = i >= 0 ? args[i + 1] : acharRaiz(process.cwd()) ?? process.cwd();

const eventos = {};
try {
  for (const linha of readFileSync(join(raiz, '.claude', 'kit-eventos.jsonl'), 'utf8').split(/\r?\n/)) {
    try {
      const tipo = JSON.parse(linha).tipo;
      if (typeof tipo === 'string') eventos[tipo] = (eventos[tipo] ?? 0) + 1;
    } catch { /* linha inválida: ignora */ }
  }
} catch { /* sem arquivo de eventos */ }

const tarefas = { total: 0, pendente: 0, 'em-andamento': 0, 'em-revisao': 0, pronta: 0 };
let comRevisao = 0;
try {
  const pasta = join(raiz, 'docs', 'projeto', 'tarefas');
  for (const nome of readdirSync(pasta).filter((n) => n.endsWith('.md'))) {
    const texto = readFileSync(join(pasta, nome), 'utf8');
    const status = lerCabecalho(texto).status;
    tarefas.total++;
    if (status in tarefas && status !== 'total') tarefas[status]++;
    if (/^## Revisão/m.test(texto)) comRevisao++;
  }
} catch { /* sem tarefas */ }

const resultado = { eventos, tarefas, tarefasComRevisaoRegistrada: comRevisao };
if (args.includes('--json')) {
  console.log(JSON.stringify(resultado, null, 2));
} else {
  console.log(`Tarefas: ${tarefas.total} (pendente ${tarefas.pendente}, em andamento ${tarefas['em-andamento']}, em revisão ${tarefas['em-revisao']}, pronta ${tarefas.pronta})`);
  console.log(`Tarefas com revisão registrada: ${comRevisao}`);
  const nomes = Object.keys(eventos).sort();
  console.log(nomes.length ? 'Eventos:' : 'Eventos: nenhum registrado');
  for (const n of nomes) console.log(`  ${n}: ${eventos[n]}`);
}
