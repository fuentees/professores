import { test, expect } from "@playwright/test";

test("alternar tema aplica a classe dark no <html> e persiste após recarregar", async ({ page }) => {
  await page.goto("/");
  const html = page.locator("html");
  await expect(html).not.toHaveClass(/dark/);

  await page.getByRole("button", { name: "Mudar para tema escuro" }).click();
  await expect(html).toHaveClass(/dark/);

  await page.reload();
  await expect(html).toHaveClass(/dark/);

  await page.getByRole("button", { name: "Mudar para tema claro" }).click();
  await expect(html).not.toHaveClass(/dark/);
});
