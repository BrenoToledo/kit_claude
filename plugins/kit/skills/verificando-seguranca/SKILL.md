---
name: verificando-seguranca
description: Use quando uma tarefa está em em-revisao, antes da revisão, ou quando um bloqueio do kit pedir verificação de segurança.
---

# Verificando segurança

Confere o que a tarefa mudou contra um checklist fixo. O resultado fica no próprio arquivo da tarefa.

## Passos

1. **Monte o diff da tarefa.** O início é o commit `Assume tarefa NNN`:

   ```
   git log --format=%H -S "status: em-andamento" -- docs/projeto/tarefas/NNN-*.md
   git diff <último hash da lista>
   ```

2. **Leia o `Perfil de segurança`** em `docs/projeto/REQUISITOS.md`: quem acessa, dado sensível, exposição. Só essa seção.

3. **Percorra o checklist.** Para API, abra `checklist-api.md`. Para qualquer código, confira também:
   - segredo em variável de ambiente, nunca no código;
   - entrada externa validada antes do uso;
   - consulta a banco com parâmetros, sem montar texto com dado do usuário;
   - mensagem de erro sem detalhe interno (caminho, consulta, pilha);
   - dado sensível fora de log ou mascarado (se houver arquivo de log de teste, rode `validar-log.mjs` nele);
   - dependência nova: justificada e de fonte conhecida.

   Em automação industrial: nenhum controlador exposto à internet; leitura por padrão; escrita em controlador só com confirmação do usuário.

4. **Para cada item, responda** `ok`, `não se aplica` ou `achado`. Um achado tem arquivo, linha, o que acontece e a correção sugerida.

5. **Grave no arquivo da tarefa** a seção `## Segurança` com data, itens conferidos e achados.

6. **Feche o resultado:**
   - sem achado em aberto: `seguranca: ok` no cabeçalho;
   - com achado: rode `/kit:registrando-aprendizado`; depois `seguranca: pendente`, volte a tarefa para `em-andamento` e corrija com teste primeiro (`/kit:executando`, passos 5 a 8). Depois repita esta verificação.

## Conferência

- Cada item do checklist tem resposta; nenhum foi pulado.
- `seguranca: ok` só aparece com zero achado em aberto.
- Um item que você não conseguiu avaliar está escrito como "não avaliado", com o motivo.

Próxima etapa: revisando, na mesma conversa, lendo o diff da tarefa, os contratos que ela cita e docs/projeto/DESENHO.md.
