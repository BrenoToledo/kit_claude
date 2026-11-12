---
name: executando
description: Use quando existe um plano aprovado e há uma tarefa pendente em docs/projeto/tarefas para implementar, uma por vez.
---

# Executando uma tarefa

Implementa uma tarefa do plano, com teste primeiro. O contexto é só o arquivo da tarefa e os contratos que ela cita.

## Passos

1. **Escolha a tarefa.** Leia `docs/projeto/ESTADO.md` e abra a tarefa indicada em `proxima`, ou a primeira com `status: pendente`. Confira:
   - toda tarefa em `depende_de` está `pronta`;
   - todo contrato em `contratos` está `congelado`.

   Se algo falha, pare e diga o que falta.

2. **Leia só o necessário:** o arquivo da tarefa e os contratos citados. Requisitos, desenho e outras tarefas ficam fechados.

3. **Decida quem executa.** Se `executor: claude-menor` e houver ferramenta de subagente, entregue a tarefa ao agente `kit:executor` (modelo menor), passando só o caminho do arquivo da tarefa. Quando ele devolver, confira o passo 8 e siga para a verificação. Nos demais casos, siga você mesmo.

4. **Assuma a tarefa.** No cabeçalho: `responsavel: <quem executa>`, `status: em-andamento`. Faça commit só desse arquivo, com a mensagem `Assume tarefa NNN`. Esse commit marca o início da tarefa.

5. **Escreva o teste** descrito em `Teste que prova`, a partir do contrato. Rode. Ele precisa falhar pelo motivo certo: a funcionalidade ainda não existe. Se passar de primeira, o teste não prova nada; refaça.

6. **Escreva o mínimo de código** para o teste passar. Antes, percorra a regra 5: já existe no projeto? A biblioteca padrão resolve? Uma dependência já instalada resolve?

7. **Rode o teste da tarefa e a suíte inteira.** Leia a saída. Tudo precisa passar.

8. **Encerre a implementação.** No cabeçalho: `status: em-revisao`. Em `Notas`, registre o comando de teste e o resultado. Faça commit com código, teste e tarefa.

## Quando parar e perguntar

- O contrato não cobre algo que a tarefa precisa. Registre em `ESTADO.md` e pare: contrato congelado só muda voltando ao desenho.
- A tarefa exige dependência nova.
- O teste só passa mudando código fora do escopo da tarefa.

## Conferência

- O teste falhou antes do código e passa agora.
- Só arquivos da tarefa foram alterados.
- Nenhum contrato foi editado.
- O cabeçalho está em `em-revisao`, e não em `pronta`.

Próxima etapa: verificando-seguranca, na mesma conversa, lendo o diff da tarefa.
