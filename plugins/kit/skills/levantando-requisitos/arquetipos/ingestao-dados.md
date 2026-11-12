# Ingestão de dados

## Quando é este

Dados chegam de equipamentos, sensores, CLPs, arquivos ou outros sistemas e são guardados para consulta e relatório.

## Perguntas

1. De onde vêm os dados e por qual protocolo? (OPC UA, arquivo, banco, HTTP)
2. Com que frequência e em que volume? (define armazenamento e desempenho)
3. O que fazer com dado atrasado, duplicado ou fora de ordem? (acontece sempre)
4. Em que fuso e formato vêm data e hora? Qual relógio vale? (fonte clássica de erro)
5. Se a conexão cair, a origem guarda e reenvia ou o dado se perde? (define tolerância a falha)
6. Por quanto tempo os dados ficam guardados? (define retenção e custo)
7. Quem consome depois: relatório, painel, outro sistema? (define o formato de saída)
8. Como saber que a coleta parou? (define monitoramento)
9. O dado bruto é guardado além do tratado? (permite reprocessar)

## Erros comuns se pular

- Horário errado no relatório por mistura de fusos.
- Registro duplicado depois de uma reconexão.
- Coleta parada por dias sem ninguém perceber.
