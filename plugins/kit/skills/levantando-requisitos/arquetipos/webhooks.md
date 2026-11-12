# Webhooks

## Quando é este

Outro sistema avisa o seu quando algo acontece: pagamento confirmado, pedido criado, alarme disparado.

## Perguntas

1. Quem envia e que eventos envia? (define os tipos tratados)
2. Como confirmar que a mensagem veio mesmo de quem diz? (assinatura, segredo compartilhado)
3. O remetente reenvia quando não recebe resposta? O mesmo evento pode chegar duas vezes? (exige tratar repetição)
4. Os eventos podem chegar fora de ordem? (define como resolver estado)
5. Em quanto tempo é preciso responder? (define se processa na hora ou enfileira)
6. O que fazer quando o processamento falha depois de ter respondido? (define nova tentativa e alerta)
7. É preciso guardar a mensagem original? (permite reprocessar e auditar)

## Erros comuns se pular

- Evento repetido processado duas vezes, como uma cobrança em dobro.
- Endpoint aberto que aceita mensagem de qualquer origem.
- Processamento lento que estoura o tempo do remetente.
