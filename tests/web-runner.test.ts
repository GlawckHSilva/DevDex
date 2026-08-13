import assert from "node:assert/strict";
import test from "node:test";
import { WebRunnerAdapter, type WebValidationRule } from "../lib/runners/web-adapter";

const htmlRules: WebValidationRule[] = [
  { type: "element", tag: "h1", textIncludes: "Oficina DevDex" },
  { type: "element", tag: "a", textIncludes: "Serviços", attributes: { href: "#servicos" } },
];

test("validates semantic HTML without comparing source text", async () => {
  const result = await WebRunnerAdapter.execute({ documentType: "html", code: '<main><h1>Oficina <em>DevDex</em></h1><a href="#servicos">Serviços</a></main>', rules: htmlRules });
  assert.equal(result.passed, true);
  assert.deepEqual(result.results, [{ passed: true }, { passed: true }]);
});

test("reports unmet HTML criteria", async () => {
  const result = await WebRunnerAdapter.execute({ documentType: "html", code: "<h2>Oficina DevDex</h2>", rules: htmlRules });
  assert.equal(result.passed, false);
});

test("blocks active HTML, event handlers and external resources", async () => {
  await assert.rejects(() => WebRunnerAdapter.execute({ documentType: "html", code: "<script>alert(1)</script>" }), /tag <script>/i);
  await assert.rejects(() => WebRunnerAdapter.execute({ documentType: "html", code: '<button onclick="alert(1)">Abrir</button>' }), /atributo onclick/i);
  await assert.rejects(() => WebRunnerAdapter.execute({ documentType: "html", code: '<img src="https://example.com/a.png">' }), /imagens externas/i);
  await assert.rejects(() => WebRunnerAdapter.execute({ documentType: "html", code: '<a href="https://example.com">Abrir</a>' }), /links externos/i);
});

test("parses and validates CSS declarations", async () => {
  const rules: WebValidationRule[] = [{ type: "style", selector: ".card", declarations: { "background-color": "#0f172a", padding: "24px" } }];
  const result = await WebRunnerAdapter.execute({ documentType: "css", code: ".card { padding: 24px; background-color: #0f172a; }", rules });
  assert.equal(result.passed, true);
  assert.equal((await WebRunnerAdapter.execute({ documentType: "css", code: ".card { padding: 12px; }", rules })).passed, false);
});

test("blocks CSS capable of fetching or escaping the style element", async () => {
  await assert.rejects(() => WebRunnerAdapter.execute({ documentType: "css", code: ".card { background: url(https://example.com/a.png) }" }), /não é permitido/i);
  await assert.rejects(() => WebRunnerAdapter.execute({ documentType: "css", code: "</style><script>alert(1)</script>" }), /não é permitido/i);
  await assert.rejects(() => WebRunnerAdapter.execute({ documentType: "css", code: "@import 'https://example.com/a.css';" }), /não é permitido/i);
});
