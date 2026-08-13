import type { QuickJSWASMModule } from "quickjs-emscripten-core";

export type JavaScriptTest = { name: string; input: unknown[]; expected: unknown };

const MEMORY_LIMIT = 16 * 1024 * 1024;
const STACK_LIMIT = 512 * 1024;
const TIME_LIMIT_MS = 250;

function sameValue(actual: unknown, expected: unknown): boolean {
  if (Object.is(actual, expected)) return true;
  if (Array.isArray(actual) && Array.isArray(expected)) {
    return actual.length === expected.length && actual.every((value, index) => sameValue(value, expected[index]));
  }
  if (actual && expected && typeof actual === "object" && typeof expected === "object") {
    const actualObject = actual as Record<string, unknown>;
    const expectedObject = expected as Record<string, unknown>;
    const keys = Object.keys(actualObject);
    return keys.length === Object.keys(expectedObject).length
      && keys.every((key) => Object.hasOwn(expectedObject, key) && sameValue(actualObject[key], expectedObject[key]));
  }
  return false;
}

function errorMessage(error: unknown) {
  if (error && typeof error === "object" && "message" in error) {
    const message = String((error as { message: unknown }).message);
    return message === "interrupted" ? "O código excedeu o limite de execução." : message;
  }
  return "Não foi possível executar o código.";
}

export function runJavaScript(module: QuickJSWASMModule, code: string, functionName: string, tests: JavaScriptTest[]) {
  if (!/^[A-Za-z_$][\w$]*$/.test(functionName)) throw new Error("Nome de função inválido.");
  const runtime = module.newRuntime();
  runtime.setMemoryLimit(MEMORY_LIMIT);
  runtime.setMaxStackSize(STACK_LIMIT);
  runtime.setInterruptHandler(() => Date.now() > deadline);
  const context = runtime.newContext();
  const deadline = Date.now() + TIME_LIMIT_MS;

  try {
    const setup = context.evalCode(`"use strict";\n${code}\n;typeof ${functionName} === "function"`, "submission.js");
    if (setup.error) {
      const error = context.dump(setup.error);
      setup.error.dispose();
      throw new Error(errorMessage(error));
    }
    const isFunction = context.dump(setup.value);
    setup.value.dispose();
    if (!isFunction) throw new Error(`Declare a função ${functionName}.`);

    return tests.map((test) => {
      const result = context.evalCode(`${functionName}(...${JSON.stringify(test.input)})`, "test.js");
      if (result.error) {
        const error = context.dump(result.error);
        result.error.dispose();
        throw new Error(errorMessage(error));
      }
      const actual = context.dump(result.value);
      result.value.dispose();
      return { name: test.name, passed: sameValue(actual, test.expected) };
    });
  } finally {
    context.dispose();
    runtime.dispose();
  }
}
