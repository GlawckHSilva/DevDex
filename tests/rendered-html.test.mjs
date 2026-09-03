import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function render(path = "/") {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}-${path}`);
  const { default: worker } = await import(workerUrl.href);
  return worker.fetch(new Request(`http://localhost${path}`, { headers: { accept: "text/html" } }), { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } }, { waitUntil() {}, passThroughOnException() {} });
}

test("renders the DevDex foundation landing page", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /<html lang="pt-BR">/);
  assert.match(html, /Aprenda programação como quem vence uma/);
  assert.match(html, /Começar grátis/);
  assert.match(html, /Testar um desafio/);
  assert.match(html, /Cada vitória libera o próximo mundo/);
  assert.match(html, /Project Mode/i);
  assert.doesNotMatch(html, /codex-preview|react-loading-skeleton/);
});

test("project status reads the published curriculum", async () => {
  const source = await readFile(new URL("../app/status/page.tsx", import.meta.url), "utf8");
  assert.match(source, /getPublicStatus/);
  assert.match(source, /Public Beta v0\.3/);
});
