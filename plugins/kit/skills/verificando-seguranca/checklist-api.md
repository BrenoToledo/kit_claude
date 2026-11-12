# Checklist de segurança para API

Baseado no OWASP API Security Top 10 (2023). Responda cada item com `ok`, `não se aplica` ou `achado`.

## Acesso

1. **Autorização por objeto.** Cada endpoint que recebe um identificador confere se quem chama pode acessar aquele registro. Trocar o ID na URL não dá acesso ao dado de outro.
2. **Autenticação.** Todo endpoint exige identificação, exceto os declarados públicos no contrato. Token com validade; senha nunca em texto puro; tentativas de login limitadas.
3. **Autorização por campo.** A resposta só traz os campos que aquele perfil pode ver. A entrada só altera os campos que aquele perfil pode mudar (sem atribuição em massa).
4. **Autorização por função.** Operações administrativas conferem o perfil no servidor, não só na tela.

## Abuso

5. **Consumo de recursos.** Há limite de requisições por cliente, tamanho máximo de corpo e de página, tempo máximo de execução.
6. **Fluxos sensíveis.** Operações que custam ou geram valor (cadastro, pagamento, envio de mensagem) têm proteção contra repetição automática.
7. **Requisição a endereço informado pelo cliente.** Se a API busca uma URL recebida, o destino é validado contra uma lista permitida.

## Configuração

8. **Configuração segura.** Modo de depuração desligado em produção; CORS restrito às origens necessárias; HTTPS; cabeçalhos de segurança; mensagem de erro no formato do contrato, sem pilha.
9. **Inventário.** Todo endpoint novo está no contrato e versionado. Nenhuma rota de teste ou versão antiga exposta.
10. **Consumo de outras APIs.** Resposta de serviço externo é validada como entrada não confiável; há tempo limite e tratamento de falha.

## Dados

11. Dado sensível do `Perfil de segurança` trafega só por HTTPS, não aparece em log nem em URL.
12. Consulta ao banco usa parâmetros.
13. Segredos vêm de variável de ambiente.
