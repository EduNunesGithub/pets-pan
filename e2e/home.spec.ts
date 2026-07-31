import { expect, test } from "@playwright/test";

test("home renderiza a lista de todos", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "Todo list" })).toBeVisible();
});
