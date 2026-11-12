---
name: handoff
description: Use quando a conversa vai ser encerrada, trocada por uma nova, ou o trabalho vai passar para outra IA ou pessoa no meio de uma etapa.
---

# Handoff

Deixa o projeto em um estado que qualquer IA ou pessoa retoma lendo só `docs/projeto/ESTADO.md`. Nada do que importa pode ficar apenas na conversa.

## Passos

1. **Feche o que está aberto.** Para cada alteração sem commit, decida: faz commit (trabalho coerente) ou descreve em `ESTADO.md` como "em andamento, não commitado".

2. **Confira os arquivos de tarefa.** O `status` de cada um reflete a realidade. Tarefa parada no meio continua `em-andamento`, com o ponto em que parou escrito em `Notas`.

3. **Atualize `docs/projeto/ESTADO.md`:**
   - cabeçalho: `fase` e `proxima` (uma frase com a próxima ação, com o comando do kit quando houver);
   - `## Última ação`: o que foi feito nesta sessão, em até cinco linhas;
   - `## Em aberto`: dúvidas, decisões pendentes do dono do projeto, bloqueios;
   - `## Histórico`: uma linha com a data.

4. **Registre decisões** tomadas na conversa em `DECISOES.md`, uma linha cada, com o motivo.

5. **Faça commit** de `docs/projeto/`.

6. **Mostre ao usuário** o texto exato para abrir a próxima conversa, por exemplo: `Leia docs/projeto/ESTADO.md e siga a próxima ação.`

## Conferência

Releia `ESTADO.md` como alguém que nunca viu a conversa:

- Dá para saber o que fazer em seguida?
- Dá para saber o que já está pronto e o que está pela metade?
- Alguma informação necessária está só na conversa? Se sim, escreva no arquivo certo.

Próxima etapa: a que estiver em `proxima` no ESTADO.md, em conversa nova, lendo docs/projeto/ESTADO.md.
