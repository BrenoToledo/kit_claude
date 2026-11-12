# Padrão de contêiner

Vale quando os requisitos pedem contêiner. Independe de linguagem.

## Quando usar

- O serviço roda em servidor, nuvem ou em mais de uma máquina.
- O ambiente precisa ser reproduzido igual em desenvolvimento, teste e produção.

Script pontual, ferramenta de linha de comando e programa de CLP não precisam.

## Arquivos

| Arquivo | Para quê |
|---|---|
| `Dockerfile` | Como construir a imagem do serviço |
| `.dockerignore` | O que não entra na imagem: `.git`, `.env`, `logs/`, `.run/`, dependências locais |
| `compose.yaml` | Sobe o serviço com as dependências (banco, fila) para desenvolvimento |

## Regras da imagem

1. **Imagem base fixada por versão.** Nada de `latest`.
2. **Construção em etapas** quando há compilação: uma etapa constrói, a final leva só o necessário para rodar.
3. **Usuário sem privilégio.** O processo não roda como root.
4. **Um processo por contêiner.**
5. **Dependências antes do código** no `Dockerfile`, para aproveitar o cache.
6. **Sem segredo na imagem.** Nem em instrução, nem em arquivo copiado. Configuração entra por variável de ambiente (ver `CONFIG.md`).
7. **Log na saída padrão,** no formato de `LOG.md`. O contêiner não grava log em arquivo interno.
8. **Verificação de saúde declarada,** usando o padrão de `SAUDE.md`.
9. **Encerramento limpo:** o processo trata o sinal de parada e termina o que está fazendo.
10. **Dado que precisa durar fica em volume,** nunca dentro do contêiner.

## Versão da imagem

A imagem é marcada com o commit ou com a versão do projeto, o mesmo valor do campo `versao` do log. Assim um erro no log aponta exatamente a imagem que rodava.

## Rede industrial

Contêiner com acesso à rede de automação fica em rede separada, só com as portas necessárias, e não é publicado para a internet.

## Na integração contínua

A imagem é construída e analisada por ferramenta de varredura de vulnerabilidades antes de ser publicada (ver `CI-CD.md`).
