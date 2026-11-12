# Padrão de integração e entrega contínuas (CI/CD)

Vale para qualquer linguagem e qualquer serviço de CI (GitHub Actions, GitLab CI, Azure DevOps).

## Integração contínua (CI)

Roda a cada envio e a cada pedido de mesclagem (pull request). Etapas, nesta ordem; a primeira que falha interrompe:

1. **Instalar dependências** com versões travadas (arquivo de trava no repositório).
2. **Formatação e lint** (ver `QUALIDADE.md`).
3. **Testes:** os comandos do `test.config`, na ordem. É a mesma lista que o `test.bat` roda na máquina.
4. **Validação de log,** quando os testes geram arquivo de log: `validar-log.mjs`.
5. **Análise estática,** quando o projeto usa SonarQube: portão de qualidade sobre o código novo.
6. **Segurança:** varredura de dependências vulneráveis e de segredos no código.
7. **Construção** do pacote ou da imagem (ver `CONTAINER.md`), marcada com o commit.

## Regras

- O ramo principal só recebe código por pedido de mesclagem com a CI verde.
- A CI usa só o que está no repositório. Nada depende da máquina de alguém.
- Segredos ficam nas variáveis protegidas do serviço de CI, nunca no arquivo do fluxo.
- CI quebrada é prioridade: conserta-se antes de continuar.
- A CI roda em poucos minutos. Etapa lenta roda em paralelo ou em agenda própria.

## Entrega contínua (CD)

Use quando os requisitos pedem publicação automática.

1. O mesmo artefato construído na CI é o que vai para cada ambiente. Nada é reconstruído por ambiente.
2. Publica primeiro em homologação e confere a verificação de saúde (`SAUDE.md`).
3. Produção exige aprovação de uma pessoa, a menos que os requisitos digam o contrário.
4. Toda publicação tem como voltar atrás: a versão anterior fica disponível e o caminho de retorno está escrito.
5. Mudança de banco é compatível com a versão anterior do código, para permitir o retorno.
6. Cada publicação registra quem aprovou, a versão e a data.

## Automação industrial

Não há publicação automática em controlador. Alteração de lógica de CLP é sempre feita por uma pessoa, com cópia de segurança antes. A CI pode validar e arquivar o projeto, não descarregá-lo.

## Modelo

`plugins/kit/modelos/ci/testes.yml` traz um fluxo de GitHub Actions que roda os comandos do `test.config`. Copie para `.github/workflows/` e acrescente as etapas que o projeto usa.
