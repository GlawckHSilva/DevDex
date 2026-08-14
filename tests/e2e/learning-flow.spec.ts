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
  return request.post("/api/character", { headers: userHeaders(userId), data: { archetype: "adventurer" } });
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
  await expect(page.getByRole("heading", { name: "Cidade da Lógica" })).toBeVisible();
  await expect(page.getByTestId("campaign-map")).toBeVisible();
  await expect(page.getByTestId("map-node-guardar-nome")).toHaveAttribute("aria-label", /Disponível/);
  await page.goto("/missoes/guardar-nome");
  await expect(page.getByTestId("battle-workspace")).toBeVisible();
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

test("percorre trilha, conclui missão e persiste apó novo login", async ({ browser, page, request }) => {
  const userId = "journey-user";
  await chooseCharacter(request, userId);
  await page.setExtraHTTPHeaders(userHeaders(userId));
  await page.goto("/dashboard");
  await expect(page.getByText("0 XP", { exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Cidade da Lógica" }).first()).toBeVisible();

  await page.goto("/trilhas/javascript-fundamentals");
  await expect(page.getByRole("heading", { name: "Cidade da Lógica" })).toBeVisible();
  await expect(page.getByRole("button", { name: /Bloqueada/ })).toHaveCount(5);

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
  await expect(page.getByTestId("map-player")).toHaveAttribute("style", /left:\s*8%/);
  await expect(async () => { await locked.click(); await expect(locked).toHaveAttribute("aria-pressed", "true"); }).toPass();
  await expect(page.getByTestId("mission-panel").getByRole("button")).toBeDisabled();
  await variables.click();
  await expect(page.getByTestId("mission-panel").getByRole("link", { name: /JOGAR/ })).toHaveAttribute("href", "/missoes/guardar-nome");
  expect((await submit(request, userId, "guardar-nome", solution)).status()).toBe(200);
  await page.reload();
  await expect(variables).toHaveAttribute("aria-label", /Concluída/);
  await expect(locked).toHaveAttribute("aria-label", /Disponível/);
  await expect(page.getByTestId("map-player")).toHaveAttribute("style", /left:\s*39%/);
  await variables.click();
  await expect(page.getByTestId("mission-panel").getByRole("link", { name: /REVISAR/ })).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.getByTestId("campaign-map")).toBeVisible();
  await expect(variables).toBeVisible();
});

test("abre o Project Mode seguro como boss da zona JavaScript", async ({ page, request }) => {
  const userId = "campaign-boss-user";
  await chooseCharacter(request, userId);
  for (const [slug, code] of javascriptSolutions) expect((await submit(request, userId, slug, code)).status()).toBe(200);
  await page.setExtraHTTPHeaders(userHeaders(userId));
  await page.goto("/trilhas/javascript-fundamentals");
  await page.getByTestId("map-node-boss-project").click();
  await page.getByTestId("mission-panel").getByRole("link", { name: /JOGAR/ }).click();
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
  const userId = "web-ui-user";
  await chooseCharacter(request, userId);
  await page.setExtraHTTPHeaders(userHeaders(userId));
  await page.goto("/trilhas/html-fundamentals");
  await expect(page.getByRole("heading", { name: "Crônicas da Estrutura" })).toBeVisible();
  await page.goto("/missoes/pagina-da-oficina");
  await expect(page.getByTestId("web-editor")).toBeVisible();
  await expect(page.locator(".battle-arena")).toHaveAttribute("style", /ruinas-da-estrutura-v1/);
  await expect(page.getByText("Espectro do Esqueleto", { exact: true })).toBeVisible();
  await expect(page.getByTestId("enemy-hp")).toContainText("100 / 100 HP");
  await expect(page.getByLabel("3 vidas restantes")).toBeVisible();
  await expect(page.getByRole("link", { name: /Voltar ao mapa/ })).toHaveAttribute("href", "/trilhas/html-fundamentals");
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
  await expect(page.getByLabel("3 vidas restantes")).toBeVisible();
  await page.getByRole("button", { name: /Atacar com a solução/ }).click();
  await expect(page.getByLabel("3 vidas restantes")).toBeVisible();
  await expect(page.getByTestId("battle-panel")).toHaveClass(/hit-enemy/);
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.getByTestId("battle-panel")).toBeVisible();
  await expect(page.getByRole("button", { name: /Atacar com a solução/ })).toBeVisible();
  await page.setViewportSize({ width: 1280, height: 900 });

  const unsafe = await submit(request, "web-unsafe", "pagina-da-oficina", "<script>alert(1)</script>");
  expect(unsafe.status()).toBe(422);
  const wrong = await submit(request, "web-wrong", "pagina-da-oficina", "<h2>Oficina DevDex</h2>");
  expect(wrong.status()).toBe(200);
  expect(await wrong.json()).toMatchObject({ ok: false, gainedXp: 0 });

  const html = await submit(request, userId, "pagina-da-oficina", "<main><h1>Oficina DevDex</h1><p>Aprenda código na prática.</p></main>");
  expect(await html.json()).toMatchObject({ ok: true, gainedXp: 100, unlockedSlug: "navegacao-da-oficina" });

  await page.goto("/missoes/cores-do-cartao");
  await expect(page.getByTestId("web-editor")).toBeVisible();
  const css = await submit(request, userId, "cores-do-cartao", ".card { color: #f8fafc; background-color: #0f172a; }");
  expect(await css.json()).toMatchObject({ ok: true, gainedXp: 100, unlockedSlug: "espaco-do-cartao" });
  await page.goto("/dashboard");
  await expect(page.getByText("200 XP", { exact: true })).toBeVisible();
  await expect(page.locator(".campaign-card", { hasText: "Cidade da Lógica" }).getByText("0%", { exact: true })).toBeVisible();
  await expect(page.locator(".campaign-card", { hasText: "Minas dos Dados" }).getByText("0%", { exact: true })).toBeVisible();
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
