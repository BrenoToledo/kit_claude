#!/usr/bin/env node
// Uso: node extrair-falha.mjs <arquivo.jsonl> [id_correlacao] [--raiz <pasta>]
// Sem id: lista as correlações que têm erro. Com id: grava docs/projeto/falhas/<id>.md
// com a linha do tempo, a entrada, o estado e o erro, para reproduzir a falha.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { lerEventos } from './lib/log.mjs';
import { acharRaiz } from './lib/projeto.mjs';

const args = process.argv.slice(2);
const i = args.indexOf('--raiz');
const raiz = i >= 0 ? args.splice(i, 2)[1] : acharRaiz(process.cwd()) ?? process.cwd();
const [arquivo, id] = args;
const ehErro = (e) => e.nivel === 'erro' || e.nivel === 'critico';
const bloco = (v) => '```json\n' + JSON.stringify(v ?? null, null, 2) + '\n```';

if (!arquivo) {
  console.log('Uso: extrair-falha.mjs <arquivo.jsonl> [id_correlacao] [--raiz <pasta>]');
  process.exit(1);
}
let eventos;
try {
  eventos = lerEventos(readFileSync(arquivo, 'utf8')).map((x) => x.evento).filter((e) => e && typeof e === 'object');
} catch {
  console.log(`Não foi possível ler ${arquivo}.`);
  process.exit(1);
}

if (!id) {
  const comErro = new Map();
  for (const e of eventos.filter(ehErro)) {
    if (!comErro.has(e.id_correlacao)) comErro.set(e.id_correlacao, e);
  }
  if (!comErro.size) console.log('Nenhum erro encontrado no log.');
  for (const [corr, e] of comErro) console.log(`${corr}\t${e.ts}\t${e.evento}\t${e.msg}`);
  process.exit(0);
}

const dele = eventos.filter((e) => e.id_correlacao === id).sort((a, b) => String(a.ts).localeCompare(String(b.ts)));
if (!dele.length) {
  console.log(`Nenhum evento com id_correlacao ${id}.`);
  process.exit(1);
}
const erros = dele.filter(ehErro);
const ref = erros[0] ?? dele[dele.length - 1];
const limpo = (t) => String(t ?? '').replace(/\|/g, '\\|').replace(/\r?\n/g, ' ');

const partes = [
  `# Falha ${id}`,
  '',
  `- Serviço: ${ref.servico}`,
  `- Versão do código: ${ref.versao}`,
  `- Ambiente: ${ref.ambiente}`,
  `- Período: ${dele[0].ts} a ${dele[dele.length - 1].ts}`,
  `- Origem: ${arquivo}`,
  '',
  '## Linha do tempo',
  '',
  '| ts | nível | evento | msg |',
  '|---|---|---|---|',
  ...dele.map((e) => `| ${e.ts} | ${e.nivel} | ${e.evento} | ${limpo(e.msg)} |`),
  '',
];
if (!erros.length) partes.push('Nenhum evento de erro nesta correlação.', '');
erros.forEach((e, n) => {
  const sufixo = erros.length > 1 ? ` (${n + 1} de ${erros.length}: ${e.evento})` : '';
  partes.push(`## Entrada${sufixo}`, '', bloco(e.entrada), '', `## Estado${sufixo}`, '', bloco(e.estado), '', `## Erro${sufixo}`, '', bloco(e.erro), '');
});
partes.push(
  '## Teste que reproduz',
  '',
  '(a preencher: caminho do teste que monta o estado acima, envia a entrada acima e falha com o mesmo erro)',
  '',
  '## Causa e correção',
  '',
  '(a preencher depois que o teste falhar pelo motivo certo)',
  '',
);

const pasta = join(raiz, 'docs', 'projeto', 'falhas');
mkdirSync(pasta, { recursive: true });
const destino = join(pasta, `${String(id).replace(/[^A-Za-z0-9._-]/g, '_')}.md`);
writeFileSync(destino, partes.join('\n'));
console.log(`Falha extraída em ${destino} (${dele.length} eventos, ${erros.length} erros).`);
