"""Log no padrão do kit (docs/padroes/LOG.md). Só biblioteca padrão.

Uso:
    import kit_log
    kit_log.configurar(servico="loja-api", versao="a1b2c3d", ambiente="producao")
    with kit_log.correlacao():                      # um id por requisição ou execução
        kit_log.evento("pedido_recebido", "Pedido recebido", produto_id=7)
        try:
            ...
        except Exception as exc:
            kit_log.falha("pedido_falhou", exc, entrada={...}, estado={...})
            raise
"""
import contextlib
import contextvars
import datetime
import json
import re
import sys
import traceback
import uuid

NIVEIS = ("debug", "info", "aviso", "erro", "critico")
_CHAVE_SENSIVEL = re.compile(r"^(senha|password|passwd|secret|segredo|token|api_?key|authorization|cookie)$", re.I)
_CPF = re.compile(r"\d{3}\.\d{3}\.\d{3}-(\d{2})")
_CNPJ = re.compile(r"\d{2}\.\d{3}\.\d{3}/\d{4}-(\d{2})")

_config = {"servico": "", "versao": "", "ambiente": "", "destino": None}
_correlacao = contextvars.ContextVar("kit_log_correlacao", default=None)


def configurar(servico, versao, ambiente, destino=None):
    """Define os campos fixos. `destino` é um arquivo aberto; o padrão é a saída padrão."""
    _config.update(servico=servico, versao=versao, ambiente=ambiente, destino=destino)


@contextlib.contextmanager
def correlacao(id_correlacao=None):
    """Abre uma correlação. Passe o id recebido de outro serviço para continuar a mesma."""
    ficha = _correlacao.set(id_correlacao or uuid.uuid4().hex)
    try:
        yield _correlacao.get()
    finally:
        _correlacao.reset(ficha)


def id_atual():
    return _correlacao.get()


def mascarar(valor):
    """Mascara CPF, CNPJ e valores de chaves sensíveis, em qualquer profundidade."""
    if isinstance(valor, str):
        valor = _CPF.sub(r"***.***.***-\1", valor)
        return _CNPJ.sub(r"**.***.***/****-\1", valor)
    if isinstance(valor, dict):
        return {
            str(k): "***" if _CHAVE_SENSIVEL.match(str(k)) and v is not None else mascarar(v)
            for k, v in valor.items()
        }
    if isinstance(valor, (list, tuple, set)):
        return [mascarar(v) for v in valor]
    if valor is None or isinstance(valor, (bool, int, float)):
        return valor
    return mascarar(str(valor))


def _agora():
    agora = datetime.datetime.now(datetime.timezone.utc)
    return agora.strftime("%Y-%m-%dT%H:%M:%S.") + f"{agora.microsecond // 1000:03d}Z"


def _emitir(registro):
    destino = _config["destino"] or sys.stdout
    destino.write(json.dumps(registro, ensure_ascii=False) + "\n")
    destino.flush()


def evento(nome, msg, nivel="info", **dados):
    """Registra um evento. `nome` é fixo, em minúsculas com sublinhado."""
    if nivel not in NIVEIS:
        raise ValueError(f"nivel inválido: {nivel}")
    registro = {
        "ts": _agora(),
        "nivel": nivel,
        "evento": nome,
        "msg": mascarar(str(msg)),
        "servico": _config["servico"],
        "versao": _config["versao"],
        "ambiente": _config["ambiente"],
        "id_correlacao": _correlacao.get() or uuid.uuid4().hex,
    }
    registro.update(mascarar(dados))
    _emitir(registro)
    return registro


def falha(nome, exc, entrada, estado, nivel="erro", **dados):
    """Registra um erro com o que é preciso para reproduzi-lo: o que chegou e o que existia antes."""
    pilha = "".join(traceback.format_exception(type(exc), exc, exc.__traceback__))
    return evento(
        nome,
        str(exc) or type(exc).__name__,
        nivel=nivel,
        entrada=entrada,
        estado=estado,
        erro={"tipo": type(exc).__name__, "mensagem": str(exc), "pilha": pilha},
        **dados,
    )
