#!/usr/bin/env node
// Uso: node validar-log.mjs <arquivo.jsonl> [outros arquivos]
// Confere se o log segue o padrão do kit. Sai com 0 se tudo certo, 1 se há problema.
import { readFileSync } from 'node:fs';
import { validarTexto } from './lib/log.mjs';

const arquivos = process.argv.slice(2);
if (!arquivos.length) {
  console.log('Uso: validar-log.mjs <arquivo.jsonl> [outros arquivos]');
  process.exit(1);
}
let falhou = false;
for (const arquivo of arquivos) {
  let texto;
  try {
    texto = readFileSync(arquivo, 'utf8');
  } catch {
    console.log(`${arquivo}: não foi possível ler o arquivo`);
    falhou = true;
    continue;
  }
  const { linhas, erros } = validarTexto(texto);
  for (const e of erros) console.log(`${arquivo}: linha ${e.linha}: ${e.erro}`);
  console.log(`${arquivo}: ${linhas} eventos, ${erros.length} problemas`);
  if (erros.length) falhou = true;
}
process.exit(falhou ? 1 : 0);
