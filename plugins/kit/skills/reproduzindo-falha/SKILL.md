---
name: reproduzindo-falha
description: Use quando há um erro em produção, homologação ou teste a investigar e existe log no padrão do kit, ou quando o usuário traz um id_correlacao ou um arquivo de log.
---

# Reproduzindo uma falha

Parte do log, chega a um teste que falha do mesmo jeito e só então corrige. Sem teste que reproduz, a correção é um palpite.

## Passos

1. **Localize a falha.** Com o arquivo de log:

   ```
   node "<diretório base desta skill>/../../hooks/extrair-falha.mjs" <arquivo.jsonl>
   ```

   A saída lista as correlações com erro. Se o usuário já trouxe o `id_correlacao`, use o dele.

2. **Extraia a falha:**

   ```
   node "<diretório base desta skill>/../../hooks/extrair-falha.mjs" <arquivo.jsonl> <id_correlacao>
   ```

   O resultado fica em `docs/projeto/falhas/<id>.md`, com linha do tempo, entrada, estado e erro.

3. **Leia só esse arquivo** e o código apontado pela pilha. Confira a `versao` registrada: se for diferente do código atual, diga isso antes de seguir e veja se a falha ainda existe.

4. **Escreva o teste que reproduz:** monte o `estado`, envie a `entrada`, espere o mesmo `erro.tipo`. Rode. O teste precisa falhar pelo mesmo motivo do log.

5. **Se o teste não falha**, o log não tem tudo. Descubra o que falta (hora, valor aleatório, resposta de serviço externo, concorrência) e anote em `## Causa e correção`. Faltar informação é um defeito do log: corrija o registro para que a próxima falha desse tipo seja reproduzível.

6. **Com o teste falhando**, encontre a causa e escreva a correção mínima. Rode o teste e a suíte inteira.

7. **Preencha no arquivo da falha** `## Teste que reproduz` (caminho do teste) e `## Causa e correção` (o que era, o que mudou).

8. **Registre o aprendizado** com `/kit:registrando-aprendizado`: o que o método deixou passar e como pegar antes.

9. **Se a correção exige mudar um contrato**, pare: registre em `ESTADO.md` e volte ao desenho.

## Quando não há log no padrão

Rode `validar-log.mjs` no arquivo para ver o que falta. Peça ao usuário entrada e estado da falha, siga do passo 4 e inclua na correção o log que faltou, conforme `docs/padroes/LOG.md`.

## Conferência

- O teste falhou antes da correção, pelo mesmo erro do log.
- O teste passa depois, e a suíte inteira também.
- O arquivo em `docs/projeto/falhas/` está completo.
- O caminho de erro corrigido continua registrando entrada, estado e `id_correlacao`.

Próxima etapa: verificando-seguranca e revisando, na mesma conversa, sobre o diff da correção.
