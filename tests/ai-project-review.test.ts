import assert from "node:assert/strict";
import test from "node:test";
import { reviewProjectWithAI } from "../lib/ai-project-review";

const input = {
  files: { "index.html": "<main></main>", "style.css": "main{}", "script.js": "const ok=true;" },
  projectTitle: "Projeto teste", stepTitle: "Estrutura", requirements: ["Criar main"], results: [{ passed: true }], safetyIdentifier: "anonimo",
};

test("requests a stateless structured pedagogical review", async () => {
  let requestBody: Record<string, unknown> = {};
  const fetcher = (async (_input: string | URL | Request, init?: RequestInit) => {
    requestBody = JSON.parse(String(init?.body)) as Record<string, unknown>;
    return Response.json({ output_text: JSON.stringify({ summary: "Boa estrutura.", strengths: ["HTML semântico"], improvements: ["Melhorar nomes"], nextStep: "Adicionar estilos" }) });
  }) as typeof fetch;
  const result = await reviewProjectWithAI(input, { apiKey: "test-key", model: "test-model", fetcher });
  assert.equal(result.status, "completed");
  assert.equal(result.review?.nextStep, "Adicionar estilos");
  assert.equal(requestBody.store, false);
  assert.equal((requestBody.text as { format: { type: string } }).format.type, "json_schema");
});

test("AI failure never replaces objective validation", async () => {
  const fetcher = (async () => new Response("erro", { status: 500 })) as typeof fetch;
  assert.equal((await reviewProjectWithAI(input, { apiKey: "test-key", fetcher })).status, "error");
});
