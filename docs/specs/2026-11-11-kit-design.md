# Especificação: kit de otimização do Claude Code

Data: 2026-11-11. Repositório: `BrenoToledo/kit_claude`. Estado: aguardando aprovação da Entrega 1.

## Objetivo

Fazer o Claude Code render mais com modelos menores e gastar menos do limite semanal, em três tipos de uso: projetos de software (Django/API), automação industrial e rotinas de casa.

O problema principal é o levantamento de requisitos: o Claude não faz as perguntas certas e trata "uma API" como se só existisse um tipo. A economia de tokens é o segundo objetivo.

## Critérios de sucesso

1. Pedido de projeto novo sempre passa por classificação de arquétipo e checklist de perguntas antes de qualquer código.
2. Toda API sai no mesmo padrão (modelo, autenticação, erros, versão) escolhido por tabela de decisão.
3. Toda entrega passa por verificação de segurança.
4. Cada fase começa em conversa nova lendo um único arquivo de handoff.
5. Instalação em uma máquina nova: dois comandos e um `/kit:setup`.

## Metodologia (o centro do kit)

O kit padroniza o método, não a tecnologia. As regras valem para qualquer linguagem e qualquer agente.

### As nove regras

1. **Requisito antes de tudo.** Nenhum código sem `REQUISITOS.md` aprovado pelo Breno.
2. **Contrato antes de implementação.** Toda fronteira entre partes (módulo, API, tela e back, CLP e banco) tem um arquivo de contrato: o que entra, o que sai, erros e um exemplo. Implementação só começa com o contrato escrito.
3. **Série por padrão.** As tarefas rodam uma após a outra. Duas tarefas só rodam em paralelo se toda ligação entre elas passa por um contrato já congelado. Sem contrato, é série.
4. **Teste primeiro.** O teste nasce do contrato, falha, e só então vem o código. Tarefa sem teste que falhou e depois passou não está pronta.
5. **O mais simples que atende.** Antes de escrever: já existe no projeto? a biblioteca padrão resolve? uma dependência já instalada resolve? Só então código novo, o mínimo.
6. **Tarefa pequena, em arquivo próprio.** Uma tarefa, um arquivo, um critério de pronto verificável.
7. **Verificar antes de dizer pronto.** Segurança e revisão contra o desenho; resultado gravado.
8. **Tela aprovada antes de tela codada.** Todo trabalho visual começa por um simulado (protótipo no Figma, página estática ou imagem) aprovado pelo Breno. Sem simulado aprovado, nenhuma tarefa de interface começa.
9. **Reaproveitar antes de criar, e criar para reaproveitar.** Antes de fazer uma peça, consultar a biblioteca. Peça nova que serve a mais de um lugar (botão, campo, tabela, cliente de API, função utilitária) nasce isolada, sem depender do projeto, e é proposta para a biblioteca.

### Simulado visual

- Feito na etapa de desenho, depois dos requisitos e antes do plano.
- Formato, em ordem de preferência: protótipo no Figma (quando o conector está disponível); página HTML estática sem lógica; imagem.
- Fica em `docs/projeto/telas/`, com a lista dos componentes que a tela usa, marcando quais já existem na biblioteca e quais são novos.
- A aprovação é registrada em `ESTADO.md`; o hook de interface confere esse registro.

### Biblioteca de componentes

Um repositório separado no GitHub, do Breno, com o que já foi feito e pode ser usado de novo.

```
biblioteca/
  CATALOGO.md              uma linha por componente: nome, para que serve, onde está
  componentes/<nome>/
    LEIAME.md              uso, parâmetros, exemplo
    código + teste
```

- **Consulta:** desenho e plano leem só o `CATALOGO.md`; o componente inteiro é aberto apenas pela tarefa que vai usá-lo.
- **Publicação:** ao terminar uma tarefa que criou peça reutilizável, a skill `publicando-componente` isola a peça, escreve o `LEIAME.md`, confere que não há dado ou nome de cliente e abre um pedido de inclusão (pull request). O Breno aprova; nada sobe sozinho.
- **Origem do código:** peça criada em projeto de empregador ou cliente só vai para a biblioteca pessoal se o Breno confirmar que pode. A skill pergunta sempre que o projeto de origem não é pessoal.

### Estado do projeto em Markdown

Tudo que orienta o trabalho fica em arquivos no repositório do projeto, legíveis por qualquer IA ou pessoa.

```
docs/projeto/
  ESTADO.md            fase atual, última ação, próxima ação. Único arquivo lido ao começar.
  REQUISITOS.md
  DESENHO.md
  contratos/<nome>.md  entradas, saídas, erros, exemplo, status (rascunho | congelado)
  PLANO.md             tarefas em ordem, dependências, grupos que podem paralelizar
  tarefas/NNN-nome.md  objetivo, contratos que usa, depende_de, critério de pronto,
                       status (pendente | em andamento | pronta), responsável
  telas/               simulados aprovados e lista de componentes por tela
  DECISOES.md          decisões e o motivo, uma linha cada
```

### Carga progressiva de contexto

Cada etapa lê só o que precisa:

| Etapa | Lê |
|---|---|
| Início de qualquer sessão | `ESTADO.md` |
| Desenho | `REQUISITOS.md` |
| Plano | `DESENHO.md` + contratos |
| Execução de uma tarefa | o arquivo da tarefa + os contratos que ela cita |
| Revisão | diff + contratos + `DESENHO.md` |

Quem executa uma tarefa não lê requisitos nem outras tarefas. É isso que mantém o contexto pequeno e permite modelo menor.

### Trabalho em paralelo por várias IAs

- Uma IA assume a tarefa escrevendo seu nome em `responsável`, mudando o status e fazendo commit. O commit é a trava.
- Só pega tarefa cujo `depende_de` está todo pronto e cujos contratos estão congelados.
- Mudança em contrato congelado não é feita pela tarefa: volta para o desenho, e as tarefas que usam aquele contrato são reabertas.
- Ao terminar, atualiza a tarefa e `ESTADO.md`.

### Claude como orquestrador de outras IAs

Papéis: o Claude cuida de requisitos, desenho, contratos, plano e revisão. Tarefas bem delimitadas podem ir para um executor mais barato, como o Antigravity (`agy`), tratado como um júnior.

- **Quem pode ser delegada:** tarefa com contrato congelado, critério de pronto verificável por teste e sem decisão de desenho em aberto. O plano marca o campo `executor` de cada tarefa (`claude`, `claude-menor` ou `agy`).
- **Como:** o Claude Code chama o Antigravity em modo não interativo (`agy -p`), passando só o caminho do arquivo da tarefa. O executor lê a tarefa, os contratos citados e o `AGENTS.md`.
- **Isolamento:** cada tarefa delegada roda em um ramo ou worktree próprio do git, nunca direto no ramo principal.
- **Conferência obrigatória:** ao voltar, o Claude roda os testes, compara o diff com o contrato e a regra 5, e só então marca a tarefa como pronta. Reprovou: devolve com o motivo, no máximo duas vezes; na terceira, o Claude assume a tarefa.
- **Limites conhecidos:** o modo não interativo do `agy` decide permissões por política, sem perguntar; há relato de saída vazia quando chamado por script. O `/kit:setup` testa a chamada antes de habilitar a delegação. Não validado ainda na máquina do Breno.

### Como a regra é garantida

- **Claude Code:** hooks bloqueiam (código sem requisito; implementação sem contrato citado na tarefa; interface sem simulado aprovado; fim de tarefa sem arquivo de teste alterado; fim de tarefa sem verificação).
- **Outros agentes:** um `AGENTS.md` na raiz com as nove regras e o mapa de arquivos. Nesses a regra é instrução, sem bloqueio; a revisão final pega os desvios.

### Regra 10 e padrão de log (acrescentados em 2026-11-11)

10. **Toda falha deixa log suficiente para ser reproduzida.**

- Padrão único em `docs/padroes/LOG.md`: uma linha JSON por evento; campos obrigatórios `ts`, `nivel`, `evento`, `msg`, `servico`, `versao`, `ambiente`, `id_correlacao`; em erro, também `entrada`, `estado` e `erro`.
- Ferramentas independentes de linguagem: `validar-log.mjs` e `extrair-falha.mjs`.
- Skill `reproduzindo-falha`: do log ao teste que falha, depois a correção.
- Contrato ganha a seção `Logs`; `revisando` confere o registro de erro; `verificando-seguranca` confere dado sensível.
- Referência em Python (`kit_log.py`), só com a biblioteca padrão.
- Limite: o padrão garante a informação, não a reprodução automática; falha que depende de serviço externo ou de concorrência pode exigir mais do que o log.

## Distribuição

Um repositório no GitHub que é ao mesmo tempo marketplace e plugin do Claude Code.

```
/plugin marketplace add BrenoToledo/kit_claude
/plugin install kit@kit-claude
/kit:setup
```

Plugin, e não skills soltas, porque só o plugin carrega skills, hooks e comandos juntos e atualiza com um comando.

## Estrutura do repositório

```
.claude-plugin/marketplace.json
plugins/kit/
  .claude-plugin/plugin.json
  hooks/hooks.json
  hooks/scripts/           checagem de ambiente, bloqueio sem requisitos, bloqueio de segredos
  skills/
    setup/                 autoverificação e instalação
    levantando-requisitos/
      SKILL.md
      arquetipos/          um arquivo de perguntas por arquétipo
    desenhando-solucao/
      padroes/api.md       tabela de decisão de API
    planejando/
    executando/
    verificando-seguranca/
      checklist-api.md     baseado no OWASP API Security Top 10
    revisando/
    handoff/
    rapido/                caminho curto
  modelos/CLAUDE.md        modelo de CLAUDE.md global (menos de 100 linhas)
pacotes/
  django-api/              arquétipos, padrões e hooks de Django/DRF
  automacao/               arquétipos de CLP, OPC UA, supervisório; regras de segurança OT
  rotinas-casa/            modelo para transformar rotina repetida em skill fixa
docs/specs/
```

## Componente 1: autoverificação (`/kit:setup`)

Roda em duas etapas, sempre nessa ordem.

**Diagnóstico (só leitura).** Verifica e mostra em uma tabela:

- CLAUDE.md global e do projeto: existe, tamanho, regras duplicadas.
- Skills e plugins instalados; conflitos com o kit (dois plugins que mandam no início da sessão, por exemplo superpowers).
- Ferramentas de economia: headroom, caveman, ponytail, rtk.
- Hooks já configurados em `settings.json`.
- Tipo do projeto atual (Django, automação, nenhum) para sugerir o pacote.

**Correção (com confirmação).** Para cada item faltando, propõe a ação e executa só depois do "sim":

- Cria ou enxuga o CLAUDE.md a partir do modelo, preservando o que é específico do Breno.
- Ativa o pacote de domínio no projeto.
- Mostra o comando de instalação de ferramentas de terceiros. Não instala sozinho: são programas de outras pessoas rodando na máquina.
- Quando há conflito com outro plugin de processo, pergunta qual conduz.

Grava o resultado em `.claude/kit-estado.json`. Um hook de início de sessão lê esse arquivo (barato, sem modelo) e só avisa se o setup nunca rodou ou se algo mudou.

## Componente 2: cadeia de skills

Cada skill faz uma coisa, grava um arquivo e termina com a linha "Próxima etapa: `<skill>`, em conversa nova, lendo `<arquivo>`".

| Skill | Lê | Grava | Modelo sugerido |
|---|---|---|---|
| levantando-requisitos | pedido do usuário | `REQUISITOS.md` | forte |
| desenhando-solucao | `REQUISITOS.md` | `DESENHO.md` + `contratos/` | forte |
| planejando | `DESENHO.md` + contratos | `PLANO.md` + `tarefas/` | médio |
| executando | uma tarefa + contratos citados | teste, código, status da tarefa | menor, em subagente |
| verificando-seguranca | diff + `REQUISITOS.md` | `SEGURANCA.md` | médio |
| revisando | diff + `DESENHO.md` | achados | médio |
| handoff | estado atual | `ESTADO.md` | menor |

### levantando-requisitos

1. Classifica o pedido em um arquétipo. Em dúvida entre dois, pergunta.
2. Carrega só o arquivo de perguntas daquele arquétipo.
3. Pergunta uma coisa por vez, pulando o que já foi respondido.
4. Faz as três perguntas fixas de segurança: quem acessa, que dado é sensível, onde fica exposto.
5. Escolhe a ordem de construção por regra:
   - contrato primeiro, quando front e back são separados;
   - design primeiro, quando a tela é o produto;
   - back primeiro, quando é pipeline de dados sem tela.
6. Grava `REQUISITOS.md`: arquétipo, respostas, perfil de segurança, ordem, fora de escopo.

Arquétipos iniciais do núcleo: CRUD interno com painel; API pública para terceiros; ingestão de dados; backend para um front; webhooks; script ou automação pontual.

### Padrão de API (em desenhando-solucao)

| Quem consome | Modelo | Autenticação |
|---|---|---|
| Front próprio | REST + contrato OpenAPI | sessão ou JWT |
| Terceiros | REST versionado, documentação pública | API key ou OAuth2 |
| Máquina ou CLP | endpoint de ingestão | token de serviço + lista de IPs |
| Sistema externo avisando | webhook | assinatura da mensagem |

Fixo em todas: versão na URL, paginação, formato único de erro, limite de requisições, segredos em variável de ambiente.

## Componente 3: hooks

| Evento | Ação |
|---|---|
| Início de sessão | lê `kit-estado.json`; avisa se o setup está pendente |
| Antes de escrever código | bloqueia se não existe `REQUISITOS.md` e o modo rápido não está ativo |
| Antes de commit | bloqueia `.env`, chaves e senhas |
| Fim de tarefa | lembra de `verificando-seguranca` se há diff não verificado |

O bloqueio vale só para arquivos de código; documentação e configuração passam.

Os bloqueios de requisito e de simulado só atuam em projeto onde o `/kit:setup` já rodou (existe `.claude/kit-estado.json` com `ativo: true`). Fora disso o kit apenas sugere o setup no início da sessão. O bloqueio de segredos vale em qualquer projeto. Os scripts dos hooks são em Node.js, sem dependências, porque a máquina principal é Windows.

## Caminho rápido

`/kit:rapido` desliga o bloqueio de requisito e de simulado por 4 horas no projeto, para ajustes pequenos. Continua valendo o hook de segredos.

## Pacotes de domínio

- **django-api:** arquétipos e padrão acima aplicados a Django/DRF; hook de testes e de migrations pendentes.
- **automacao:** arquétipos (coleta OPC UA, tela de supervisório, alteração de lógica, envio para banco). Verificação por checklist e revisão humana, porque não há teste automático em CLP. Regras fixas: controlador nunca exposto à internet, OPC UA só leitura por padrão, escrita em controlador só com confirmação.
- **rotinas-casa:** sem cadeia. Uma skill geradora transforma uma rotina repetida em skill fixa com passos definidos, para rodar em modelo menor.

## Componente opcional: privacidade (máscara de dados)

Objetivo: dados sensíveis (IPs, hostnames, domínios internos, CPF, CNPJ, nomes, e-mails) não saem da máquina em texto claro; o Breno continua vendo os valores reais.

Mecanismo: proxy local de terceiros entre o Claude Code e a API, que troca o dado por marcador estável na ida e restaura na volta. O kit não implementa o proxy; escolhe um, configura e verifica.

- **Escopo:** só Claude Code no terminal (`ANTHROPIC_BASE_URL`). Não cobre o app do celular nem o claude.ai.
- **Regras próprias do kit** em `pacotes/*/privacidade/`: CPF e CNPJ (com dígito verificador), faixas de IP privadas, hostnames e domínios internos listados pelo Breno em arquivo local fora do repositório.
- **IPs preservam estrutura:** a troca é consistente por sub-rede (mesmo prefixo real vira mesmo prefixo falso), para o modelo continuar raciocinando sobre rede.
- **Hook de garantia:** antes de enviar o prompt, um script local procura os padrões sensíveis; se o proxy não está ativo e há padrão, bloqueia e avisa.
- **`/kit:setup`:** mostra se o proxy está ativo, em que porta, e se convive com o headroom (encadeamento a testar).
- **Ferramenta escolhida: pii-airlock** (teste de 2026-11-11, versão 0.8.0, modo linha de comando, texto de exemplo em português).
  - Sem configuração: mascarou IPs, nome e e-mail; deixou passar CPF, CNPJ, telefone brasileiro e hostname.
  - Com quatro regras `custom_patterns` (CPF, CNPJ, telefone, hostname) e `deny_list`: mascarou tudo; ida e volta idêntica ao original.
  - Precisa de `languages: [pt]` e do modelo `pt_core_news_lg`; o padrão é inglês e francês.
  - Falso positivo observado: a palavra "CPF" foi marcada como nome de pessoa. Inofensivo, mas gera ruído.
  - Faz uma consulta de rede a publicsuffix.org (lista pública de domínios) ao rodar; não envia o texto.
  - **Não preserva sub-rede:** cada IP vira marcador independente, ou IP falso na mesma faixa 203.0.113.x para todos.
  - Não testado ainda: modo proxy com o Claude Code real e convivência com o headroom.
- **Alternativa avaliada: LLM-anonymization.** Já traz regex de CPF e CNPJ, mas depende de um modelo local via Ollama para a camada contextual e também gera IP aleatório. Só leitura de código, não executado.
- **Pendência:** mapeamento de IP que preserva sub-rede não existe em nenhuma das duas. Primeira versão usa marcadores estáveis; mapeador próprio entra depois, se a perda de contexto de rede atrapalhar na prática.

## Economia de tokens

Em ordem de impacto esperado: conversa nova por fase; modelo menor na execução; carga sob demanda dos checklists; headroom na saída de ferramentas; regra curta de resposta enxuta. O kit não promete percentual; `/kit:setup` mostra como medir com as estatísticas do headroom.

## Fora de escopo nesta versão

- Reescrever superpowers, headroom, caveman ou ponytail. O kit detecta e convive.
- Hooks e plugin para outros agentes (Codex, Cursor). Eles seguem os mesmos arquivos Markdown e o `AGENTS.md`, sem bloqueio automático.
- Integração com Figma na etapa de design; fica como pergunta no levantamento.

## Testes

- Cada script de hook: teste de linha de comando com entrada simulada (bloqueia e libera nos casos certos).
- Cada skill: um cenário sem a skill e o mesmo com a skill, em subagente de modelo menor, comparando se as perguntas certas aparecem.
- Setup: rodar em pasta vazia, em projeto Django e em pasta com CLAUDE.md grande.

## Divisão em entregas

### Entrega 1: o método funcionando

Resultado: em um projeto novo, o Claude Code conduz do pedido até o plano seguindo as nove regras, com bloqueio.

1. Esqueleto do plugin e do marketplace.
2. `AGENTS.md` com as nove regras e modelos dos arquivos de `docs/projeto/`.
3. `/kit:setup`: diagnóstico e correção do CLAUDE.md, skills, plugins e hooks. Sem privacidade e sem delegação.
4. `levantando-requisitos` com os arquétipos de API e as três perguntas de segurança.
5. `desenhando-solucao`: contratos, tabela de decisão de API e simulado visual.
6. `planejando`: tarefas em arquivo, dependências, grupos paralelizáveis.
7. Hooks: aviso de início de sessão, bloqueio sem requisito, bloqueio de interface sem simulado, bloqueio de segredos.
8. `/kit:rapido`.

Pronto quando: os testes dos hooks passam e um pedido de exemplo ("quero uma API de pedidos") gera `REQUISITOS.md`, `DESENHO.md`, contratos e tarefas sem intervenção além das respostas às perguntas.

### Entrega 2: execução, verificação e extensões

Cada item abaixo recebe sua própria revisão antes de ser construído.

1. `executando` (teste primeiro), `verificando-seguranca`, `revisando`, `handoff`. **Feito em 2026-11-11.** A tarefa passa por `em-andamento` → `em-revisao` → `pronta`; um hook bloqueia `pronta` sem teste alterado desde o início da tarefa ou sem `seguranca: ok`.
2. Pacote `django-api`.
3. Biblioteca de componentes e `publicando-componente`.
4. Orquestração do Antigravity.
5. Privacidade (pii-airlock com regras brasileiras).
6. Pacotes `automacao` e `rotinas-casa`.
7. Candidato a validar antes de adotar: TypeSafe (classificador por API) como peça opcional.
   - Usos possíveis: escolher o executor de cada tarefa (`claude`, `claude-menor`, `agy`) e revisão semântica das nove regras e dos contratos na etapa `revisando` ou em CI.
   - Fora de questão: uso em hooks (hook não usa rede), detecção de dado sensível (o dado sairia da máquina) e classificação de arquétipo (a skill já faz).
   - Antes de adotar: medir latência e acerto em tarefas reais, conhecer o preço e a política de retenção de dados. A documentação consultada em 2026-11-11 não informa preço nem retenção.
