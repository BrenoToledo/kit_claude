#!/usr/bin/env node
// SessionStart: no máximo 6 linhas de contexto. Sempre sai com 0.
import { lerEntrada, acharRaiz, projetoAtivo, lerEstado } from './lib/projeto.mjs';

try {
  const entrada = await lerEntrada();
  const raiz = acharRaiz(entrada?.cwd ?? process.cwd());
  if (raiz && projetoAtivo(raiz)) {
    const estado = lerEstado(raiz);
    const linhas = [
      `[kit] Projeto no método do kit. Fase: ${estado.fase || 'não iniciada'}.`,
      `[kit] Próxima ação: ${estado.proxima || 'rode /kit:levantando-requisitos'}.`,
      '[kit] Leia docs/projeto/ESTADO.md antes de agir. Regras em AGENTS.md.',
    ];
    process.stdout.write(linhas.join('\n') + '\n');
  } else if (raiz) {
    process.stdout.write('[kit] Este projeto ainda não usa o kit. Para ativar: /kit:setup.\n');
  }
} catch {
  // silêncio: um aviso que falha não pode atrapalhar a sessão
}
process.exitCode = 0;
