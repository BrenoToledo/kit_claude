# Método de trabalho deste projeto

Este projeto segue um método fixo. Vale para qualquer pessoa ou IA que trabalhe aqui, em qualquer linguagem.

## As nove regras

1. **Requisito antes de tudo.** Nenhum código sem `docs/projeto/REQUISITOS.md` aprovado pelo dono do projeto.
2. **Contrato antes de implementação.** Toda fronteira entre partes (módulo, API, tela e back, equipamento e banco) tem um arquivo de contrato: o que entra, o que sai, erros e um exemplo. Implementação só começa com o contrato escrito.
3. **Série por padrão.** As tarefas rodam uma após a outra. Duas tarefas só rodam em paralelo se toda ligação entre elas passa por um contrato já congelado.
4. **Teste primeiro.** O teste nasce do contrato, falha, e só então vem o código. Tarefa sem teste que falhou e depois passou não está pronta.
5. **O mais simples que atende.** Antes de escrever: já existe no projeto? A biblioteca padrão resolve? Uma dependência já instalada resolve? Só então código novo, o mínimo.
6. **Tarefa pequena, em arquivo próprio.** Uma tarefa, um arquivo, um critério de pronto verificável.
7. **Verificar antes de dizer pronto.** Segurança e revisão contra o desenho; resultado gravado.
8. **Tela aprovada antes de tela codada.** Todo trabalho visual começa por um simulado aprovado pelo dono do projeto.
9. **Reaproveitar antes de criar, e criar para reaproveitar.** Peça que serve a mais de um lugar nasce isolada, sem depender do projeto.

## Onde fica cada coisa

```
docs/projeto/
  ESTADO.md            fase atual, última ação, próxima ação
  REQUISITOS.md
  DESENHO.md
  contratos/<nome>.md  status: rascunho | congelado
  telas/               simulados aprovados
  PLANO.md             tarefas em ordem, dependências, grupos paralelos
  tarefas/NNN-nome.md  status, responsável, contratos que usa, segurança
  DECISOES.md          decisões e motivo
```

## O que ler em cada etapa

Leia só o que a etapa pede. Contexto pequeno é parte do método.

| Etapa | Leia |
|---|---|
| Início de qualquer sessão | `ESTADO.md` |
| Desenho | `REQUISITOS.md` |
| Plano | `DESENHO.md` e os contratos |
| Execução de uma tarefa | o arquivo da tarefa e os contratos que ela cita |
| Revisão | o diff, os contratos e `DESENHO.md` |

## Trabalho em paralelo

- Para assumir uma tarefa: escreva seu nome em `responsavel`, mude `status` para `em-andamento` e faça commit. O commit é a trava.
- Só assuma tarefa cujo `depende_de` está todo `pronta` e cujos contratos estão `congelado`.
- Não altere contrato congelado dentro de uma tarefa. Registre a necessidade em `ESTADO.md` e pare: a mudança volta para o desenho.
- Ao terminar a implementação: `status: em-revisao` e commit. A tarefa só vira `pronta` depois da verificação de segurança (`seguranca: ok`) e da revisão contra o contrato.
- Ao marcar `pronta`: atualize `ESTADO.md` e faça commit.

## Segredos

Senha, token e chave ficam em variável de ambiente, nunca em arquivo versionado.
