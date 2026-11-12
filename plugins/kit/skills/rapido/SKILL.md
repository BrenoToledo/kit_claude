---
name: rapido
description: Use quando o usuário pede /kit:rapido ou um ajuste pequeno e pontual que não justifica o método completo.
---

# Modo rápido

Libera por 4 horas, neste projeto, os bloqueios de requisito e de simulado. Serve para correção pontual, ajuste de texto, troca de configuração. Funcionalidade nova passa pelo método completo.

## Passos

1. Diga em uma linha o que será feito e confirme que é um ajuste pequeno. Se o pedido cria funcionalidade, tela ou integração nova, recomende `/kit:levantando-requisitos` e pergunte como o usuário prefere seguir.
2. Rode:

   ```
   node "<diretório base desta skill>/../../hooks/modo-rapido.mjs" ligar
   ```

   O diretório base é informado quando esta skill carrega.
3. Avise: o bloqueio de segredos continua valendo; o modo rápido termina sozinho em 4 horas ou com o mesmo comando trocando `ligar` por `desligar`.
4. Faça o ajuste. A regra 5 continua valendo: o mais simples que atende.
5. Ao terminar, se `docs/projeto/DECISOES.md` existe, acrescente uma linha `- AAAA-MM-DD: ajuste rápido: <o que mudou>. Motivo: <por quê>.`
6. Desligue o modo rápido com o comando do passo 2 usando `desligar`.
