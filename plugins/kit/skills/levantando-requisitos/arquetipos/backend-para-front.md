# Backend para um front

## Quando é este

Existe (ou vai existir) um site, app ou tela específica, e o backend serve só a ela.

## Perguntas

1. Quais telas existem e o que cada uma mostra e faz? (define os recursos)
2. Quem define o contrato: o front, o back ou os dois juntos? (define a ordem de trabalho)
3. Como o usuário final entra? (sessão, JWT, login social)
4. Algo precisa atualizar em tempo real ou basta consultar? (define se há canal de eventos)
5. Que listas precisam de paginação, filtro e ordenação? (define parâmetros)
6. Que erros a tela precisa mostrar de forma diferente? (define códigos de erro)
7. Funciona sem conexão ou com conexão ruim? (define cache e reenvio)
8. Front e back serão feitos em paralelo? (exige contrato congelado antes)

## Erros comuns se pular

- Front e back combinam formatos de cabeça e não se encaixam.
- Tela sem estado de erro ou de carregamento.
- Endpoint genérico demais, que a tela precisa chamar cinco vezes.
