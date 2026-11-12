# Padrão de configuração: .env.example

Toda configuração que muda entre ambientes vem de variável de ambiente. Nenhum segredo fica em arquivo versionado.

## Arquivos

| Arquivo | Vai para o git | Conteúdo |
|---|---|---|
| `.env.example` | Sim | Todas as variáveis que o projeto lê, sem valor real |
| `.env` | Não | Os valores da máquina de quem desenvolve |

## .env.example

Uma variável por linha, com comentário dizendo para que serve e se é obrigatória.

```
# Endereço do banco. Obrigatória.
DATABASE_URL=
# Nível mínimo de log: debug, info, aviso, erro. Padrão: info.
LOG_NIVEL=info
# Chave de assinatura das sessões. Obrigatória. Gere uma por ambiente.
SECRET_KEY=
```

## Regras

- Variável nova no código entra no `.env.example` na mesma tarefa.
- Valor padrão só para o que não é segredo.
- O programa confere as variáveis obrigatórias ao iniciar e para com mensagem clara quando falta alguma, dizendo qual.
- `.env` está no `.gitignore`. O kit bloqueia a escrita de `.env` pelo agente e o `git add` desse arquivo.
- Segredo de produção fica no cofre do ambiente (variáveis do serviço, do contêiner ou do provedor), nunca em arquivo no servidor de código.
- Configuração nunca é lida de caminho fixo da máquina de alguém.
