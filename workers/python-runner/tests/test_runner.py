import sys
import asyncio
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parents[1] / "src"))
from runner import RunnerError, run_tests


class RunnerTests(unittest.TestCase):
    def test_executes_isolated_function_tests(self):
        results = asyncio.run(run_tests(
            "def somar(a, b):\n    return a + b",
            "somar",
            [{"name": "soma", "input": [2, 3], "expected": 5}],
        ))
        self.assertEqual(results, [{"name": "soma", "passed": True}])

    def test_rejects_runtime_and_ffi_imports(self):
        with self.assertRaises(RunnerError):
            asyncio.run(run_tests("import js\ndef executar():\n    return True", "executar", [{"input": [], "expected": True}]))

    def test_rejects_internal_attribute_escape(self):
        with self.assertRaises(RunnerError):
            asyncio.run(run_tests("def executar():\n    return ().__class__", "executar", [{"input": [], "expected": None}]))

    def test_rejects_transitive_module_escape(self):
        with self.assertRaises(RunnerError):
            asyncio.run(run_tests("import dataclasses\ndef executar():\n    return dataclasses.sys.modules", "executar", [{"input": [], "expected": None}]))

    def test_allows_safe_standard_library(self):
        results = asyncio.run(run_tests(
            "from statistics import mean\ndef media(valores):\n    return mean(valores)",
            "media",
            [{"name": "média", "input": [[2, 4]], "expected": 3}],
        ))
        self.assertTrue(results[0]["passed"])

    def test_supports_generators_and_async_functions(self):
        generator = asyncio.run(run_tests("def pares(limite):\n    for n in range(limite):\n        if n % 2 == 0: yield n", "pares", [{"input": [5], "expected": [0, 2, 4]}]))
        async_result = asyncio.run(run_tests("import asyncio\nasync def dobrar(n):\n    await asyncio.sleep(0)\n    return n * 2", "dobrar", [{"input": [4], "expected": 8}]))
        self.assertTrue(generator[0]["passed"] and async_result[0]["passed"])


if __name__ == "__main__":
    unittest.main()
