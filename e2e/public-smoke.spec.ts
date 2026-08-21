import { test, expect } from "@playwright/test";

/**
 * Fumaça pública — cada rota abaixo precisa responder 200, mostrar um
 * heading real (nada de tela em branco/erro silencioso) e não gerar
 * nenhum erro de console. Não requer login nem segredos.
 */
const PUBLIC_ROUTES: { path: string; heading: string | RegExp }[] = [
  { path: "/", heading: /próxima aula começa aqui/i },
  { path: "/materiais", heading: "Materiais" },
  { path: "/pastas", heading: /Pastas/i },
  { path: "/objetos", heading: /Jogos, quizzes e simulações/i },
  { path: "/cursos", heading: /Cursos/i },
  { path: "/bncc", heading: /BNCC/i },
  { path: "/blog", heading: "Blog" },
  { path: "/planos", heading: /Planos/i },
  { path: "/termos", heading: "Termos de Uso" },
  { path: "/privacidade", heading: "Política de Privacidade" },
];

for (const route of PUBLIC_ROUTES) {
  test(`${route.path} carrega e mostra o título esperado`, async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (err) => errors.push(err.message));

    const response = await page.goto(route.path);
    expect(response?.status(), `status HTTP de ${route.path}`).toBeLessThan(400);
    await expect(page.getByRole("heading", { level: 1, name: route.heading })).toBeVisible();
    expect(errors, `erros de JS em ${route.path}`).toEqual([]);
  });
}

test("/forum sem login redireciona pra /entrar (área exige conta ativa)", async ({ page }) => {
  await page.goto("/forum");
  await expect(page).toHaveURL(/\/entrar/);
});

test("sitemap.xml e robots.txt respondem", async ({ request }) => {
  const sitemap = await request.get("/sitemap.xml");
  expect(sitemap.ok()).toBeTruthy();
  expect(await sitemap.text()).toContain("<urlset");

  const robots = await request.get("/robots.txt");
  expect(robots.ok()).toBeTruthy();
  expect(await robots.text()).toContain("Sitemap:");
});

test("rota inexistente mostra a página 404 customizada, não um erro cru", async ({ page }) => {
  const response = await page.goto("/esta-rota-nao-existe-de-verdade");
  expect(response?.status()).toBe(404);
  await expect(page.locator("body")).not.toContainText("Application error");
});

test("navegação principal do header público leva pra Cursos", async ({ page }) => {
  await page.goto("/");
  await page.locator("header").getByRole("link", { name: "Cursos", exact: true }).click();
  await expect(page).toHaveURL(/\/cursos/);
  await expect(page.getByRole("heading", { level: 1, name: /Cursos/i })).toBeVisible();
});

test("menu 'Explorar' do header abre e mostra o link pra Materiais", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Explorar" }).click();
  await expect(page.getByRole("link", { name: "Materiais", exact: true })).toBeVisible();
});

test.describe("mobile (375px) — sem scroll horizontal", () => {
  test.use({ viewport: { width: 375, height: 812 } });

  for (const path of ["/", "/materiais", "/blog", "/termos"]) {
    test(`${path} não estoura a largura da viewport`, async ({ page }) => {
      await page.goto(path);
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow, `${path} tem ${overflow}px de overflow horizontal`).toBeLessThanOrEqual(1);
    });
  }
});
