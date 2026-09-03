import { expect, test } from "@playwright/test";

test.describe("landing DevDex", () => {
  test("apresenta a jornada e CTAs no desktop", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto("/");

    await expect(page.getByRole("heading", { level: 1 })).toContainText("Aprenda programação");
    await expect(page.getByRole("link", { name: /Começar grátis/ }).first()).toHaveAttribute("href", /signin-with-chatgpt/);
    await expect(page.getByRole("link", { name: /Testar um desafio/ })).toHaveAttribute("href", /html-fundamentals/);
    await expect(page.getByText("3", { exact: true }).first()).toBeVisible();
    await expect(page.getByText("7 dias")).toBeVisible();
    await expect(page.getByText("2 dicas")).toBeVisible();
    expect(await page.locator(".landing-hero").evaluate((hero) => getComputedStyle(hero, "::before").animationName)).toBe("landingAuroraPrimary");

    await page.getByRole("link", { name: "Jornada", exact: true }).click();
    await expect(page).toHaveURL(/#jornada$/);
    await expect(page.getByRole("heading", { name: "Seu mapa de aprendizado" })).toBeVisible();
    await expect(page.getByText("Todos os caminhos estão disponíveis desde o início.")).toBeVisible();
    await expect(page.locator(".path-step.available")).toHaveCount(6);
    await expect(page.locator(".path-lock, .path-step.locked")).toHaveCount(0);
    await expect(page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).resolves.toBe(true);
    expect(errors).toEqual([]);
  });

  test("adapta a aurora e o conteúdo ao tablet", async ({ page }) => {
    await page.setViewportSize({ width: 820, height: 1180 });
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.getByRole("link", { name: /Começar grátis/ }).first()).toBeVisible();
    await expect(page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).resolves.toBe(true);
    await page.emulateMedia({ reducedMotion: "reduce" });
    expect(await page.locator(".landing-hero").evaluate((hero) => getComputedStyle(hero, "::before").animationName)).toBe("none");
  });

  test("mantém CTAs e conteúdo utilizáveis no mobile", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");

    await expect(page.getByRole("link", { name: /Começar grátis/ }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: /Testar um desafio/ })).toBeVisible();
    await expect(page.getByText("MISSÃO ATUAL")).toBeVisible();
    await page.locator("#jornada").scrollIntoViewIfNeeded();
    await expect(page.locator(".path-step.available")).toHaveCount(6);
    await expect(page.getByRole("link", { name: /Python Engenharia/ })).toBeVisible();
    await page.locator("#projetos").scrollIntoViewIfNeeded();
    await expect(page.getByRole("heading", { name: /Construa algo/ })).toBeVisible();
    await expect(page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).resolves.toBe(true);
    expect(await page.locator(".landing-hero").evaluate((hero) => getComputedStyle(hero, "::after").display)).toBe("none");
    expect(errors).toEqual([]);
  });
});
