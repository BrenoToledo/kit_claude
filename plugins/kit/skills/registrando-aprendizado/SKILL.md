---
name: registrando-aprendizado
description: Use quando uma etapa do kit encontra algo crítico (bug confirmado por teste, falha de segurança, bloqueio indevido de um hook, ou uma lacuna do método que deixou o problema passar).
---

# Registrando um aprendizado

Transforma um problema crítico em proposta de melhoria do kit. O relato fica no projeto; a proposta vai como pedido de mesclagem (PR) para o repositório do kit. O dono do kit decide.

## Quando registrar

- Bug confirmado por um teste que falhava.
- Falha de segurança encontrada na verificação.
- Um hook do kit bloqueou algo correto, ou deixou passar algo errado.
- O problema existiria mesmo seguindo o método: faltou pergunta, item de checklist ou regra.

Melhoria de estilo e preferência pessoal ficam em `Notas` da tarefa.

## Passos

1. **Grave o relato no projeto,** em `docs/projeto/aprendizados/AAAA-MM-DD-<assunto>.md`, a partir de `modelos/projeto/aprendizado.md` (em `<diretório base desta skill>/../../modelos/`). Faça commit.

2. **Escreva a versão para o kit,** em termos genéricos. Retire: nome de cliente, de empresa e de projeto; endereço de rede e nome de máquina; dado pessoal; trecho de código do projeto. Descreva o padrão do problema.

3. **Mostre ao usuário o texto exato que será enviado e peça confirmação.** Sem o sim, pare aqui: o relato local já está salvo.

4. **Com o sim, abra o PR** no repositório do kit (campo `repositorioKit` de `.claude/kit-estado.json`; padrão `BrenoToledo/kit_claude`), a partir de uma pasta temporária fora do projeto:

   ```
   gh repo clone BrenoToledo/kit_claude <pasta temporária>
   git checkout -b aprendizado/AAAA-MM-DD-<assunto>
   (grave o arquivo em aprendizados/AAAA-MM-DD-<assunto>.md)
   git add aprendizados && git commit -m "Aprendizado: <título>"
   git push -u origin HEAD
   gh pr create --title "Aprendizado: <título>" --body-file aprendizados/AAAA-MM-DD-<assunto>.md
   ```

5. **O PR só acrescenta o arquivo em `aprendizados/`.** Mudança em skill, hook ou padrão é sugerida no texto e feita depois, pelo dono do kit.

6. **Informe o endereço do PR** e anote-o no relato local.

## Sem `gh` ou sem acesso

Se `gh` não está instalado ou autenticado, ou o envio falha, diga isso ao usuário, deixe o arquivo genérico pronto em `docs/projeto/aprendizados/` com o sufixo `-para-o-kit.md` e mostre os comandos acima para ele rodar.

## Conferência

- O texto enviado não identifica cliente, projeto, rede nem pessoa.
- O usuário confirmou o envio nesta conversa.
- O PR tem um único arquivo, em `aprendizados/`.
- Há no máximo um PR por problema.
