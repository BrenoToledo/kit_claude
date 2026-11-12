# API pública

## Quando é este

Outras empresas ou desenvolvedores de fora vão integrar com o sistema.

## Perguntas

1. Quem vai integrar e com que objetivo? (define os recursos expostos)
2. Como cada cliente se identifica? Chave por cliente, OAuth2? (define autenticação)
3. Cada cliente vê só os próprios dados? (define isolamento)
4. O que acontece com quem já integrou quando a API mudar? (define versionamento)
5. Há limite de uso por cliente? (define cota e limite de requisições)
6. Onde fica a documentação e quem a mantém? (o contrato é o produto)
7. Haverá ambiente de teste para os integradores? (evita teste em produção)
8. O uso é cobrado ou medido? (define registro de consumo)
9. Como um cliente é avisado de erro ou indisponibilidade? (define formato de erro e status)

## Erros comuns se pular

- Mudança que quebra integrações em produção.
- Um cliente derruba o serviço dos outros por falta de limite.
- Chave única compartilhada, impossível de revogar para um só cliente.
