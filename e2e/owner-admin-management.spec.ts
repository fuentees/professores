import { expect, test } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";

process.loadEnvFile?.(".env");

test("proprietário promove e rebaixa uma conta sem acessar o banco", async ({ page }) => {
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
  const { data: created, error: createError } = await supabase.auth.admin.createUser({
    email: temporaryEmail,
    password: `Teste-${suffix}-A1!`,
    email_confirm: true,
    user_metadata: { full_name: temporaryName },
  });
  expect(createError).toBeNull();
  expect(created.user).toBeTruthy();

  try {
    await page.goto(
      `/auth/confirm?token_hash=${encodeURIComponent(tokenHash!)}&type=magiclink&next=/dono/administradores`,
    );
    await expect(page).toHaveURL(/\/dono\/administradores$/);
    await expect(page.getByRole("heading", { name: "Administradores", exact: true })).toBeVisible();

    let accountRow = page.getByRole("row").filter({ hasText: temporaryEmail });
    await expect(accountRow.getByText("Professor ativo")).toBeVisible();
    await accountRow.getByRole("button", { name: "Promover a admin" }).click();
    await expect(page.getByRole("alertdialog")).toContainText(temporaryName);
    await page.getByRole("button", { name: "Confirmar promoção" }).click();

    accountRow = page.getByRole("row").filter({ hasText: temporaryEmail });
    await expect(accountRow.getByText("Admin de conteúdo")).toBeVisible();
    await accountRow.getByRole("button", { name: "Rebaixar a professor" }).click();
    await expect(page.getByRole("alertdialog")).toContainText(temporaryName);
    await page.getByRole("button", { name: "Confirmar rebaixamento" }).click();

    accountRow = page.getByRole("row").filter({ hasText: temporaryEmail });
    await expect(accountRow.getByText("Professor ativo")).toBeVisible();
    await expect(accountRow.getByRole("button", { name: "Promover a admin" })).toBeVisible();
  } finally {
    if (created.user) await supabase.auth.admin.deleteUser(created.user.id);
  }
});
