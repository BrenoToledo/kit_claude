#!/usr/bin/env node
// Uso: node modo-rapido.mjs ligar|desligar [--raiz <pasta>]
// Liga por 4 horas (ou desliga) a liberação dos bloqueios de requisito e de simulado no projeto.
import { acharRaiz, ligarRapido, desligarRapido } from './lib/projeto.mjs';

const args = process.argv.slice(2);
const acao = args[0];
const i = args.indexOf('--raiz');
const raiz = i >= 0 ? args[i + 1] : acharRaiz(process.cwd());

if (!raiz) {
  console.log('Nenhum projeto encontrado.');
  process.exitCode = 1;
} else if (acao === 'ligar') {
  const ate = new Date(ligarRapido(raiz));
  console.log(`Modo rápido ligado até ${ate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}.`);
} else if (acao === 'desligar') {
  desligarRapido(raiz);
  console.log('Modo rápido desligado.');
} else {
  console.log('Uso: modo-rapido.mjs ligar|desligar [--raiz <pasta>]');
  process.exitCode = 1;
}
