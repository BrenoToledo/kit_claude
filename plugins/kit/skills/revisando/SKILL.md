---
name: revisando
description: Use quando uma tarefa está em em-revisao com seguranca ok, para conferir o trabalho contra o contrato antes de marcar como pronta.
---

# Revisando uma tarefa

Última conferência antes de `pronta`. Compara o que foi feito com o que foi combinado. Só esta etapa muda o status para `pronta`.

## Passos

1. **Leia** o arquivo da tarefa, os contratos que ela cita e `docs/projeto/DESENHO.md`. Monte o diff desde o commit `Assume tarefa NNN`:

   ```
   git log --format=%H -S "status: em-andamento" -- docs/projeto/tarefas/NNN-*.md
   git diff <último hash da lista>
   ```

2. **Rode o teste da tarefa e a suíte inteira** agora (`test.bat`, com lint incluído). Leia a saída. Um resultado anotado em `Notas` não substitui rodar.

3. **Confira, item por item:**
   - **Contrato:** entrada, saída e erros implementados como escritos, incluindo o exemplo.
   - **Critério de pronto:** atendido, e o teste o prova.
   - **Teste:** falharia se o código da tarefa fosse removido.
   - **Regra 5:** nada além do necessário; nenhuma dependência nova sem justificativa.
   - **Escopo:** só arquivos da tarefa mudaram; nenhum contrato foi editado.
   - **Regra 9:** alguma peça serve a outros lugares? Se sim, está isolada? Anote em `Notas` como candidata à biblioteca.
   - **Log:** todo caminho de erro novo registra `entrada`, `estado`, `erro` e `id_correlacao`, conforme `docs/padroes/LOG.md`, e há teste conferindo.
   - **Segurança:** `seguranca: ok` e a seção `## Segurança` preenchida.

4. **Classifique cada achado:**
   - **bloqueia:** contrato descumprido, teste que não prova, falha de segurança;
   - **anotar:** melhoria que não muda o comportamento combinado.

   Achado crítico (bug confirmado, falha de segurança, lacuna do método): rode `/kit:registrando-aprendizado`.

5. **Se há achado que bloqueia:** grave os achados em `## Revisão` na tarefa, volte para `status: em-andamento` e indique `/kit:executando` (passos 5 a 8). A tarefa repete verificação e revisão depois.

6. **Se não há:** grave `## Revisão` com data, o que foi conferido e os achados anotados. Mude para `status: pronta`. Atualize `ESTADO.md`: `Última ação` e `proxima` com a próxima tarefa pendente; se foi a última, `fase: revisao` e `proxima: revisão final com o dono do projeto`. Faça commit.

## Conferência

- A suíte rodou nesta etapa, e a saída foi lida.
- Cada item do passo 3 tem resposta escrita na tarefa.
- O que não foi possível conferir está escrito como "não conferido", com o motivo.

Próxima etapa: executando, em conversa nova, lendo a próxima tarefa pendente. Se a conversa for interrompida antes, rode /kit:handoff.
