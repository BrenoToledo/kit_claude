// Validação do padrão de log do kit (docs/padroes/LOG.md). Sem dependências.
export const OBRIGATORIOS = ['ts', 'nivel', 'evento', 'msg', 'servico', 'versao', 'ambiente', 'id_correlacao'];
export const NIVEIS = ['debug', 'info', 'aviso', 'erro', 'critico'];
const TS = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;
const EVENTO = /^[a-z][a-z0-9_]*$/;
const CHAVE_SENSIVEL = /^(senha|password|passwd|secret|segredo|token|api_?key|authorization|cookie)$/i;
const CPF = /\d{3}\.\d{3}\.\d{3}-\d{2}/;
const CNPJ = /\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}/;

function sensiveis(valor, caminho, achados) {
  if (typeof valor === 'string') {
    if (CPF.test(valor) || CNPJ.test(valor)) achados.push(`dado sensível sem máscara em ${caminho} (CPF ou CNPJ)`);
  } else if (Array.isArray(valor)) {
    valor.forEach((v, i) => sensiveis(v, `${caminho}[${i}]`, achados));
  } else if (valor && typeof valor === 'object') {
    for (const [k, v] of Object.entries(valor)) {
      const onde = caminho ? `${caminho}.${k}` : k;
      if (CHAVE_SENSIVEL.test(k) && typeof v === 'string' && !v.includes('*')) {
        achados.push(`dado sensível sem máscara em ${onde}`);
      } else {
        sensiveis(v, onde, achados);
      }
    }
  }
}

// Devolve a lista de problemas de um evento; lista vazia significa válido.
export function validarLinha(ev) {
  if (!ev || typeof ev !== 'object' || Array.isArray(ev)) return ['a linha não é um objeto JSON'];
  const erros = [];
  for (const c of OBRIGATORIOS) {
    if (typeof ev[c] !== 'string' || !ev[c].trim()) erros.push(`campo obrigatório ausente ou vazio: ${c}`);
  }
  if (typeof ev.ts === 'string' && !TS.test(ev.ts)) erros.push('ts fora do formato AAAA-MM-DDTHH:MM:SS.mmmZ (UTC)');
  if (typeof ev.nivel === 'string' && !NIVEIS.includes(ev.nivel)) erros.push(`nivel inválido: use ${NIVEIS.join(', ')}`);
  if (typeof ev.evento === 'string' && !EVENTO.test(ev.evento)) erros.push('evento fora do padrão: minúsculas, números e sublinhado');
  if (ev.nivel === 'erro' || ev.nivel === 'critico') {
    if (!('entrada' in ev)) erros.push('erro sem o campo entrada');
    if (!('estado' in ev)) erros.push('erro sem o campo estado');
    if (!ev.erro || typeof ev.erro !== 'object') {
      erros.push('erro sem o campo erro');
    } else {
      if (typeof ev.erro.tipo !== 'string' || !ev.erro.tipo) erros.push('falta erro.tipo');
      if (typeof ev.erro.mensagem !== 'string') erros.push('falta erro.mensagem');
    }
  }
  sensiveis(ev, '', erros);
  return erros;
}

export function lerEventos(texto) {
  const eventos = [];
  String(texto).split(/\r?\n/).forEach((linha, i) => {
    if (!linha.trim()) return;
    try {
      eventos.push({ linha: i + 1, evento: JSON.parse(linha) });
    } catch {
      eventos.push({ linha: i + 1, evento: null });
    }
  });
  return eventos;
}

export function validarTexto(texto) {
  const eventos = lerEventos(texto);
  const erros = [];
  for (const { linha, evento } of eventos) {
    const problemas = evento === null ? ['a linha não é JSON válido'] : validarLinha(evento);
    for (const erro of problemas) erros.push({ linha, erro });
  }
  return { linhas: eventos.length, erros };
}
