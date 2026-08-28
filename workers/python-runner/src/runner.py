import ast
import builtins
import inspect
import json


MAX_CODE_LENGTH = 12_000
MAX_TESTS = 8
SAFE_MODULES = {
    "asyncio", "collections", "dataclasses", "datetime", "functools", "itertools",
    "json", "math", "re", "statistics", "typing",
}
BLOCKED_CALLS = {"breakpoint", "compile", "eval", "exec", "getattr", "globals", "help", "input", "locals", "open", "setattr", "vars"}
BLOCKED_ATTRIBUTES = {"builtins", "environ", "getenv", "importlib", "inspect", "loader", "modules", "os", "spec", "sys", "types", "__bases__", "__builtins__", "__class__", "__closure__", "__code__", "__dict__", "__func__", "__getattribute__", "__globals__", "__mro__", "__subclasses__"}
SAFE_MAGIC_ATTRIBUTES = {"__enter__", "__exit__", "__init__", "__iter__", "__len__", "__next__", "__repr__"}


class RunnerError(Exception):
    pass


def _validate(code):
    if not isinstance(code, str) or not code.strip():
        raise RunnerError("Escreva uma solução antes de executar.")
    if len(code) > MAX_CODE_LENGTH:
        raise RunnerError("O código excede 12.000 caracteres.")
    try:
        tree = ast.parse(code)
    except SyntaxError as error:
        raise RunnerError(f"Erro de sintaxe na linha {error.lineno}.") from None

    for node in ast.walk(tree):
        if isinstance(node, (ast.Import, ast.ImportFrom)):
            modules = [alias.name.split(".")[0] for alias in node.names] if isinstance(node, ast.Import) else [(node.module or "").split(".")[0]]
            if any(module not in SAFE_MODULES for module in modules):
                raise RunnerError("Este módulo não está disponível no ambiente seguro.")
        if isinstance(node, ast.Call) and isinstance(node.func, ast.Name) and node.func.id in BLOCKED_CALLS:
            raise RunnerError("Esta função não está disponível no ambiente seguro.")
        if isinstance(node, ast.Attribute) and (node.attr in BLOCKED_ATTRIBUTES or (node.attr.startswith("_") and node.attr not in SAFE_MAGIC_ATTRIBUTES)):
            raise RunnerError("Este acesso interno não está disponível no ambiente seguro.")
    return tree


def _safe_import(name, globals=None, locals=None, fromlist=(), level=0):
    if level or name.split(".")[0] not in SAFE_MODULES:
        raise RunnerError("Este módulo não está disponível no ambiente seguro.")
    return builtins.__import__(name, globals, locals, fromlist, level)


def _namespace():
    allowed = {
        "ArithmeticError", "AssertionError", "Exception", "IndexError", "KeyError",
        "LookupError", "RuntimeError", "StopIteration", "TypeError", "ValueError",
        "abs", "all", "any", "bool", "bytearray", "bytes", "callable", "chr",
        "classmethod", "dict", "divmod", "enumerate", "filter", "float", "format",
        "frozenset", "hash", "hex", "int", "isinstance", "issubclass", "iter",
        "len", "list", "map", "max", "min", "next", "object", "oct", "ord",
        "pow", "property", "range", "repr", "reversed", "round", "set", "slice",
        "sorted", "staticmethod", "str", "sum", "super", "tuple", "type", "zip",
        "__build_class__",
    }
    safe_builtins = {name: getattr(builtins, name) for name in allowed}
    safe_builtins["__import__"] = _safe_import
    safe_builtins["print"] = lambda *args, **kwargs: None
    return {"__builtins__": safe_builtins, "__name__": "solution"}


def _normalize(value):
    try:
        return json.loads(json.dumps(value, ensure_ascii=False))
    except (TypeError, ValueError):
        raise RunnerError("A função deve retornar um valor compatível com JSON.") from None


async def run_tests(code, function_name, tests):
    if not isinstance(function_name, str) or not function_name.isidentifier():
        raise RunnerError("Função da missão inválida.")
    if not isinstance(tests, list) or not 1 <= len(tests) <= MAX_TESTS:
        raise RunnerError("Testes da missão inválidos.")

    compiled = compile(_validate(code), "<solution>", "exec")
    results = []
    for test in tests:
        if not isinstance(test, dict) or not isinstance(test.get("input"), list):
            raise RunnerError("Teste da missão inválido.")
        namespace = _namespace()
        exec(compiled, namespace, namespace)
        function = namespace.get(function_name)
        if not callable(function):
            raise RunnerError(f"Crie a função {function_name} conforme solicitado.")
        try:
            actual = function(*test["input"])
            if inspect.isawaitable(actual):
                actual = await actual
            if inspect.isgenerator(actual):
                actual = list(actual)
            actual = _normalize(actual)
            passed = actual == test.get("expected")
        except RunnerError:
            raise
        except Exception:
            passed = False
        results.append({"name": str(test.get("name", "Teste"))[:80], "passed": passed})
    return results
