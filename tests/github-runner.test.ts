import assert from "node:assert/strict";
import test from "node:test";
import { GitHubRunnerAdapter } from "../lib/runners/github-adapter";

test("valida um procedimento GitHub sem executar comandos", async () => {
  const tests = [{ name: "fluxo", expected: { all: ["git status", "git add README.md"], ordered: ["git status", "git add README.md", "git commit"] } }];
  const [result] = await GitHubRunnerAdapter.execute({ code: "git status\ngit add   README.md\ngit commit -m \"docs: inicia guia\"", tests });
  assert.equal(result.passed, true);
  assert.equal((await GitHubRunnerAdapter.execute({ code: "git commit -m teste\ngit status", tests }))[0].passed, false);
});

test("rejeita credenciais reais no editor", async () => {
  await assert.rejects(() => GitHubRunnerAdapter.execute({ code: "github_pat_123456789012345678901234567890", tests: [] }), /tokens nem chaves privadas/i);
  await assert.rejects(() => GitHubRunnerAdapter.execute({ code: "-----BEGIN OPENSSH PRIVATE KEY-----", tests: [] }), /tokens nem chaves privadas/i);
});
