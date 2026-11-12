# CRUD interno

## Quando é este

Sistema de cadastro e consulta usado pela própria equipe: painel administrativo, controle de estoque, gestão de clientes.

## Perguntas

1. Quais são as coisas cadastradas e como se relacionam? (define o modelo de dados)
2. Quem pode ver e quem pode alterar cada coisa? (define perfis e permissões)
3. Quantos registros e quantos usuários ao mesmo tempo? (define paginação e índices)
4. Que listagens, filtros e buscas são usados no dia a dia? (define as telas principais)
5. Precisa de relatório ou exportação? Em que formato? (costuma aparecer só no fim)
6. É preciso saber quem alterou o quê e quando? (auditoria muda o modelo)
7. Existem dados em planilha ou sistema antigo para importar? (a importação é um projeto à parte)
8. O que não pode ser apagado, só desativado? (define exclusão lógica)

## Erros comuns se pular

- Permissão tratada depois, espalhada pelo código.
- Sem auditoria, e alguém pergunta quem mudou um valor.
- Listagem sem paginação que trava com dados reais.
