# Padrão de API

## Escolha do modelo

A resposta a "quem consome?" nos requisitos decide a linha.

| Quem consome | Modelo | Autenticação |
|---|---|---|
| Front próprio | REST com contrato OpenAPI | sessão ou JWT |
| Terceiros | REST versionado, documentação pública | API key ou OAuth2 |
| Máquina ou CLP | endpoint de ingestão simples | token de serviço e lista de IPs |
| Sistema externo avisando | webhook | assinatura da mensagem |

Mais de um consumidor: uma linha para cada, com endpoints separados.

## Fixo em toda API

- Versão na URL: `/v1/...`.
- Listas com paginação: parâmetros `pagina` e `tamanho`; resposta com `total`.
- Formato único de erro (abaixo).
- Limite de requisições por cliente.
- Segredos em variável de ambiente.
- Entrada validada na borda; o que não está no contrato é recusado.

## Formato de erro

```json
{"erro": {"codigo": "pedido_nao_encontrado", "mensagem": "Pedido 123 não existe.", "detalhes": {}}}
```

- `codigo`: texto fixo, em minúsculas com sublinhado; é o que o cliente trata.
- `mensagem`: para uma pessoa ler.
- `detalhes`: opcional; por exemplo, os campos inválidos.

Status HTTP: 400 entrada inválida, 401 sem identificação, 403 sem permissão, 404 não encontrado, 409 conflito, 422 regra de negócio, 429 limite, 500 erro interno.
