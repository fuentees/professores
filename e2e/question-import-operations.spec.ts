import { expect, test } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";

process.loadEnvFile?.(".env");

test("administrador encontra relatório, cobertura e modelo Word", async ({ page }) => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  test.skip(!url || !serviceKey, "Credenciais de teste do Supabase não configuradas.");

  const supabase = createClient(url!, serviceKey!, { auth: { persistSession: false } });
  const { data: profiles } = await supabase
    .from("profiles")
    .select("auth_user_id")
    .eq("role", "admin")
    .eq("status", "active")
    .limit(1);
  test.skip(!profiles?.[0], "Nenhum administrador ativo disponível para o teste.");

  const { data: userData } = await supabase.auth.admin.getUserById(profiles![0].auth_user_id);
  const email = userData.user?.email;
  test.skip(!email, "Administrador de teste sem e-mail.");
  const { data: linkData } = await supabase.auth.admin.generateLink({ type: "magiclink", email: email! });
  const tokenHash = linkData.properties?.hashed_token;
  expect(tokenHash).toBeTruthy();

  await page.goto(`/auth/confirm?token_hash=${encodeURIComponent(tokenHash!)}&type=magiclink&next=/admin/questoes/importacoes`);
  await expect(page).toHaveURL(/\/admin\/questoes\/importacoes$/);
  await expect(page.getByRole("heading", { name: "Importações" })).toBeVisible();
  await expect(page.getByText("Prontas para aprovar")).toBeVisible();
  await expect(page.getByRole("button", { name: /Modelo Word/ })).toBeVisible();
  await expect(page.getByRole("columnheader", { name: "Relatório" })).toBeVisible();

  const template = await page.request.get("/api/admin/modelo-questao-word");
  expect(template.ok()).toBe(true);
  expect(template.headers()["content-type"]).toContain("wordprocessingml.document");
  expect((await template.body()).byteLength).toBeGreaterThan(5_000);

  const { data: sampleImport } = await supabase
    .from("question_imports")
    .select("id")
    .not("question_id", "is", null)
    .limit(1)
    .maybeSingle();
  if (sampleImport) {
    await page.goto(`/admin/questoes/importacoes/${sampleImport.id}`);
    await expect(page.getByRole("heading", { name: "Revisar importação" })).toBeVisible();
    await expect(page.getByText("Dados pedagógicos")).toBeVisible();
  }

  await page.goto("/admin/questoes/cobertura");
  await expect(page.getByRole("heading", { name: "Cobertura do banco de questões" })).toBeVisible();
  await expect(page.getByRole("columnheader", { name: "Com BNCC" })).toBeVisible();
  await expect(page.getByRole("columnheader", { name: "Situação" })).toBeVisible();
});
