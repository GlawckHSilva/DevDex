import test from "node:test";
import assert from "node:assert/strict";
import variant from "@jitl/quickjs-wasmfile-release-sync";
import { newQuickJSWASMModuleFromVariant } from "quickjs-emscripten-core";
import { runJavaScript } from "../lib/quickjs-runner-core";

const modulePromise = newQuickJSWASMModuleFromVariant(variant);

test("executes complete JavaScript inside QuickJS", async () => {
  const quickJs = await modulePromise;
  const results = runJavaScript(quickJs, `function total(values) {
    return values.filter((value) => value > 0).reduce((sum, value) => sum + value, 0);
  }`, "total", [{ name: "arrays", input: [[-2, 3, 4]], expected: 7 }]);
  assert.deepEqual(results, [{ name: "arrays", passed: true }]);
});

test("does not expose host APIs", async () => {
  const quickJs = await modulePromise;
  const results = runJavaScript(quickJs, "function isolated() { return typeof fetch; }", "isolated", [
    { name: "fetch", input: [], expected: "undefined" },
  ]);
  assert.equal(results[0].passed, true);
});

test("interrupts infinite loops", async () => {
  const quickJs = await modulePromise;
  assert.throws(() => runJavaScript(quickJs, "function loop() { while (true) {} }", "loop", [
    { name: "timeout", input: [], expected: true },
  ]), /limite de execução/);
});
