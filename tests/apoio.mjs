import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

export const HOOKS = join(dirname(fileURLToPath(import.meta.url)), '..', 'plugins', 'kit', 'hooks');

export const APROVADO = '---\nfase: desenho\nrequisitos: aprovado\nsimulado: pendente\n---\n';

// opcoes: ativo (bool|undefined), git (bool), estado (texto de ESTADO.md),
// requisitos (bool), rapidoAte (ISO)
export function criarProjeto(opcoes = {}) {
  const raiz = mkdtempSync(join(tmpdir(), 'kit-'));
  if (opcoes.git) mkdirSync(join(raiz, '.git'));
  if (opcoes.ativo !== undefined) {
    mkdirSync(join(raiz, '.claude'), { recursive: true });
    writeFileSync(join(raiz, '.claude', 'kit-estado.json'), JSON.stringify({ ativo: opcoes.ativo }));
  }
  if (opcoes.estado !== undefined || opcoes.requisitos) mkdirSync(join(raiz, 'docs', 'projeto'), { recursive: true });
  if (opcoes.estado !== undefined) writeFileSync(join(raiz, 'docs', 'projeto', 'ESTADO.md'), opcoes.estado);
  if (opcoes.requisitos) writeFileSync(join(raiz, 'docs', 'projeto', 'REQUISITOS.md'), '# Requisitos\n');
  if (opcoes.rapidoAte) {
    mkdirSync(join(raiz, '.claude'), { recursive: true });
    writeFileSync(join(raiz, '.claude', 'kit-rapido'), opcoes.rapidoAte);
  }
  return raiz;
}

export function rodarHook(arquivo, entrada, args = [], opcoes = {}) {
  const r = spawnSync(process.execPath, [join(HOOKS, arquivo), ...args], {
    input: typeof entrada === 'string' ? entrada : JSON.stringify(entrada),
    encoding: 'utf8',
    ...opcoes,
  });
  return { codigo: r.status, stdout: r.stdout, stderr: r.stderr };
}
