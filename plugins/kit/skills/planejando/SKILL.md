---
name: planejando
description: Use quando o desenho está aprovado e os contratos estão congelados, antes de implementar.
---

# Planejando

Quebra o desenho em tarefas pequenas, cada uma em seu arquivo, com dependências explícitas. O resultado é `PLANO.md` e os arquivos em `tarefas/`, aprovados pelo usuário.

## Passos

1. **Leia `docs/projeto/DESENHO.md` e os contratos.** Se algum contrato está em `rascunho`, pare e indique `/kit:desenhando-solucao`.

2. **Quebre em tarefas.** Cada tarefa tem um único critério de pronto, verificável por um teste. Se o critério precisa de "e", são duas tarefas.

3. **Crie um arquivo por tarefa** em `docs/projeto/tarefas/NNN-nome.md` (três dígitos), a partir de `modelos/projeto/tarefa.md` (em `<diretório base desta skill>/../../modelos/`). Preencha:
   - `depende_de`: números das tarefas que precisam estar prontas antes;
   - `contratos`: os contratos que a tarefa implementa ou consome;
   - `Teste que prova`: o teste que falha antes e passa depois, com o comando.

4. **Defina os grupos paralelos.** Duas tarefas recebem o mesmo grupo quando nenhuma depende da outra e toda ligação entre elas passa por contrato congelado. Nos demais casos, série: grupo `-`.

5. **Sugira o executor de cada tarefa:**
   - `claude`: há decisão em aberto ou risco alto;
   - `claude-menor`: contrato e teste determinam o resultado.

6. **Grave `PLANO.md`** com a tabela `nº | tarefa | depende de | contratos | grupo paralelo | executor`, na ordem de execução. Mostre a tabela e peça aprovação.

7. **Com o sim do usuário**, atualize `ESTADO.md`: `fase: execucao`, `proxima: execute a tarefa 001`.

## Conferência antes de pedir aprovação

- Toda tarefa tem `Critério de pronto` e `Teste que prova`.
- Toda tarefa em grupo paralelo cita ao menos um contrato congelado.
- A tabela do `PLANO.md` e os arquivos em `tarefas/` têm as mesmas tarefas.
- A ordem respeita a ordem de construção definida nos requisitos.
- As tarefas de tela vêm depois do simulado aprovado.

Próxima etapa: executar a tarefa 001, em conversa nova, lendo docs/projeto/tarefas/001-*.md e os contratos que ela cita.
