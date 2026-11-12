# Script pontual

## Quando é este

Uma tarefa delimitada: converter arquivos, migrar dados, gerar um relatório, automatizar um passo manual.

## Perguntas

1. Qual é a entrada e qual é a saída esperada? Há um exemplo de cada? (define o teste)
2. Roda uma vez ou vai se repetir? (define o cuidado com configuração)
3. Quem roda, e em que máquina? (define dependências e instruções)
4. Se der erro no meio, pode rodar de novo do início? (define retomada)
5. Há dado que não pode ser alterado nem apagado? (define modo de simulação e cópia de segurança)
6. Qual o tamanho da entrada real? (define se cabe em memória)

## Erros comuns se pular

- Script que altera dado de produção sem cópia de segurança.
- Funciona no exemplo pequeno e trava no arquivo real.
- Rodar duas vezes duplica o resultado.
