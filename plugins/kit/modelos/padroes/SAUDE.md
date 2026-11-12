# Padrão de verificação de saúde

Todo serviço que fica rodando expõe uma forma padrão de responder "estou funcionando?".

## Serviço HTTP

`GET /saude`, sem autenticação, respondendo em menos de um segundo.

```json
{"situacao": "ok", "versao": "a1b2c3d", "dependencias": {"banco": "ok", "fila": "ok"}}
```

- `situacao`: `ok` ou `falha`.
- `versao`: o mesmo valor do campo `versao` do log.
- `dependencias`: uma entrada por dependência essencial, com `ok` ou `falha`.
- Status HTTP 200 quando tudo está `ok`; 503 quando algo essencial falha.

## Regras

- A resposta não traz dado sensível, endereço interno nem mensagem de erro detalhada.
- A verificação é leve: uma consulta simples a cada dependência, com tempo limite curto.
- Dependência opcional fora do ar não derruba a `situacao`; aparece em `dependencias` como `falha`.
- Falha na verificação gera evento de log `saude_falhou`, no padrão de `LOG.md`.

## Serviço sem HTTP

Coletor, agendador ou processo em lote grava um arquivo de batimento, `.run/<nome>.saude`, com a data e hora UTC da última volta concluída. Quem monitora considera falha quando o arquivo fica mais velho que o intervalo esperado.

## Uso

- O contêiner usa essa verificação como teste de saúde (ver `CONTAINER.md`).
- A integração contínua pode subir o serviço e consultar `/saude` antes de publicar.
