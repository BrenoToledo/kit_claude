# Padrão de execução: run.bat

Todo projeto que tem algo para rodar traz, na raiz, um `run.bat` e um `run.config`. Quem chega ao projeto, pessoa ou IA, roda do mesmo jeito, qualquer que seja a linguagem.

O `run.bat` é igual em todos os projetos e não é editado. O que muda fica no `run.config`.

## run.config

Uma linha por serviço: `nome | porta | comando`.

```
api    | 8000 | python manage.py runserver 8000
front  | 5173 | npm run dev
coleta | -    | python coletor.py
```

- `nome`: letras, números, `-` e `_`.
- `porta`: a porta em que o serviço escuta, ou `-` se não escuta em nenhuma.
- `comando`: roda a partir da raiz do projeto. Se existir `.venv`, ela é ativada antes.
- Linha começada por `#` é comentário.

## Comandos

| Comando | Efeito |
|---|---|
| `run.bat` | Encerra as instâncias antigas do projeto e sobe todos os serviços |
| `run.bat start api` | O mesmo, só para um serviço |
| `run.bat stop` | Encerra todos; `run.bat stop api` encerra um |
| `run.bat restart api` | Encerra e sobe de novo |
| `run.bat status` | Mostra o que está rodando, com PID e situação da porta |
| `run.bat logs api` | Acompanha o log do serviço |

## Instâncias antigas

1. Ao subir um serviço, o `run.bat` grava o PID e a hora de início em `.run\<nome>.pid`.
2. Na próxima subida, ele encerra esse processo e os filhos, se ainda for o mesmo processo.
3. Se a porta estiver ocupada por um processo que não é deste projeto, o serviço **não** sobe: o `run.bat` mostra o PID e o nome do processo e termina com erro.
4. `--forcar` encerra também esse processo de fora: `run.bat start api --forcar`. Use sabendo o que está na porta.

## Arquivos gerados

- `.run\`: um `.pid` por serviço.
- `logs\<nome>.log`: a saída do serviço, com uma linha `==== inicio ... ====` a cada subida.

Os dois ficam fora do git (`.gitignore`).

## Resultado

O `run.bat` termina com código 0 quando tudo subiu e 1 quando algum serviço falhou. Em falha logo na partida, ele mostra as últimas linhas do log.

## Limites

- Só Windows (usa PowerShell, que já vem no sistema).
- Projeto sem nada para rodar, como um programa de CLP, não precisa de `run.bat`.
- O `run.bat` sobe o projeto para desenvolvimento. Não substitui serviço do Windows, Docker ou outro meio de produção.
