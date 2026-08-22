import { expect, test } from "@playwright/test";

const ROUTES = [
  "/",
  "/buscar?q=frações",
  "/materiais",
  "/materiais/linha-do-tempo-mudancas-e-permanencias-na-comunidade",
  "/pastas",
  "/objetos",
  "/cursos",
  "/blog",
];

for (const route of ROUTES) {
  test(`${route} não gera avisos ou erros no console`, async ({ page }) => {
    const messages: string[] = [];
    page.on("console", (message) => {
      if (message.type() === "warning" || message.type() === "error") {
        messages.push(`${message.type()}: ${message.text()}`);
      }
    });

    await page.goto(route);
    await page.waitForLoadState("networkidle");
    expect(messages).toEqual([]);
  });
}

test("filtros de materiais permanecem controlados durante a navegação", async ({ page }) => {
  const messages: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "warning" || message.type() === "error") {
      messages.push(`${message.type()}: ${message.text()}`);
    }
  });

  await page.goto("/materiais");
  await page.getByRole("combobox", { name: "Filtrar por finalidade do material" }).click();
  await page.getByRole("option", { name: "Atividade", exact: true }).click();
  await expect(page).toHaveURL(/tipo=/);
  await page.waitForLoadState("networkidle");

  expect(messages).toEqual([]);
});
