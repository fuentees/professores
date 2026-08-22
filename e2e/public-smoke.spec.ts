import { test, expect } from "@playwright/test";

/**
 * Fumaça pública — cada rota abaixo precisa responder 200, mostrar um
 * heading real (nada de tela em branco/erro silencioso) e não gerar
 * nenhum erro de console. Não requer login nem segredos.
 */
const PUBLIC_ROUTES: { path: string; heading: string | RegExp }[] = [
  { path: "/", heading: /recursos que transformam a sua próxima aula/i },
  { path: "/buscar", heading: /Encontre tudo em um só lugar/i },
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
    await expect(page.locator("[data-brand-accent]"), `barra da marca em ${route.path}`).toBeVisible();
    await expect(page.getByRole("heading", { level: 1, name: route.heading })).toBeVisible();
    expect(errors, `erros de JS em ${route.path}`).toEqual([]);
  });
}

test("/forum sem login redireciona pra /entrar (área exige conta ativa)", async ({ page }) => {
  await page.goto("/forum");
  await expect(page).toHaveURL(/\/entrar/);
  await expect(page.locator("[data-brand-accent]")).toBeVisible();
  await expect(page.getByRole("link", { name: "Portal do Professor" })).toBeVisible();
});

for (const path of ["/entrar", "/cadastro", "/recuperar-senha", "/redefinir-senha"]) {
  test(`${path} mantém a identidade visual`, async ({ page }) => {
    await page.goto(path);
    await expect(page.locator("[data-brand-accent]")).toBeVisible();
    await expect(page.getByRole("link", { name: "Portal do Professor" })).toBeVisible();
  });
}

test("sitemap.xml e robots.txt respondem", async ({ request }) => {
  const sitemap = await request.get("/sitemap.xml");
  expect(sitemap.ok()).toBeTruthy();
  expect(await sitemap.text()).toContain("<urlset");

  const robots = await request.get("/robots.txt");
  expect(robots.ok()).toBeTruthy();
  expect(await robots.text()).toContain("Sitemap:");
});

test("health check confirma que o serviço está configurado", async ({ request }) => {
  const response = await request.get("/api/health");
  expect(response.status()).toBe(200);
  await expect(response.json()).resolves.toMatchObject({ status: "ok", service: "portal-do-professor" });
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

test("menu principal destaca a busca e mantém só áreas úteis na Biblioteca", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("header").getByRole("link", { name: "Buscar", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Biblioteca" }).click();
  const biblioteca = page.getByRole("menu", { name: "Biblioteca" });
  await expect(biblioteca.getByRole("menuitem", { name: "Materiais", exact: true })).toBeVisible();
  await expect(biblioteca.getByRole("menuitem", { name: "BNCC", exact: true })).toBeVisible();
  await expect(biblioteca.getByRole("menuitem", { name: "Pastas e coleções", exact: true })).toHaveCount(0);
});

test("menu destaca a página e o grupo atuais", async ({ page }) => {
  await page.goto("/materiais");
  await expect(page.getByRole("button", { name: "Biblioteca" })).toHaveAttribute("aria-current", "page");

  await page.goto("/objetos");
  await expect(page.getByRole("link", { name: "Recursos interativos", exact: true }).first()).toHaveAttribute(
    "aria-current",
    "page",
  );
});

test("materiais usa uma única classificação com quatro finalidades", async ({ page }) => {
  await page.goto("/materiais");

  await expect(page.getByRole("navigation", { name: "Tipos de material" })).toHaveCount(0);
  await page.getByRole("combobox", { name: "Filtrar por finalidade do material" }).click();

  for (const name of ["Atividade", "Avaliação", "Planejamento", "Material de apoio"]) {
    await expect(page.getByRole("option", { name, exact: true })).toBeVisible();
  }
  await expect(page.getByRole("option", { name: "Gabarito", exact: true })).toHaveCount(0);
  await expect(page.getByRole("option", { name: "Prova", exact: true })).toHaveCount(0);
});

test("menu móvel repete a hierarquia e inclui Início", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/materiais");
  await page.getByRole("button", { name: "Abrir menu" }).click();

  const mobileNav = page.getByRole("navigation", { name: "Navegação móvel" });
  await expect(mobileNav.getByRole("link", { name: "Início" })).toBeVisible();
  await expect(mobileNav.getByRole("link", { name: "Buscar" })).toBeVisible();
  await expect(mobileNav.getByText("Biblioteca", { exact: true })).toBeVisible();
  await expect(mobileNav.getByRole("link", { name: "Materiais", exact: true })).toBeVisible();
  await expect(mobileNav.getByRole("link", { name: "Pastas e coleções", exact: true })).toHaveCount(0);
});

test("busca inicial encontra recursos em todo o portal", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("textbox", { name: "O que você quer ensinar hoje?" }).fill("frações");
  await page.getByRole("button", { name: "Buscar" }).click();

  await expect(page).toHaveURL(/\/buscar\?q=fra/);
  await expect(page.getByRole("heading", { name: "Recursos interativos", exact: false })).toBeVisible();
  await expect(page.getByRole("link", { name: /Simulador de Frações/i }).first()).toBeVisible();
  await expect(page.getByText("Busque também no banco de questões")).toBeVisible();
});

test.describe("mobile (375px) — sem scroll horizontal", () => {
  test.use({ viewport: { width: 375, height: 812 } });

  for (const path of ["/", "/buscar?q=frações", "/materiais", "/blog", "/termos", "/entrar"]) {
    test(`${path} não estoura a largura da viewport`, async ({ page }) => {
      await page.goto(path);
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow, `${path} tem ${overflow}px de overflow horizontal`).toBeLessThanOrEqual(1);
    });
  }
});
