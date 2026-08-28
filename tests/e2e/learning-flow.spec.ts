import { expect, test, type APIRequestContext } from "@playwright/test";

const userHeaders = (id: string) => ({
  "oai-authenticated-user-id": id,
  "oai-authenticated-user-email": `${id}@example.test`,
  "oai-authenticated-user-full-name": encodeURIComponent(`Aluno ${id}`),
  "oai-authenticated-user-full-name-encoding": "percent-encoded-utf-8",
});
const solution = `function criarSaudacao(nome) { return \`Olá, ${"${nome}"}!\`; }`;
const javascriptSolutions = [
  ["guardar-nome", solution],
  ["verificar-maioridade", "function podeEntrar(idade) { return idade >= 18; }"],
  ["somar-lista", "function somarLista(valores) { return valores.reduce((total, valor) => total + valor, 0); }"],
  ["calcular-dobro", "function dobro(numero) { return numero * 2; }"],
  ["filtrar-pares", "function pares(valores) { return valores.filter((valor) => valor % 2 === 0); }"],
  ["operacoes-basicas", "function calcularOperacoes(a, b) { return { soma: a + b, produto: a * b }; }"],
  ["classificar-numero", "function classificarNumero(numero) { return numero > 0 ? 'positivo' : numero < 0 ? 'negativo' : 'zero'; }"],
  ["resumo-numerico", "function resumirNumeros(valores) { return valores.reduce((r, valor) => ({ soma: r.soma + valor, positivos: r.positivos + (valor > 0 ? 1 : 0) }), { soma: 0, positivos: 0 }); }"],
] as const;

async function submit(request: APIRequestContext, userId: string, slug: string, code: string) {
  return request.post(`/api/missions/${slug}/submit`, {
    headers: userHeaders(userId),
    data: { mode: "test", code },
  });
}

async function submitProject(request: APIRequestContext, userId: string, files: Record<string, string>) {
  return request.post("/api/projects/lista-de-tarefas/submit", { headers: userHeaders(userId), data: { mode: "test", files } });
}

async function chooseCharacter(request: APIRequestContext, userId: string) {
  const response = await request.post("/api/character", { headers: userHeaders(userId), data: { archetype: "adventurer" } });
  await Promise.all(["html-fundamentals", "css-fundamentals", "javascript-fundamentals", "sql-fundamentals-sqlite"].map((slug) => request.post(`/api/campaigns/${slug}/lore`, { headers: userHeaders(userId) })));
  return response;
}

test("protege rotas sem sessão", async ({ request }) => {
  expect((await request.get("/favicon.ico")).status()).toBe(200);
  const response = await request.get("/dashboard", { maxRedirects: 0 });
  expect(response.status()).toBe(307);
  expect(response.headers().location).toContain("/signin-with-chatgpt");
});

test("restringe métricas ao administrador", async ({ page }) => {
  await page.setExtraHTTPHeaders(userHeaders("regular-user"));
  await page.goto("/admin/metricas");
  await expect(page).toHaveURL(/\/dashboard$/);
  await page.setExtraHTTPHeaders(userHeaders("admin"));
  await page.goto("/admin/metricas");
  await expect(page.getByRole("heading", { name: "Métricas de aprendizagem" })).toBeVisible();
  await expect(page.getByText(/Nenhuma métrica armazena o código-fonte/)).toBeVisible();
});

test("abre dashboard, trilhas e Project Mode pelos links visíveis", async ({ page }) => {
  await page.setExtraHTTPHeaders(userHeaders("navigation-user"));
  await page.goto("/");
  await page.getByRole("link", { name: "Abrir plataforma" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  await page.getByRole("link", { name: /To-do App/ }).click();
  await expect(page).toHaveURL(/\/projetos\/lista-de-tarefas$/);
  await expect(page.getByTestId("project-editor")).toBeVisible();
  await page.getByRole("link", { name: "Dashboard" }).click();
  await page.getByRole("link", { name: "◇ HTML", exact: true }).click();
  await expect(page).toHaveURL(/\/trilhas\/html-fundamentals$/);
});

test("escolhe personagem e vence a primeira batalha com três vidas", async ({ page, request }) => {
  const userId = "rpg-user";
  const headers = userHeaders(userId);
  await page.setExtraHTTPHeaders(headers);
  await page.goto("/trilhas/javascript-fundamentals");
  await expect(page.getByTestId("character-select")).toBeVisible();
  const character = await request.post("/api/character", { headers, data: { archetype: "adventuress" } });
  expect(await character.json()).toMatchObject({ ok: true, character: { archetype: "adventuress" } });
  await page.goto("/trilhas/javascript-fundamentals");
  await expect(page.locator("h1", { hasText: "Cidade da Lógica" })).toBeVisible();
  await expect(page.getByTestId("campaign-map")).toBeVisible();
  await expect(page.getByTestId("map-node-guardar-nome")).toHaveAttribute("aria-label", /Disponível/);
  await page.goto("/missoes/guardar-nome");
  await expect(page.getByTestId("battle-workspace")).toBeVisible();
  await expect(page.locator(".battle-player .pixel-hero")).toHaveAttribute("style", /adventuress-female-v1/);
  await expect(page.getByLabel("3 vidas restantes")).toBeVisible();

  const action = (mode: "run" | "test" | "research" | "revive", code = "") => request.post("/api/missions/guardar-nome/submit", { headers, data: { mode, code } });
  const run = await action("run", "function criarSaudacao() { return ''; }");
  const runResult = await run.json();
  expect(runResult).toMatchObject({ ok: true, battle: { lives: 3, state: "active" } });
  expect(runResult.results).toHaveLength(2);
  expect(runResult.results.every((result: { passed: boolean }) => !result.passed)).toBe(true);
  const research = await action("research");
  expect(await research.json()).toMatchObject({ ok: true, battle: { lives: 3, state: "active" } });
  for (const lives of [2, 1, 0]) {
    const failed = await action("test", "function criarSaudacao() { return ''; }");
    expect(await failed.json()).toMatchObject({ ok: false, battle: { lives } });
  }
  expect((await action("test", solution)).status()).toBe(409);
  expect(await (await action("revive")).json()).toMatchObject({ ok: true, battle: { lives: 3, state: "active" } });
  expect(await (await action("test", solution)).json()).toMatchObject({ ok: true, gainedXp: 100, battle: { lives: 3, state: "completed" } });
  await page.goto("/trilhas/javascript-fundamentals");
  await expect(page.getByTestId("map-node-guardar-nome")).toHaveAttribute("aria-label", /Concluída/);
});

test("apresenta e persiste a transmissão de lore sem alterar progresso", async ({ page, request }) => {
  const userId = "campaign-lore-user";
  const headers = userHeaders(userId);
  await request.post("/api/character", { headers, data: { archetype: "adventurer" } });
  await page.setExtraHTTPHeaders(headers);
  await page.goto("/trilhas/html-fundamentals");
  const transmission = page.getByTestId("campaign-transmission");
  await expect(transmission).toBeVisible();
  await expect(transmission.getByText("TRANSMISSÃO RECEBIDA")).toBeVisible();
  await expect(transmission.getByText("HTML-STR-001")).toBeVisible();
  await transmission.getByRole("button", { name: "MOSTRAR TUDO" }).click();
  await expect(transmission.getByTestId("transmission-text")).toContainText("formulários caíram sob a corrupção");
  await expect(page.getByText("0 XP", { exact: true })).toBeVisible();
  const recorded = page.waitForResponse((response) => response.url().endsWith("/api/campaigns/html-fundamentals/lore") && response.status() === 200);
  await transmission.getByRole("button", { name: /INICIAR JORNADA/ }).click();
  await recorded;
  await expect(transmission).toHaveCount(0);
  await expect(page.getByTestId("map-node-pagina-da-oficina")).toHaveAttribute("aria-label", /Disponível/);
  await expect(page.getByTestId("map-node-navegacao-da-oficina")).toHaveAttribute("aria-label", /Bloqueada/);
  await page.reload();
  await expect(transmission).toHaveCount(0);
  await expect(page.getByText("0 XP", { exact: true })).toBeVisible();
  await page.getByTestId("campaign-prologue").click();
  await expect(transmission.getByTestId("transmission-text")).toContainText("O mundo digital perdeu sua estrutura");
  await transmission.getByRole("button", { name: /VOLTAR AO MAPA/ }).click();
  await page.goto("/trilhas/css-fundamentals");
  await expect(page.getByTestId("campaign-transmission").getByRole("heading", { name: "Reino dos Estilos" })).toBeVisible();
  await expect(page.getByTestId("campaign-transmission")).toContainText("Curadora Prism");
});

test("transmissão respeita redução de movimento", async ({ page, request }) => {
  const userId = "campaign-lore-reduced-motion";
  const headers = userHeaders(userId);
  await request.post("/api/character", { headers, data: { archetype: "adventurer" } });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setExtraHTTPHeaders(headers);
  await page.goto("/trilhas/sql-fundamentals-sqlite");
  const transmission = page.getByTestId("campaign-transmission");
  await expect(transmission.getByTestId("transmission-text")).toContainText("Registros essenciais foram fragmentados");
  await expect(transmission.locator(".transmission-cursor")).toHaveCount(0);
  await expect(transmission.getByRole("button", { name: /INICIAR JORNADA/ })).toBeVisible();
});

test("percorre trilha, conclui missão e persiste apó novo login", async ({ browser, page, request }) => {
  const userId = "journey-user";
  await chooseCharacter(request, userId);
  await page.setExtraHTTPHeaders(userHeaders(userId));
  await page.goto("/dashboard");
  await expect(page.getByText("0 XP", { exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Cidade da Lógica" }).first()).toBeVisible();

  await page.goto("/trilhas/javascript-fundamentals");
  await expect(page.getByRole("heading", { name: "Cidade da Lógica" })).toBeVisible();
  await expect(page.getByRole("button", { name: /Bloqueada/ })).toHaveCount(8);

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
  await expect(restored.getByTestId("map-node-guardar-nome")).toHaveAttribute("aria-label", /Concluída/);
  await expect(restored.getByTestId("map-node-verificar-maioridade")).toHaveAttribute("aria-label", /Disponível/);
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

test("alterna entre campanhas sem bloquear tecnologias independentes", async ({ page, request }) => {
  const userId = "campaign-switch-user";
  await chooseCharacter(request, userId);
  await page.setExtraHTTPHeaders(userHeaders(userId));
  for (const [path, title, theme] of [
    ["html-fundamentals", "Crônicas da Estrutura", "theme-structure-ruins"],
    ["sql-fundamentals-sqlite", "Minas dos Dados", "theme-data-mines"],
    ["javascript-fundamentals", "Cidade da Lógica", "theme-logic-city"],
    ["css-fundamentals", "Reino dos Estilos", "theme-style-realm"],
  ]) {
    await page.goto(`/trilhas/${path}`);
    await expect(page.getByRole("heading", { name: title })).toBeVisible();
    await expect(page.locator(`main.${theme}`)).toBeVisible();
    await expect(page.getByTestId("campaign-map")).toBeVisible();
  }
});

test("mapa usa progresso real, seleção contextual e trilha mobile", async ({ page, request }) => {
  const userId = "campaign-map-user";
  await chooseCharacter(request, userId);
  await page.setExtraHTTPHeaders(userHeaders(userId));
  await page.goto("/trilhas/javascript-fundamentals");
  await expect(page.locator(".game-sidebar")).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Voltar às campanhas" })).toBeVisible();
  const variables = page.getByTestId("map-node-guardar-nome");
  const locked = page.getByTestId("map-node-verificar-maioridade");
  await expect(page.getByTestId("map-player")).toHaveAttribute("style", /left:\s*7%/);
  await expect(page.locator(".path-desktop path")).toHaveCount(9);
  await expect(page.locator(".map-fog")).toBeVisible();
  await expect(page.getByTestId("map-node-boss-project")).toHaveClass(/type-boss.*state-locked/);
  await expect(async () => { await locked.click(); await expect(locked).toHaveAttribute("aria-pressed", "true"); }).toPass();
  await expect(page.getByTestId("mission-panel").getByRole("button")).toBeDisabled();
  await variables.click();
  await expect(page.getByTestId("mission-panel").getByRole("link", { name: /COMEÇAR AULA/ })).toHaveAttribute("href", "/missoes/guardar-nome");
  await expect(page.getByText("48 aulas explicativas · 48 práticas · 6 zonas · básico ao profissional")).toBeVisible();
  await expect(page.getByTestId("course-zone-6")).toBeVisible();
  await variables.focus();
  await page.keyboard.press("ArrowRight");
  await expect(locked).toBeFocused();
  expect((await submit(request, userId, "guardar-nome", solution)).status()).toBe(200);
  await page.reload();
  await expect(variables).toHaveAttribute("aria-label", /Concluída/);
  await expect(locked).toHaveAttribute("aria-label", /Disponível/);
  await expect(page.getByTestId("map-player")).toHaveAttribute("style", /left:\s*18%;top:\s*49%/);
  await variables.click();
  await expect(page.getByTestId("mission-panel").getByRole("link", { name: /REVISAR/ })).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.getByTestId("campaign-map")).toBeVisible();
  await expect(variables).toBeVisible();
  await expect(page.locator(".path-mobile")).toBeVisible();
  expect((await locked.boundingBox())!.y).toBeGreaterThan((await variables.boundingBox())!.y);
});

test("abre o Project Mode seguro como boss da zona JavaScript", async ({ page, request }) => {
  const userId = "campaign-boss-user";
  await chooseCharacter(request, userId);
  for (const [slug, code] of javascriptSolutions.slice(0, -1)) expect((await submit(request, userId, slug, code)).status()).toBe(200);
  await page.setExtraHTTPHeaders(userHeaders(userId));
  await page.goto("/trilhas/javascript-fundamentals");
  await expect(page.getByTestId("map-node-resumo-numerico")).toHaveClass(/type-boss.*state-available/);
  await expect(page.getByTestId("map-node-boss-project")).toHaveClass(/type-boss.*state-locked/);
  expect((await submit(request, userId, javascriptSolutions.at(-1)![0], javascriptSolutions.at(-1)![1])).status()).toBe(200);
  await page.reload();
  await expect(async () => {
    await page.getByTestId("course-zone-1").click();
    await expect(page.getByRole("heading", { name: /Zona 01/ })).toBeVisible();
  }).toPass();
  await page.getByTestId("map-node-boss-project").click();
  await page.getByTestId("mission-panel").getByRole("link", { name: /ENTRAR NO PROJETO/ }).click();
  await expect(page).toHaveURL(/\/projetos\/lista-de-tarefas\?campaign=javascript-fundamentals$/);
  await expect(page.getByText(/BOSS BATTLE · LISTA DE TAREFAS/)).toBeVisible();
  await expect(page.getByTitle("Preview do projeto")).toHaveAttribute("sandbox", "allow-scripts");
  expect(await page.getByTitle("Preview do projeto").getAttribute("srcdoc")).toContain("default-src 'none'");
});

test("executa SQLite/Wasm descartável sem misturar progresso", async ({ page, request }) => {
  const correct = "SELECT ID, DESCRICAO, VALOR, ATIVO FROM PRODUTOS";
  await chooseCharacter(request, "sql-ui-user");
  await page.setExtraHTTPHeaders(userHeaders("sql-ui-user"));
  await page.goto("/trilhas/sql-fundamentals-sqlite");
  await expect(page.getByRole("heading", { name: "Minas dos Dados" })).toBeVisible();
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

test("valida HTML/CSS e mantém o preview visual isolado", async ({ page, request }) => {
  test.setTimeout(60_000);
  const userId = "web-ui-user";
  await chooseCharacter(request, userId);
  await page.setExtraHTTPHeaders(userHeaders(userId));
  await page.goto("/trilhas/html-fundamentals");
  await expect(page.getByRole("heading", { name: "Crônicas da Estrutura" })).toBeVisible();
  await page.goto("/missoes/pagina-da-oficina");
  const study = page.getByTestId("study-material");
  await expect(study).toContainText("Títulos e parágrafos");
  await expect(study).toContainText("Portal da Guilda");
  await expect(study).not.toContainText("Oficina DevDex");
  await expect(study.getByRole("link", { name: /VOLTAR AO MAPA/ })).toHaveAttribute("href", "/trilhas/html-fundamentals");
  await expect(page.getByTestId("web-editor").locator(".monaco-editor")).toBeVisible();
  await page.getByTestId("start-battle").click();
  await expect(study).toBeHidden();
  await page.getByRole("button", { name: /Pesquisar uma dica/ }).click();
  await expect(study).toContainText("Títulos e parágrafos");
  await expect(page.getByLabel("3 vidas restantes")).toBeVisible();
  await expect(page.getByTestId("start-battle")).toContainText("VOLTAR À PRÁTICA");
  await page.getByTestId("start-battle").click();
  await expect(study).toBeHidden();
  await page.goto("/dashboard");
  await expect(page.getByText("0 XP", { exact: true })).toBeVisible();
  await page.goto("/missoes/pagina-da-oficina");
  await expect(study).toContainText("Títulos e parágrafos");
  await page.getByTestId("start-battle").click();
  await expect(study).toBeHidden();
  await expect(page.getByTestId("web-editor")).toBeVisible();
  await expect(page.locator(".battle-arena")).toHaveAttribute("style", /ruinas-da-estrutura-v1/);
  await expect(page.getByText("Espectro do Esqueleto", { exact: true })).toBeVisible();
  await expect(page.getByTestId("enemy-hp")).toContainText("100 / 100 HP");
  await expect(page.getByLabel("3 vidas restantes")).toBeVisible();
  await expect(page.getByRole("link", { name: /Voltar (?:para )?o mapa/ })).toHaveAttribute("href", "/trilhas/html-fundamentals");
  await expect(page.getByRole("button", { name: /Pesquisar uma dica/ })).toBeVisible();
  await expect(page.getByRole("button", { name: /Testar código/ })).toBeVisible();
  await expect(page.getByRole("button", { name: /Atacar com a solução/ })).toBeVisible();

  const preview = page.getByTitle("Preview da missão");
  await expect(preview).toHaveAttribute("sandbox", "");
  await expect(preview).toHaveAttribute("referrerpolicy", "no-referrer");
  expect(await preview.getAttribute("srcdoc")).toContain("default-src 'none'");

  await page.getByTestId("web-editor").locator(".monaco-editor").click();
  await page.keyboard.press("Control+A");
  await page.keyboard.insertText("<main><h1>Oficina DevDex</h1></main>");
  await page.getByRole("button", { name: /Testar código/ }).click();
  await expect(page.getByTestId("enemy-hp")).toContainText("50 / 100 HP");
  await expect(page.getByTestId("battle-panel")).toHaveClass(/hit-enemy/);
  await expect(page.locator(".battle-enemy img")).toHaveCSS("animation-name", "enemyDamageFlash");
  await expect(page.getByLabel("3 vidas restantes")).toBeVisible();
  await expect(page.getByTestId("battle-objectives").locator(".passed")).toHaveCount(1);
  await page.getByRole("button", { name: /Pesquisar uma dica/ }).click();
  await expect(study).toBeVisible();
  await expect(study).toContainText("1 · EXPLICAÇÃO");
  await expect(study).toContainText("2 · PRÁTICA");
  await page.getByTestId("start-battle").click();
  await expect(study).toBeHidden();
  await expect(page.getByLabel("3 vidas restantes")).toBeVisible();
  await page.getByRole("button", { name: /Atacar com a solução/ }).click();
  await expect(page.getByLabel("3 vidas restantes")).toBeVisible();
  await expect(page.getByTestId("battle-panel")).toHaveClass(/hit-enemy/);
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.getByTestId("battle-panel")).toBeVisible();
  await expect(page.getByRole("button", { name: /Atacar com a solução/ })).toBeVisible();
  await page.setViewportSize({ width: 1280, height: 900 });

  await page.getByTestId("web-editor").locator(".monaco-editor").click();
  await page.keyboard.press("Control+A");
  await page.keyboard.insertText("<main><h1>Oficina DevDex</h1><p>Aprenda código na prática.</p></main>");
  await page.getByRole("button", { name: /Atacar com a solução/ }).click();
  await expect(page.getByTestId("enemy-hp")).toContainText("0 / 100 HP");
  await expect(page.getByTestId("victory-sequence")).toContainText("INIMIGO DERROTADO");
  await expect(page.getByTestId("victory-sequence")).toContainText("CONCLUÍDO");
  await expect(page.getByTestId("victory-sequence")).toContainText("+100 XP");
  await expect(page.locator(".battle-enemy img")).toHaveCSS("animation-name", "enemyDefeated");
  await expect(page).toHaveURL(/\/trilhas\/html-fundamentals$/, { timeout: 5000 });
  await expect(page.getByTestId("map-unlock-toast")).toContainText("NOVA BATALHA DESBLOQUEADA");
  await expect(page.getByTestId("map-player")).toHaveClass(/arriving/);
  await expect(page.getByTestId("map-node-pagina-da-oficina")).toHaveAttribute("aria-label", /Concluída/);
  await expect(page.getByTestId("map-node-pagina-da-oficina")).toHaveClass(/state-completed/);
  await expect(page.getByTestId("map-node-navegacao-da-oficina")).toHaveAttribute("aria-label", /Disponível/);
  await expect(page.getByTestId("map-player")).toHaveAttribute("style", /left:\s*18%;top:\s*49%/);
  await page.goto("/missoes/navegacao-da-oficina");
  await expect(page.getByTestId("study-material")).toContainText("Navegação interna");
  await expect(page.getByTestId("study-material")).not.toContainText("Portal da Guilda");

  const unsafe = await submit(request, "web-unsafe", "pagina-da-oficina", "<script>alert(1)</script>");
  expect(unsafe.status()).toBe(422);
  const wrong = await submit(request, "web-wrong", "pagina-da-oficina", "<h2>Oficina DevDex</h2>");
  expect(wrong.status()).toBe(200);
  expect(await wrong.json()).toMatchObject({ ok: false, gainedXp: 0 });

  const review = await submit(request, userId, "pagina-da-oficina", "<main><h1>Oficina DevDex</h1><p>Aprenda código na prática.</p></main>");
  expect(await review.json()).toMatchObject({ ok: true, gainedXp: 0, newlyCompleted: false, unlockedSlug: "navegacao-da-oficina" });
  await page.goto("/missoes/pagina-da-oficina");
  await expect(page.getByTestId("study-material")).toContainText("Títulos e parágrafos");
  await page.getByTestId("start-battle").click();
  await expect(page.getByTestId("study-material")).toBeHidden();
  await expect(page.getByText("REPETIÇÃO · 0 XP")).toBeVisible();
  await expect(page.getByTestId("enemy-hp")).toContainText("100 / 100 HP");
  await expect(page.getByRole("button", { name: /Atacar com a solução/ })).toBeEnabled();
  await page.getByTestId("web-editor").locator(".monaco-editor").click();
  await page.keyboard.press("Control+A");
  await page.keyboard.insertText("<main><h1>Oficina DevDex</h1><p>Aprenda código na prática.</p></main>");
  await page.getByRole("button", { name: /Atacar com a solução/ }).click();
  await expect(page.locator(".battle-victory-banner")).toContainText("REVISÃO");
  await expect(page.locator(".reward-banner")).toHaveCount(0);
  await expect(page.getByTestId("victory-sequence")).toHaveCount(0);
  await page.waitForTimeout(2800);
  await expect(page).toHaveURL(/\/missoes\/pagina-da-oficina$/);

  await page.goto("/missoes/cores-do-cartao");
  await expect(page.getByTestId("web-editor")).toBeVisible();
  const css = await submit(request, userId, "cores-do-cartao", ".card { color: #f8fafc; background-color: #0f172a; }");
  expect(await css.json()).toMatchObject({ ok: true, gainedXp: 100, unlockedSlug: "espaco-do-cartao" });
  await page.goto("/dashboard");
  await expect(page.getByText("200 XP", { exact: true })).toBeVisible();
  await expect(page.locator(".campaign-card", { hasText: "Cidade da Lógica" }).getByText("0%", { exact: true })).toBeVisible();
  await expect(page.locator(".campaign-card", { hasText: "Minas dos Dados" }).getByText("0%", { exact: true })).toBeVisible();
});

test("backend ignora tentativa do frontend de forjar vitória e desbloqueio", async ({ page, request }) => {
  const userId = "forged-victory";
  await chooseCharacter(request, userId);
  const response = await request.post("/api/missions/pagina-da-oficina/submit", {
    headers: userHeaders(userId),
    data: { mode: "test", code: "<div>incompleto</div>", newlyCompleted: true, gainedXp: 9999, unlockedSlug: "navegacao-da-oficina", battle: { state: "completed" } },
  });
  expect(await response.json()).toMatchObject({ ok: false, gainedXp: 0, newlyCompleted: false, unlockedSlug: null, battle: { state: "active" } });
  await page.setExtraHTTPHeaders(userHeaders(userId));
  await page.goto("/trilhas/html-fundamentals");
  await expect(page.getByTestId("map-node-pagina-da-oficina")).toHaveAttribute("aria-label", /Em andamento/);
  await expect(page.getByTestId("map-node-navegacao-da-oficina")).toHaveAttribute("aria-label", /Bloqueada/);
});

test("constrói um To-do App em cinco etapas com autosave local", async ({ page, request }) => {
  const userId = "project-user";
  const files = {
    "index.html": '<main class="todo-app"><h1>Minha Lista</h1><form id="task-form"><input id="task-input" type="text"><button type="submit">Adicionar</button></form><ul id="task-list"></ul></main>',
    "style.css": ".todo-app { max-width: 480px; padding: 24px; background-color: #fff; border-radius: 16px; }",
    "script.js": `const form=document.getElementById("task-form"),input=document.getElementById("task-input"),list=document.getElementById("task-list");let tasks=JSON.parse(localStorage.getItem("tasks")||"[]");function save(){localStorage.setItem("tasks",JSON.stringify(tasks));}function render(text){const li=document.createElement("li");li.textContent=text;const button=document.createElement("button");button.addEventListener("click",()=>{li.remove();tasks=tasks.filter(task=>task!==text);save();});li.appendChild(button);list.appendChild(li);}tasks.forEach(render);form.addEventListener("submit",event=>{event.preventDefault();if(!input.value.trim())return;tasks.push(input.value);render(input.value);save();input.value="";});`,
  };
  await page.setExtraHTTPHeaders(userHeaders(userId));
  await page.goto("/projetos/lista-de-tarefas");
  await expect(page.getByTestId("project-editor")).toBeVisible();
  const preview = page.getByTitle("Preview do projeto");
  await expect(preview).toHaveAttribute("sandbox", "allow-scripts");
  expect(await preview.getAttribute("srcdoc")).toContain("default-src 'none'");
  await expect.poll(() => page.evaluate(() => localStorage.getItem("devdex:project:lista-de-tarefas:files:v1"))).not.toBeNull();

  const rewards = [100, 120, 140, 160, 200];
  for (const reward of rewards) {
    const response = await submitProject(request, userId, files);
    expect(response.status()).toBe(200);
    expect(await response.json()).toMatchObject({ ok: true, gainedXp: reward });
  }
  const repeated = await submitProject(request, userId, files);
  expect(await repeated.json()).toMatchObject({ ok: true, projectCompleted: true });

  await page.goto("/dashboard");
  await expect(page.locator("header").getByText("720 XP", { exact: true })).toBeVisible();
  await expect(page.getByText("🏆 CONCLUÍDO")).toBeVisible();
});
