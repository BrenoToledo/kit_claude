# Padrão de log

Vale para todo projeto que segue o método, em qualquer linguagem.

**Objetivo:** toda falha deixa no log o que é preciso para reproduzi-la, sem depender da memória de ninguém.

## Formato

Uma linha por evento, em JSON (JSON Lines), em UTF-8. Serviços escrevem na saída padrão; scripts e aplicações de máquina escrevem em arquivo com rotação.

## Campos obrigatórios em todo evento

| Campo | Conteúdo | Exemplo |
|---|---|---|
| `ts` | Data e hora em UTC, com milissegundos | `2026-11-11T23:30:00.123Z` |
| `nivel` | `debug`, `info`, `aviso`, `erro` ou `critico` | `erro` |
| `evento` | Nome fixo do que aconteceu, em minúsculas com sublinhado | `pedido_falhou` |
| `msg` | Frase para uma pessoa ler | `Estoque insuficiente` |
| `servico` | Nome da parte que emitiu | `loja-api` |
| `versao` | Commit ou versão do código em execução | `a1b2c3d` |
| `ambiente` | `producao`, `homologacao`, `desenvolvimento`, `teste` | `producao` |
| `id_correlacao` | Um identificador por requisição ou execução | `9f1c…` |

O `evento` é o que se procura e se conta; não muda de texto. Detalhes variáveis vão em campos próprios, nunca dentro do nome.

## Correlação

- Cada requisição, mensagem ou execução recebe um `id_correlacao` ao entrar no sistema.
- Quem recebe um `id_correlacao` de outro serviço continua com ele. Em HTTP, use o cabeçalho `X-Correlation-Id`.
- Todos os eventos daquela requisição levam o mesmo valor. É isso que permite juntar a história de uma falha.

## Campos obrigatórios em erro

Todo evento com `nivel` `erro` ou `critico` leva também:

| Campo | Conteúdo |
|---|---|
| `entrada` | O que chegou: parâmetros, corpo da requisição, argumentos, linha do arquivo |
| `estado` | O que existia antes da operação e influenciou o resultado: identificadores, valores lidos, versão do registro, configuração relevante |
| `erro` | Objeto com `tipo`, `mensagem` e `pilha` |

Quando não há entrada ou estado, declare o campo vazio (`{}` ou `null`). A ausência do campo é erro de padrão.

## A regra da reprodução

Pergunta para cada caminho de erro: **com esta linha de log e o código da `versao` indicada, alguém consegue escrever um teste que falha do mesmo jeito?**

Para a resposta ser sim, registre também o que não é determinístico:

- hora usada na decisão, quando o código consulta o relógio;
- valor sorteado ou semente, quando há aleatoriedade;
- resposta recebida de serviço externo (ou seu resumo), quando ela decidiu o caminho.

## Níveis

| Nível | Quando |
|---|---|
| `debug` | Detalhe para desenvolvimento; desligado em produção |
| `info` | Fato normal do negócio: pedido criado, arquivo importado |
| `aviso` | Algo inesperado que o sistema contornou: nova tentativa, valor padrão usado |
| `erro` | A operação falhou; o sistema continua |
| `critico` | O sistema não consegue continuar ou há risco de perda de dado |

## Dados sensíveis

- Nunca vão para o log: senha, token, chave, cookie de sessão, cabeçalho `Authorization`.
- Vão mascarados: CPF, CNPJ, e-mail, telefone, cartão. Mantenha só o necessário para identificar (`***.***.***-25`).
- Prefira o identificador interno ao dado pessoal: `cliente_id: 42`, e não o nome.
- A máscara é aplicada antes de gravar, inclusive dentro de `entrada` e `estado`.

## O que registrar

- Entrada e saída de cada operação de negócio (um `info` no fim, com duração em `duracao_ms`).
- Toda decisão que muda o caminho: regra aplicada, tentativa repetida, valor padrão usado.
- Toda chamada a serviço externo: destino, duração, resultado.
- Todo erro, uma vez, no ponto em que é tratado. Evite registrar o mesmo erro em cada camada.

## Automação industrial

Evento originado em equipamento leva também:

| Campo | Conteúdo |
|---|---|
| `tag` | Endereço ou nome da variável |
| `valor` | Valor lido ou escrito |
| `qualidade` | Qualidade informada pela fonte (por exemplo, a do OPC UA) |
| `ts_fonte` | Horário informado pelo equipamento, em UTC |

`ts` continua sendo o horário de quem coletou. A diferença entre os dois é informação, não erro. Toda escrita em controlador é registrada com quem pediu e o valor anterior.

## Guarda

- Defina no desenho por quanto tempo o log fica guardado e onde.
- O log de erro precisa sobreviver ao reinício do serviço.

## Ferramentas do kit

A partir da pasta do plugin (`plugins/kit/hooks/`):

```
node validar-log.mjs caminho/do/arquivo.jsonl
node extrair-falha.mjs caminho/do/arquivo.jsonl                  # lista as correlações com erro
node extrair-falha.mjs caminho/do/arquivo.jsonl <id_correlacao>  # grava docs/projeto/falhas/<id>.md
```

- `validar-log` confere o padrão e serve em teste automático e em integração contínua.
- `extrair-falha` junta os eventos de uma correlação em um arquivo com linha do tempo, entrada, estado e erro.
- A skill `/kit:reproduzindo-falha` parte desse arquivo, escreve o teste que falha e só então corrige.

Implementação de referência em Python: `plugins/kit/modelos/log/python/kit_log.py`. Outras linguagens seguem este documento e são conferidas pelo `validar-log`.

## Teste

Cada caminho de erro tem um teste que provoca a falha e confere que o evento sai com `entrada`, `estado`, `erro` e `id_correlacao`.
