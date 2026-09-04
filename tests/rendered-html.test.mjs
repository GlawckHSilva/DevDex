import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("declares the DevDex foundation landing page", async () => {
  const [layout, page] = await Promise.all([
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
  ]);
  assert.match(layout, /lang="pt-BR"/);
  assert.match(page, /Aprenda programação/);
  assert.match(page, /Começar grátis/);
  assert.match(page, /Testar um desafio/);
  assert.match(page, /stagesPerTrack = 150/);
  assert.match(page, /contentsPerTrack = 24/);
  assert.match(page, /Project Mode/i);
  assert.doesNotMatch(page, /codex-preview|react-loading-skeleton/);
});

test("project status reads the published curriculum", async () => {
  const source = await readFile(new URL("../app/status/page.tsx", import.meta.url), "utf8");
  assert.match(source, /getPublicStatus/);
  assert.match(source, /Public Beta v0\.3/);
});
