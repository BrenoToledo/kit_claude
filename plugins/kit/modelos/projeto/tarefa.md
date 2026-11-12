---
status: pendente
responsavel:
depende_de: []
contratos: []
executor: claude
seguranca: pendente
---

# Tarefa NNN: nome

`status` aceita `pendente`, `em-andamento`, `em-revisao` ou `pronta`. `executor` aceita `claude`, `claude-menor` ou `agy`. `seguranca` aceita `pendente` ou `ok`.
Quem assume a tarefa preenche `responsavel`, muda o status para `em-andamento` e faz commit antes de começar.
Quem executa termina em `em-revisao`. Só a revisão muda para `pronta`, e só com teste alterado e `seguranca: ok`.

## Objetivo

(uma frase)

## Critério de pronto

(um único critério, verificável)

## Teste que prova

(o teste que falha antes e passa depois, com o comando para rodar)

## Notas

(o que quem executa precisa saber e não está nos contratos)
