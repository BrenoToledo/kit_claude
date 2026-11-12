import io
import json
import re
import unittest

import kit_log


class KitLogTest(unittest.TestCase):
    def setUp(self):
        self.saida = io.StringIO()
        kit_log.configurar(servico="s", versao="v1", ambiente="teste", destino=self.saida)

    def linhas(self):
        return [json.loads(l) for l in self.saida.getvalue().splitlines()]

    def test_evento_tem_campos_obrigatorios(self):
        kit_log.evento("coisa_feita", "Feito", valor=3)
        ev = self.linhas()[0]
        for campo in ("ts", "nivel", "evento", "msg", "servico", "versao", "ambiente", "id_correlacao"):
            self.assertTrue(ev[campo], campo)
        self.assertRegex(ev["ts"], r"^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$")
        self.assertEqual(ev["valor"], 3)

    def test_mesma_correlacao_dentro_do_bloco(self):
        with kit_log.correlacao() as cid:
            kit_log.evento("a", "a")
            kit_log.evento("b", "b")
        kit_log.evento("c", "c")
        a, b, c = self.linhas()
        self.assertEqual(a["id_correlacao"], cid)
        self.assertEqual(b["id_correlacao"], cid)
        self.assertNotEqual(c["id_correlacao"], cid)

    def test_correlacao_recebida_e_mantida(self):
        with kit_log.correlacao("veio-de-fora"):
            kit_log.evento("a", "a")
        self.assertEqual(self.linhas()[0]["id_correlacao"], "veio-de-fora")

    def test_falha_leva_entrada_estado_e_erro(self):
        try:
            raise KeyError("produto")
        except KeyError as exc:
            kit_log.falha("busca_falhou", exc, entrada={"id": 7}, estado={"cache": "vazio"})
        ev = self.linhas()[0]
        self.assertEqual(ev["nivel"], "erro")
        self.assertEqual(ev["entrada"], {"id": 7})
        self.assertEqual(ev["estado"], {"cache": "vazio"})
        self.assertEqual(ev["erro"]["tipo"], "KeyError")
        self.assertIn("KeyError", ev["erro"]["pilha"])

    def test_mascara_dado_sensivel(self):
        kit_log.evento("login", "CPF 529.982.247-25", senha="abc12345", dados={"token": "xyz", "cnpj": "11.222.333/0001-81"})
        texto = self.saida.getvalue()
        for segredo in ("529.982.247", "abc12345", "xyz", "11.222.333"):
            self.assertNotIn(segredo, texto)
        self.assertTrue(re.search(r"\*\*\*\.\*\*\*\.\*\*\*-25", texto))

    def test_nivel_invalido(self):
        with self.assertRaises(ValueError):
            kit_log.evento("a", "a", nivel="ERROR")


if __name__ == "__main__":
    unittest.main()
