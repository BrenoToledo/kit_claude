---
name: levantando-requisitos
description: Use quando o usuário pede um sistema, API, tela, automação ou funcionalidade nova, antes de qualquer desenho ou código, ou quando um bloqueio do kit pedir requisitos.
---

# Levantando requisitos

Entender o que o usuário precisa antes de pensar em solução. O resultado é `docs/projeto/REQUISITOS.md` aprovado por ele.

Nesta etapa só se pergunta e se registra. Tecnologia, arquitetura e código pertencem às etapas seguintes.

## Passos

1. **Leia `docs/projeto/ESTADO.md`.** Se `requisitos: aprovado`, pergunte se é revisão dos requisitos atuais ou um projeto novo.

2. **Classifique o pedido em um arquétipo.** Diga qual escolheu e por quê, em uma linha. Em dúvida entre dois, pergunte ao usuário.

   | Arquétipo | Sinais no pedido | Arquivo |
   |---|---|---|
   | CRUD interno | cadastro, painel, gestão, uso pela própria equipe | `arquetipos/crud-interno.md` |
   | API pública | terceiros integram, parceiros, clientes consomem | `arquetipos/api-publica.md` |
   | Ingestão de dados | coleta, sensores, CLP, importação recorrente, relatório a partir de dados | `arquetipos/ingestao-dados.md` |
   | Backend para um front | app, site ou tela específica que precisa de dados | `arquetipos/backend-para-front.md` |
   | Webhooks | outro sistema avisa, eventos, notificações recebidas | `arquetipos/webhooks.md` |
   | Script pontual | converter, migrar, processar uma vez, automatizar uma tarefa | `arquetipos/script-pontual.md` |

3. **Abra só o arquivo do arquétipo escolhido** e faça as perguntas dele. Uma pergunta por mensagem. Pule o que o usuário já respondeu. Ofereça opções quando houver poucas respostas possíveis.

4. **Faça as três perguntas de segurança**, se ainda não respondidas:
   - Quem acessa?
   - Que dado é sensível?
   - Onde fica exposto: internet, rede interna ou rede de automação?

5. **Faça as perguntas de qualidade e entrega** de `perguntas-qualidade.md`: lint, análise estática, contêiner, CI/CD e ambientes.

6. **Pergunte se há tela.** Sem tela, o simulado não se aplica.

7. **Escolha a ordem de construção** e diga o motivo em uma linha:
   - contrato primeiro, quando front e back são partes separadas;
   - design primeiro, quando a tela é o produto;
   - back primeiro, quando é fluxo de dados sem tela.

8. **Grave `docs/projeto/REQUISITOS.md`** com todas as seções do modelo, incluindo o que ficou fora de escopo. Mostre um resumo curto e peça aprovação explícita.

9. **Com o sim do usuário**, atualize `ESTADO.md`: `requisitos: aprovado`, `fase: desenho`, `simulado: nao-se-aplica` se não há tela, `proxima: rode /kit:desenhando-solucao`. Registre a data em `Aprovação`. Sem o sim, o estado continua `pendente` e você ajusta o que ele pedir.

## Sinais de que a etapa saiu do trilho

- Você sugeriu framework, banco ou biblioteca.
- Você fez duas perguntas na mesma mensagem.
- Você gravou `aprovado` com um "ok" dado a outra coisa.

Em qualquer um desses casos, volte ao passo em que estava.

Próxima etapa: desenhando-solucao, em conversa nova, lendo docs/projeto/REQUISITOS.md.
