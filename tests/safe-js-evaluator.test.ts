import assert from "node:assert/strict";
import test from "node:test";
import { compileSafeFunction } from "../lib/safe-js-evaluator";

test("interprets the allowed sum mission", () => {
  const sum = compileSafeFunction("function somar(a, b) { return a + b; }", "somar", ["a", "b"]);
  assert.equal(sum(2, 3), 5);
  assert.equal(sum(-4, -6), -10);
});

test("interprets an allowed comparison", () => {
  const canEnter = compileSafeFunction("function podeEntrar(idade) { return idade >= 18; }", "podeEntrar", ["idade"]);
  assert.equal(canEnter(17), false);
  assert.equal(canEnter(18), true);
});

test("rejects globals and extra statements", () => {
  assert.throws(() => compileSafeFunction("function somar(a, b) { return globalThis.process; }", "somar", ["a", "b"]), /valores, parâmetros e operadores/);
  assert.throws(() => compileSafeFunction("function somar(a, b) { const x = a + b; return x; }", "somar", ["a", "b"]), /única instrução return/);
});
