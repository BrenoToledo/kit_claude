# Resultados da Entrega 1

Data: 2026-11-11.

## Verificado por teste automático

`node --test`, em Linux com Node 22: 73 testes, 73 passaram. Cobre:

- os quatro scripts de hook com entrada simulada, incluindo caminho do Windows, stdin vazio, JSON inválido, CRLF e sessão em subpasta;
- o diagnóstico com pastas de usuário e de projeto simuladas;
- o modo rápido;
- a estrutura do plugin, o frontmatter e o tamanho das skills, os modelos e os arquétipos;
- um percurso de ponta a ponta com os hooks e os modelos reais (`tests/ponta-a-ponta.test.mjs`): setup, bloqueio, aprovação dos requisitos, bloqueio de tela, aprovação do simulado.

## Não verificado

Estes passos do plano não foram executados e ficam para a validação na máquina do Breno:

| Passo do plano | Por quê |
|---|---|
| Tarefa 7, passo 6: cenário da skill `setup` com subagente | Depende do plugin instalado de verdade no Claude Code |
| Tarefa 8, passos 2 e 5: cenário de base e cenário com a skill `levantando-requisitos` | Idem |
| Tarefa 9, passos 1 e 4: cenários da skill `desenhando-solucao` | Idem |
| Tarefa 10, passos 1 e 4: cenários da skill `planejando` | Idem |
| Tarefa 11, passo 1: cenário completo com modelo menor | Idem |
| Instalação pelo `/plugin` e disparo real dos hooks no Windows | Só é possível no Claude Code local |

Ou seja: os scripts estão testados; o comportamento das skills com um modelo real ainda não foi observado.

## Roteiro de validação na máquina

1. Instalar: `/plugin marketplace add BrenoToledo/kit_claude` e `/plugin install kit@kit-claude`.
2. Em uma pasta vazia com `git init`, abrir o Claude Code e conferir a linha `[kit] Este projeto ainda não usa o kit`.
3. Rodar `/kit:setup` e conferir: tabela de diagnóstico, confirmação antes de cada escrita, `AGENTS.md`, `docs/projeto/ESTADO.md` e `.claude/kit-estado.json` criados.
4. Pedir "crie um app.py com um hello world" e conferir o bloqueio.
5. Pedir "quero uma API de pedidos para minha loja" e observar: uma pergunta por mensagem, as três perguntas de segurança, nenhuma sugestão de tecnologia, `REQUISITOS.md` completo, aprovação só com o seu sim.
6. Em conversa nova, `/kit:desenhando-solucao`; depois, em outra, `/kit:planejando`.
7. Anotar aqui o que funcionou e o que não funcionou.
