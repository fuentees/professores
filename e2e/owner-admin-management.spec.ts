import { expect, test } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";

process.loadEnvFile?.(".env");

test("proprietário cria, rebaixa e promove admin sem confirmação por e-mail", async ({ page, browser }) => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  test.skip(!url || !serviceKey, "Credenciais de teste do Supabase não configuradas.");

  const supabase = createClient(url!, serviceKey!, { auth: { persistSession: false } });
  const { data: owners } = await supabase
    .from("profiles")
    .select("auth_user_id")
    .eq("role", "admin")
    .eq("status", "active")
    .eq("is_owner", true)
    .limit(1);
  test.skip(!owners?.[0], "Nenhum proprietário ativo disponível para o teste.");

  const { data: ownerData } = await supabase.auth.admin.getUserById(owners![0].auth_user_id);
  const ownerEmail = ownerData.user?.email;
  test.skip(!ownerEmail, "Proprietário de teste sem e-mail.");

  const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
    type: "magiclink",
    email: ownerEmail!,
  });
  expect(linkError).toBeNull();
  const tokenHash = linkData.properties?.hashed_token;
  expect(tokenHash).toBeTruthy();

  const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const temporaryEmail = `e2e-admin-${suffix}@example.test`;
  const temporaryName = "Professora Teste de Permissão";
  const temporaryPassword = `Teste-${suffix}-A1!`;
  let createdUserId: string | undefined;

  try {
    await page.goto(
      `/auth/confirm?token_hash=${encodeURIComponent(tokenHash!)}&type=magiclink&next=/dono/administradores`,
    );
    await expect(page).toHaveURL(/\/dono\/administradores$/);
    await expect(page.getByRole("heading", { name: "Administradores", exact: true })).toBeVisible();

    await page.getByLabel("Nome completo").fill(temporaryName);
    await page.getByLabel("E-mail de acesso").fill(temporaryEmail);
    await page.getByLabel("Senha temporária", { exact: true }).fill(temporaryPassword);
    await page.getByLabel("Confirmar senha temporária").fill(temporaryPassword);
    await page.getByRole("button", { name: "Criar administrador" }).click();

    const { data: createdProfile } = await supabase
      .from("profiles")
      .select("auth_user_id")
      .eq("email", temporaryEmail)
      .maybeSingle();
    createdUserId = createdProfile?.auth_user_id;

    let accountRow = page.getByRole("row").filter({ hasText: temporaryEmail });
    await expect(accountRow.getByText("Admin de conteúdo")).toBeVisible();

    const adminContext = await browser.newContext({ baseURL: "http://localhost:3000" });
    const adminPage = await adminContext.newPage();
    await adminPage.goto("/entrar?redirect=/admin");
    await adminPage.getByLabel("E-mail").fill(temporaryEmail);
    await adminPage.getByLabel("Senha").fill(temporaryPassword);
    await adminPage.getByRole("button", { name: "Entrar" }).click();
    await expect(adminPage).toHaveURL(/\/admin$/);
    await expect(adminPage.getByText("Painel administrativo — gestão de conteúdo")).toBeVisible();
    await adminContext.close();

    await accountRow.getByRole("button", { name: "Rebaixar a professor" }).click();
    await expect(page.getByRole("alertdialog")).toContainText(temporaryName);
    await page.getByRole("button", { name: "Confirmar rebaixamento" }).click();

    accountRow = page.getByRole("row").filter({ hasText: temporaryEmail });
    await expect(accountRow.getByText("Professor ativo")).toBeVisible();
    await accountRow.getByRole("button", { name: "Promover a admin" }).click();
    await page.getByRole("button", { name: "Confirmar promoção" }).click();
    await expect(page.getByRole("row").filter({ hasText: temporaryEmail }).getByText("Admin de conteúdo")).toBeVisible();
  } finally {
    if (!createdUserId) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("auth_user_id")
        .eq("email", temporaryEmail)
        .maybeSingle();
      createdUserId = profile?.auth_user_id;
    }
    if (createdUserId) await supabase.auth.admin.deleteUser(createdUserId);
  }
});
