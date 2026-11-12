---
name: desenhando-solucao
description: Use quando os requisitos estão aprovados e ainda não existe desenho, ou quando um bloqueio do kit pedir simulado de tela.
---

# Desenhando a solução

Transforma requisitos aprovados em partes, contratos e simulados. O resultado é `DESENHO.md`, os arquivos em `contratos/` e, se houver tela, os simulados em `telas/`, todos aprovados pelo usuário.

Nesta etapa se produz desenho e documentos. A implementação começa depois do plano.

## Passos

1. **Leia só `docs/projeto/REQUISITOS.md`.** Se `ESTADO.md` não diz `requisitos: aprovado`, pare e indique `/kit:levantando-requisitos`.

2. **Liste as partes do sistema**, uma linha cada: nome e responsabilidade. Cada parte existe porque algum requisito pede.

3. **Escreva um contrato para cada ligação entre partes**, a partir de `modelos/projeto/contrato.md` (em `<diretório base desta skill>/../../modelos/`), em `docs/projeto/contratos/<nome>.md`, com `status: rascunho`. Preencha as seis seções, com um exemplo real de entrada e saída.

4. **Se há API**, abra `padroes/api.md`, escolha o modelo pela tabela e registre a linha escolhida em `DECISOES.md`.

5. **Se há tela**, faça o simulado antes de qualquer outra coisa visual:
   - protótipo no Figma, quando a ferramenta estiver disponível;
   - senão, página HTML estática, sem lógica, em `docs/projeto/telas/`.

   Liste os componentes de cada tela, marcando os que já existem e os novos. Peça aprovação. Com o sim, grave `simulado: aprovado` em `ESTADO.md`.

6. **Grave `DESENHO.md`** e apresente em seções curtas: visão geral, partes, contratos, telas, decisões. Pergunte se está certo.

7. **Com o sim do usuário**, mude todos os contratos para `status: congelado` e atualize `ESTADO.md`: `fase: plano`, `proxima: rode /kit:planejando`. Sem o sim, os contratos seguem em `rascunho` e você ajusta.

## Conferência antes de pedir aprovação

- Toda parte responde a um requisito.
- Toda ligação entre partes tem contrato com exemplo.
- Nenhum arquivo de código foi criado.
- O perfil de segurança dos requisitos aparece no desenho: quem acessa cada parte e onde ela fica exposta.

Próxima etapa: planejando, em conversa nova, lendo docs/projeto/DESENHO.md e docs/projeto/contratos/.
