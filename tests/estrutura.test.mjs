import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');
const plugin = join(raiz, 'plugins', 'kit');
const json = (p) => JSON.parse(readFileSync(p, 'utf8'));

test('marketplace valido', () => {
  const m = json(join(raiz, '.claude-plugin', 'marketplace.json'));
  assert.equal(m.name, 'kit-claude');
  assert.equal(m.plugins[0].name, 'kit');
  assert.equal(m.plugins[0].source, './plugins/kit');
});

test('plugin valido', () => {
  const p = json(join(plugin, '.claude-plugin', 'plugin.json'));
  assert.equal(p.name, 'kit');
  assert.match(p.version, /^\d+\.\d+\.\d+$/);
});

test('hooks apontam para arquivos existentes', () => {
  const h = json(join(plugin, 'hooks', 'hooks.json')).hooks;
  const comandos = Object.values(h).flat().flatMap((g) => g.hooks.map((x) => x.command));
  assert.ok(comandos.length >= 4);
  for (const c of comandos) {
    const m = c.match(/\$\{CLAUDE_PLUGIN_ROOT\}\/([^"]+\.mjs)/);
    assert.ok(m, `comando fora do padrão: ${c}`);
    assert.ok(existsSync(join(plugin, m[1])), `não existe: ${m[1]}`);
  }
});

test('skills tem frontmatter', () => {
  const pasta = join(plugin, 'skills');
  if (!existsSync(pasta)) return;
  for (const nome of readdirSync(pasta)) {
    const arq = join(pasta, nome, 'SKILL.md');
    assert.ok(existsSync(arq), `sem SKILL.md: ${nome}`);
    const txt = readFileSync(arq, 'utf8').replace(/\r\n/g, '\n');
    const m = txt.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
    assert.ok(m, `sem frontmatter: ${nome}`);
    assert.match(m[1], new RegExp(`^name: ${nome}$`, 'm'));
    assert.match(m[1], /^description: Use quando/m);
    const palavras = m[2].split(/\s+/).filter(Boolean).length;
    assert.ok(palavras < 500, `${nome} tem ${palavras} palavras`);
  }
});

test('agentes tem frontmatter com nome, descricao e modelo', () => {
  const pasta = join(plugin, 'agents');
  for (const arq of readdirSync(pasta)) {
    const txt = readFileSync(join(pasta, arq), 'utf8').replace(/\r\n/g, '\n');
    const m = txt.match(/^---\n([\s\S]*?)\n---\n/);
    assert.ok(m, `sem frontmatter: ${arq}`);
    assert.match(m[1], new RegExp(`^name: ${arq.replace('.md', '')}$`, 'm'));
    assert.match(m[1], /^description: .+/m);
    assert.match(m[1], /^model: (haiku|sonnet|opus|inherit)$/m);
  }
});
