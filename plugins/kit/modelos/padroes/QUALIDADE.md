# Padrão de qualidade: lint, formatação e análise estática

Vale para qualquer linguagem. O projeto escolhe as ferramentas; as regras abaixo não mudam.

## Três camadas

| Camada | O que faz | Exemplos de ferramenta |
|---|---|---|
| Formatação | Deixa o código com uma aparência só, sem discussão | Black, Prettier, gofmt |
| Lint | Aponta erro provável e má prática | Ruff, ESLint, golangci-lint |
| Análise estática | Mede dívida técnica, duplicação, cobertura e falhas de segurança | SonarQube, SonarCloud |

## Regras

1. **Configuração no repositório.** As regras de formatação e de lint ficam em arquivo versionado. Ninguém depende da configuração do editor de outra pessoa.
2. **Um comando.** Formatação e lint entram no `test.config`, antes dos testes. Código fora do padrão quebra o `test.bat`.
3. **Zero aviso novo.** Código novo não acrescenta aviso de lint. Exceção é pontual, na linha, com o motivo escrito ao lado.
4. **Formatação automática, não manual.** Quem formata é a ferramenta. Revisão não discute estilo.
5. **Regra desligada tem motivo registrado** em `docs/projeto/DECISOES.md`.

## Análise estática com SonarQube

Use quando o projeto vai durar, tem mais de uma pessoa ou IA mexendo, ou tem exigência de auditoria.

- Arquivo `sonar-project.properties` na raiz, com a chave do projeto, as pastas de código e de teste e o caminho do relatório de cobertura.
- A análise roda na integração contínua, não na máquina de quem desenvolve.
- O portão de qualidade (quality gate) vale para **código novo**: sem falha de segurança nova, sem defeito novo de severidade alta, cobertura do código novo acima do mínimo combinado, duplicação nova abaixo do limite.
- Portão reprovado impede a publicação.
- O token do SonarQube é segredo: fica nas variáveis da integração contínua.

Projeto pequeno ou descartável pode ficar só com formatação e lint. A decisão é registrada nos requisitos.

## Na revisão

A skill `revisando` confere: `test.bat` passou com lint incluído; nenhuma regra foi desligada sem registro; se há SonarQube, o portão passou.
