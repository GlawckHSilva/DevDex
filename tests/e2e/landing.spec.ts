import { expect, test } from "@playwright/test";

test.describe("landing DevDex", () => {
  test("apresenta a jornada e CTAs no desktop", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto("/");

    await expect(page.getByRole("heading", { level: 1 })).toContainText("Aprenda programação");
    await expect(page.getByRole("link", { name: /Começar grátis/ }).first()).toHaveAttribute("href", /signin-with-chatgpt/);
    await expect(page.getByRole("link", { name: /Testar um desafio/ })).toHaveAttribute("href", /html-fundamentals/);
    await expect(page.getByText("3", { exact: true }).first()).toBeVisible();
    await expect(page.getByText("7 dias")).toBeVisible();
    await expect(page.getByText("2 dicas")).toBeVisible();

    await page.getByRole("link", { name: "Jornada", exact: true }).click();
    await expect(page).toHaveURL(/#jornada$/);
    await expect(page.getByRole("heading", { name: /Cada vitória libera/ })).toBeVisible();
    await expect(page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).resolves.toBe(true);
  });

  test("mantém CTAs e conteúdo utilizáveis no mobile", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");

    await expect(page.getByRole("link", { name: /Começar grátis/ }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: /Testar um desafio/ })).toBeVisible();
    await expect(page.getByText("MISSÃO ATUAL")).toBeVisible();
    await page.locator("#projetos").scrollIntoViewIfNeeded();
    await expect(page.getByRole("heading", { name: /Construa algo/ })).toBeVisible();
    await expect(page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).resolves.toBe(true);
  });
});
