# Perguntas de qualidade e entrega

Faça depois das perguntas do arquétipo e das três de segurança. Uma por mensagem. As respostas vão para a seção `Qualidade e entrega` do `REQUISITOS.md`.

Pergunte o que o projeto precisa, sem sugerir ferramenta. A escolha da ferramenta é do desenho, seguindo os padrões em `docs/padroes/`.

1. **Lint e formatação.** O projeto terá verificação automática de estilo e de erro provável? Há um padrão de código da empresa ou do cliente a seguir? (padrão: sim, sempre; ver `QUALIDADE.md`)
2. **Análise estática (SonarQube).** O projeto precisa de análise de qualidade e segurança com portão de aprovação? Já existe um servidor SonarQube ou SonarCloud disponível? (decide se entra na integração contínua)
3. **Contêiner.** Onde o sistema vai rodar: máquina do usuário, servidor, nuvem, mais de um lugar? Precisa ser empacotado em contêiner? (ver `CONTAINER.md`)
4. **Integração contínua (CI).** Onde fica o repositório e qual serviço de CI está disponível? Os testes devem rodar a cada envio? (padrão: sim; ver `CI-CD.md`)
5. **Entrega contínua (CD).** A publicação será automática ou manual? Quem aprova a ida para produção? Como se volta atrás?
6. **Ambientes.** Quais existem: desenvolvimento, homologação, produção? Quem tem acesso a cada um?

Projeto pequeno ou descartável pode responder "não se aplica" a 2, 3 e 5. Registre a resposta mesmo assim: a ausência é uma decisão.
