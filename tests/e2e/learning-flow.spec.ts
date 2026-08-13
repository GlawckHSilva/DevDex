import { expect, test, type APIRequestContext } from "@playwright/test";

const userHeaders = (id: string) => ({
  "oai-authenticated-user-id": id,
  "oai-authenticated-user-email": `${id}@example.test`,
  "oai-authenticated-user-full-name": encodeURIComponent(`Aluno ${id}`),
  "oai-authenticated-user-full-name-encoding": "percent-encoded-utf-8",
});
const solution = `function criarSaudacao(nome) { return \`Olá, ${"${nome}"}!\`; }`;

async function submit(request: APIRequestContext, userId: string, slug: string, code: string) {
  return request.post(`/api/missions/${slug}/submit`, {
    headers: userHeaders(userId),
    data: { mode: "test", code },
  });
}

test("protege rotas sem sessão", async ({ request }) => {
  const response = await request.get("/dashboard", { maxRedirects: 0 });
  expect(response.status()).toBe(307);
  expect(response.headers().location).toContain("/signin-with-chatgpt");
});

test("percorre trilha, conclui missão e persiste apó novo login", async ({ browser, page, request }) => {
  const userId = "journey-user";
  await page.setExtraHTTPHeaders(userHeaders(userId));
  await page.goto("/dashboard");
  await expect(page.getByText("0 XP", { exact: true })).toBeVisible();
  await expect(page.getByText("O nome do aventureiro")).toBeVisible();

  await page.goto("/trilhas/javascript-fundamentals");
  await expect(page.getByRole("heading", { name: "JavaScript Fundamentals" })).toBeVisible();
  await expect(page.getByText("Bloqueada")).toHaveCount(4);

  await page.goto("/missoes/guardar-nome");
  await expect(page.getByTestId("code-editor")).toBeVisible();
  const response = await submit(request, userId, "guardar-nome", solution);
  expect(response.status()).toBe(200);
  const result = await response.json();
  expect(result).toMatchObject({ ok: true, gainedXp: 100, totalXp: 100, unlockedSlug: "verificar-maioridade" });
  expect(JSON.stringify(result)).not.toMatch(/saúda|Ana|expected|input/i);
  expect(result.results).toEqual([{ name: "Teste 1", passed: true }, { name: "Teste 2", passed: true }]);

  const relogin = await browser.newContext({ extraHTTPHeaders: userHeaders(userId) });
  const restored = await relogin.newPage();
  await restored.goto("/dashboard");
  await expect(restored.getByText("100 XP", { exact: true })).toBeVisible();
  await restored.goto("/trilhas/javascript-fundamentals");
  await expect(restored.getByText("Revisar →")).toBeVisible();
  await expect(restored.getByText("Começar →")).toBeVisible();
  await relogin.close();
});

test("impede atalho, falha sem XP e isola usuários", async ({ page, request }) => {
  const locked = await submit(request, "locked-user", "verificar-maioridade", "function podeEntrar() { return true; }");
  expect(locked.status()).toBe(403);

  const failed = await submit(request, "failed-user", "guardar-nome", "function criarSaudacao() { return ''; }");
  expect(failed.status()).toBe(200);
  expect(await failed.json()).toMatchObject({ ok: false, gainedXp: 0 });
  await page.setExtraHTTPHeaders(userHeaders("failed-user"));
  await page.goto("/dashboard");
  await expect(page.getByText("0 XP", { exact: true })).toBeVisible();

  await page.setExtraHTTPHeaders(userHeaders("isolated-user"));
  await page.goto("/dashboard");
  await expect(page.getByText("0 XP", { exact: true })).toBeVisible();
});

test("credita XP uma vez sob repetição e concorrência", async ({ page, request }) => {
  for (let index = 0; index < 20; index += 1) {
    const response = await submit(request, "repeat-user", "guardar-nome", solution);
    expect(response.status()).toBe(200);
  }
  await page.setExtraHTTPHeaders(userHeaders("repeat-user"));
  await page.goto("/dashboard");
  await expect(page.getByText("100 XP", { exact: true })).toBeVisible();

  const responses = await Promise.all([
    submit(request, "concurrent-user", "guardar-nome", solution),
    submit(request, "concurrent-user", "guardar-nome", solution),
  ]);
  expect(responses.every((response) => response.status() === 200)).toBe(true);
  await page.setExtraHTTPHeaders(userHeaders("concurrent-user"));
  await page.goto("/dashboard");
  await expect(page.getByText("100 XP", { exact: true })).toBeVisible();
});

test("executa SQLite/Wasm descartável sem misturar progresso", async ({ page, request }) => {
  const correct = "SELECT ID, DESCRICAO, VALOR, ATIVO FROM PRODUTOS";
  await page.setExtraHTTPHeaders(userHeaders("sql-ui-user"));
  await page.goto("/trilhas/sql-fundamentals-sqlite");
  await expect(page.getByRole("heading", { name: "SQL Fundamentals · SQLite" })).toBeVisible();
  await page.goto("/missoes/listar-produtos");
  await expect(page.getByTestId("sql-editor")).toBeVisible();
  await expect(page.getByText(/PRODUTOS/).first()).toBeVisible();

  const cases = [
    { id: "sql-syntax", query: "SELECT FROM PRODUTOS", status: 422, message: /syntax error/i },
    { id: "sql-table", query: "SELECT * FROM CLIENTES", status: 422, message: /no such table/i },
    { id: "sql-column", query: "SELECT NOMEE FROM PRODUTOS", status: 422, message: /coluna NOMEE não existe/i },
    { id: "sql-wrong", query: "SELECT * FROM PRODUTOS WHERE ID=1", status: 200, message: /ainda não corresponde/i },
    { id: "sql-multiple", query: "SELECT * FROM PRODUTOS; SELECT 1", status: 422, message: /somente um statement/i },
  ];
  for (const item of cases) {
    const response = await submit(request, item.id, "listar-produtos", item.query);
    expect(response.status()).toBe(item.status);
    expect((await response.json()).message).toMatch(item.message);
  }

  for (let index = 0; index < 20; index += 1) expect((await submit(request, "sql-repeat", "listar-produtos", correct)).status()).toBe(200);
  const concurrent = await Promise.all([submit(request, "sql-concurrent", "listar-produtos", correct), submit(request, "sql-concurrent", "listar-produtos", correct)]);
  expect(concurrent.every((response) => response.status() === 200)).toBe(true);

  await page.setExtraHTTPHeaders(userHeaders("sql-repeat"));
  await page.goto("/dashboard");
  await expect(page.getByText("100 XP", { exact: true })).toBeVisible();
  await page.setExtraHTTPHeaders(userHeaders("sql-isolated"));
  await page.goto("/dashboard");
  await expect(page.getByText("0 XP", { exact: true })).toBeVisible();
});
