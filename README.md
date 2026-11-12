# kit_claude

Plugin do Claude Code que faz o desenvolvimento seguir sempre o mesmo método: requisitos, desenho com contratos, plano em tarefas e só então código. O que é obrigatório é garantido por hooks; o que exige julgamento fica em skills encadeadas. Todo o estado do projeto fica em Markdown, para que outras IAs e pessoas trabalhem sobre os mesmos arquivos.

## Instalação

No Claude Code (terminal ou aba Code do Claude Desktop):

```
/plugin marketplace add BrenoToledo/kit_claude
/plugin install kit@kit-claude
```

Depois, dentro do projeto:

```
/kit:setup
```

Requisito: Node.js 20 ou mais novo no PATH (os hooks são scripts Node, sem dependências).

## As dez regras

1. Requisito antes de tudo.
2. Contrato antes de implementação.
3. Série por padrão; paralelo só com contrato congelado.
4. Teste primeiro.
5. O mais simples que atende.
6. Tarefa pequena, em arquivo próprio.
7. Verificar antes de dizer pronto.
8. Tela aprovada antes de tela codada.
9. Reaproveitar antes de criar, e criar para reaproveitar.
10. Toda falha deixa log suficiente para ser reproduzida.

O texto completo vai para o `AGENTS.md` do seu projeto.

## Comandos

| Comando | O que faz |
|---|---|
| `/kit:setup` | Diagnostica o Claude Code e o projeto; corrige com a sua confirmação; ativa o kit |
| `/kit:levantando-requisitos` | Classifica o pedido, faz as perguntas do arquétipo e grava `REQUISITOS.md` |
| `/kit:desenhando-solucao` | Partes, contratos, padrão de API e simulado de tela |
| `/kit:planejando` | Tarefas em arquivo, dependências e grupos paralelos |
| `/kit:executando` | Implementa uma tarefa, com teste primeiro |
| `/kit:verificando-seguranca` | Confere o diff da tarefa contra o checklist de segurança |
| `/kit:revisando` | Confere a tarefa contra o contrato e marca como pronta |
| `/kit:reproduzindo-falha` | Do log ao teste que falha, e só então à correção |
| `/kit:handoff` | Grava o estado para retomar em outra conversa ou por outra IA |
| `/kit:rapido` | Libera os bloqueios de requisito e de simulado por 4 horas para um ajuste pequeno |

Tarefas marcadas com `executor: claude-menor` vão para o agente `kit:executor`, que roda em modelo menor (definido em `plugins/kit/agents/executor.md`, campo `model`).

Cada etapa termina dizendo qual é a próxima e qual arquivo ela lê. Comece cada etapa em conversa nova: o contexto fica pequeno e o consumo cai.

## O que os hooks garantem

Só no Claude Code e no Cowork; no chat as skills funcionam, mas nada é bloqueado.

| Situação | Efeito |
|---|---|
| Projeto ativo, código sem `REQUISITOS.md` aprovado | Escrita bloqueada |
| Projeto ativo, arquivo de interface sem simulado aprovado | Escrita bloqueada |
| Projeto ativo, tarefa marcada `pronta` sem teste alterado ou sem `seguranca: ok` | Escrita bloqueada |
| Qualquer projeto: `.env`, chave privada, senha ou token literal | Escrita bloqueada |
| Qualquer projeto: `git add`/`commit` levando `.env` | Comando bloqueado |
| Início de sessão | Fase atual e próxima ação, em três linhas |

Projeto ativo é aquele em que o `/kit:setup` rodou. Documentação e configuração (`docs/`, `.md`, `.json`, `.yaml` e afins) nunca são bloqueadas. Se um hook falhar por erro interno, ele libera.

## Padrão de log

Todo projeto segue `docs/padroes/LOG.md` (copiado pelo `/kit:setup`): uma linha JSON por evento, `id_correlacao` por requisição e, em todo erro, `entrada`, `estado` e `erro`. Duas ferramentas leem o log de qualquer linguagem:

```
node plugins/kit/hooks/validar-log.mjs app.jsonl
node plugins/kit/hooks/extrair-falha.mjs app.jsonl <id_correlacao>
```

Há uma implementação de referência em Python em `plugins/kit/modelos/log/python/kit_log.py`.

## Arquivos do projeto

```
docs/projeto/
  ESTADO.md  REQUISITOS.md  DESENHO.md  PLANO.md  DECISOES.md
  contratos/  telas/  tarefas/
```

## Testes

```
node --test
```

## Ainda não incluído

Pacotes de domínio (Django, automação, rotinas de casa), biblioteca de componentes, orquestração do Antigravity e máscara de dados sensíveis. A especificação está em `docs/specs/`.
