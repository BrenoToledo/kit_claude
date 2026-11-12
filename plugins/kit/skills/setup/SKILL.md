---
name: setup
description: Use quando o kit acabou de ser instalado, quando o aviso de início de sessão pedir, ou quando o usuário quiser conferir a configuração do Claude Code no projeto.
---

# Setup do kit

Deixa o projeto e o Claude Code prontos para o método do kit. Primeiro diagnostica, sem alterar nada; depois corrige, um item por vez, só com o sim do usuário.

## 1. Diagnóstico

Rode, a partir da raiz do projeto:

```
node "<diretório base desta skill>/../../hooks/diagnostico.mjs"
```

O diretório base é informado quando esta skill carrega. Mostre o resultado em uma tabela `item | situação | ação proposta`, com uma linha para: CLAUDE.md global, CLAUDE.md do projeto, AGENTS.md, estado do projeto (`docs/projeto/`), `run.bat`, kit ativo, plugins instalados, ferramentas (headroom, rtk, agy, gh), proxy e tipo do projeto.

## 2. Correções

Proponha uma por vez. Execute só depois do sim. Os modelos ficam em `<diretório base desta skill>/../../modelos/`.

| Situação | Ação |
|---|---|
| Sem CLAUDE.md global | Criar a partir de `modelos/CLAUDE.md` |
| CLAUDE.md global com mais de 200 linhas | Propor versão enxuta; mostrar o que sai; manter o que é específico do usuário |
| Sem AGENTS.md no projeto | Copiar `modelos/AGENTS.md` para a raiz |
| Sem `docs/projeto/` | Criar com `ESTADO.md`, `DECISOES.md` e as pastas `contratos/`, `telas/`, `tarefas/` a partir de `modelos/projeto/` |
| Sem `docs/padroes/` ou com padrão faltando | Copiar os arquivos de `modelos/padroes/` para `docs/padroes/`; em projeto Python, oferecer também `modelos/log/python/kit_log.py` |
| Sem `test.bat` | Copiar `modelos/teste/test.bat` e criar `test.config` com os comandos de teste do projeto |
| Sem `.env.example` e o projeto usa variável de ambiente | Criar conforme `CONFIG.md` |
| Sem `run.bat` e o projeto tem algo para rodar | Copiar `modelos/run/run.bat`; criar `run.config` com os serviços do projeto; incluir `.run/` e `logs/` no `.gitignore` |
| Kit inativo | Gravar `.claude/kit-estado.json` |
| `.claude/kit-rapido` ou `.claude/kit-eventos.jsonl` fora do `.gitignore` | Acrescentar as linhas |

Conteúdo de `.claude/kit-estado.json`:

```json
{"ativo": true, "versao": "0.5.0", "tipo": "<tipoProjeto>", "data": "<AAAA-MM-DD>", "condutor": "kit", "repositorioKit": "BrenoToledo/kit_claude"}
```

## 3. Convivência com outros plugins

Se `plugins` contém `superpowers`, pergunte qual dos dois conduz o processo neste projeto e grave a resposta em `condutor` (`kit` ou `superpowers`). Dois condutores ao mesmo tempo dão ordens conflitantes.

## 4. Ferramentas ausentes

Para headroom, rtk, agy e gh ausentes, mostre o comando de instalação e o que a ferramenta faz. Deixe a instalação com o usuário: são programas de terceiros rodando na máquina dele.

## 5. Encerramento

Mostre a tabela final com o que mudou e termine com:

Próxima etapa: levantando-requisitos, em conversa nova, lendo docs/projeto/ESTADO.md.
