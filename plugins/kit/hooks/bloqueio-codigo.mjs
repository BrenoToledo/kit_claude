#!/usr/bin/env node
// PreToolUse (Write|Edit|MultiEdit|NotebookEdit): sem requisito aprovado não se escreve código;
// sem simulado aprovado não se escreve interface. Qualquer erro interno libera.
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { lerEntrada, acharRaiz, projetoAtivo, lerEstado, modoRapido, classificar } from './lib/projeto.mjs';

function decidir(entrada) {
  const caminho = entrada?.tool_input?.file_path ?? entrada?.tool_input?.notebook_path;
  if (!caminho || typeof caminho !== 'string') return null;
  const raiz = acharRaiz(entrada.cwd);
  if (!raiz || !projetoAtivo(raiz)) return null;
  if (modoRapido(raiz)) return null;
  const tipo = classificar(caminho, raiz);
  if (tipo === 'livre') return null;
  const estado = lerEstado(raiz);
  if (!existsSync(join(raiz, 'docs', 'projeto', 'REQUISITOS.md')) || estado.requisitos !== 'aprovado') {
    return 'Bloqueado pelo kit: não há requisitos aprovados. Rode /kit:levantando-requisitos ou, para um ajuste pequeno, /kit:rapido.';
  }
  if (tipo === 'interface' && estado.simulado !== 'aprovado' && estado.simulado !== 'nao-se-aplica') {
    return 'Bloqueado pelo kit: tela sem simulado aprovado. Rode /kit:desenhando-solucao.';
  }
  return null;
}

try {
  const motivo = decidir(await lerEntrada());
  if (motivo) {
    process.stderr.write(motivo + '\n');
    process.exitCode = 2;
  }
} catch {
  process.exitCode = 0;
}
