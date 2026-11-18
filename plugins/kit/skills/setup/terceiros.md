# Skills e plugins de terceiros

SkillSpector (NVIDIA, Apache-2.0) analisa skills e plugins de terceiros antes da instalação. Precisa de Python 3.12+ e `uv`:

```
uv tool install git+https://github.com/NVIDIA/skillspector.git
```

Antes de propor a instalação de qualquer skill, plugin ou servidor MCP que não seja do kit (headroom, caveman, ponytail, uma skill do GitHub), analise o pacote:

```
node "<diretório base desta skill>/../../hooks/analisar-skill.mjs" <pasta | SKILL.md | .zip | URL>
```

| Código | Recomendação | Ação |
|---|---|---|
| 0 | SAFE | Pode propor a instalação |
| 1 | CAUTION | Mostre os achados; instale só com o sim do usuário, depois de ele ler os achados |
| 2 | DO NOT INSTALL | Não instale. Mostre os achados e pare |
| 3 | SkillSpector ausente | Mostre o comando de instalação; sem análise, trate como CAUTION |
| 4 | Erro na análise | Trate como não verificado: mesma regra de CAUTION |

A análise padrão é só estática, e nada do conteúdo sai da máquina. `--llm` acrescenta a análise semântica, mas envia o conteúdo ao provedor configurado em `SKILLSPECTOR_PROVIDER`. Use `--llm` só com o sim do usuário e nunca em material de trabalho com IP, nome ou dado de cliente, a menos que o provedor seja local (`ollama`).
