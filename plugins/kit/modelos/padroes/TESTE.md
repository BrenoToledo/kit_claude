# Padrão de teste: test.bat

Todo projeto tem um único comando de teste, igual em qualquer linguagem: `test.bat`, na raiz.

## test.config

Uma linha por comando, na ordem de execução. Linha começada por `#` é comentário.

```
python -m pytest -q
npm test --silent
```

## Comportamento

- Roda os comandos na ordem, a partir da raiz. Se existir `.venv`, ela é ativada antes.
- Para no primeiro comando que falha e termina com código 1.
- Termina com código 0 quando todos passam.

## Regras

- O `test.bat` não é editado; o que muda é o `test.config`.
- Os testes não dependem de serviço externo real nem de dado de produção.
- A suíte inteira roda em tempo curto o bastante para ser usada a cada tarefa. Teste lento fica em um comando separado, documentado no README.
- O mesmo `test.config` é usado na integração contínua (ver `CI-CD.md`): o que passa na máquina passa lá.
- Tarefa só fica pronta com `test.bat` passando (regras 4 e 7).

## Limite

Só Windows. Em Linux ou macOS, rode os comandos do `test.config` na ordem.
