import { expect, test } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";

process.loadEnvFile?.(".env");

test("admin prepara o material como rascunho antes de publicar", async ({ page }) => {
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

  const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
    type: "magiclink",
    email: email!,
  });
  expect(linkError).toBeNull();
  const tokenHash = linkData.properties?.hashed_token;
  expect(tokenHash).toBeTruthy();

  const consoleMessages: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "warning" || message.type() === "error") {
      consoleMessages.push(`${message.type()}: ${message.text()}`);
    }
  });

  await page.goto(
    `/auth/confirm?token_hash=${encodeURIComponent(tokenHash!)}&type=magiclink&next=/admin/materiais/novo`,
  );
  await expect(page).toHaveURL(/\/admin\/materiais\/novo$/);
  await expect(page.getByRole("heading", { name: "Publicar novo material" })).toBeVisible();
  await expect(page.getByText("1. Anexe")).toBeVisible();
  await expect(page.getByRole("button", { name: /Importar questões Word/ })).toBeVisible();

  await page.getByRole("button", { name: "Criar rascunho e continuar" }).click();
  await expect(page.getByText("Revise os campos obrigatórios destacados.")).toBeVisible();
  await expect(page.getByText("Informe um título com pelo menos 3 caracteres.")).toBeVisible();

  await page.getByRole("tab", { name: "Classificação" }).click();
  await page.getByRole("combobox", { name: "Finalidade principal do material" }).click();
  await page.getByRole("option", { name: "Atividade", exact: true }).click();
  await page.getByRole("tab", { name: "Publicar" }).click();
  await expect(page.getByText("O material será criado como rascunho.")).toBeVisible();

  await page.goto("/admin/materiais/novo");
  await expect(page.getByRole("heading", { name: "Comece anexando o Word" })).toBeVisible();
  await page.locator("#materialWord").setInputFiles("test/fixtures/docx/geo4-001.docx");
  await expect(page.getByText("BNCC encontrada: EF04GE01, EF04GE02")).toBeVisible();
  await page.getByRole("tab", { name: "Classificação" }).click();
  await expect(page.getByRole("checkbox", { name: "4º ano", exact: true })).toBeChecked();
  await expect(page.getByRole("checkbox", { name: "Geografia", exact: true })).toBeChecked();
  await expect(page.getByRole("checkbox", { name: "Movimento", exact: true })).not.toBeChecked();
  await expect(page.getByRole("combobox", { name: "Finalidade principal do material" })).toContainText("Avaliação");

  await page.goto("/admin/materiais");
  await expect(page.getByRole("heading", { name: "Materiais", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: /Publicar material/ })).toBeVisible();
  await expect(page.getByRole("columnheader", { name: "Finalidade" })).toBeVisible();
  await expect(page.getByRole("columnheader", { name: "Arquivos" })).toBeVisible();

  await page.goto("/buscar?q=frações");
  await expect(page.getByText("Encontrar", { exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "Buscar no portal" })).toHaveAttribute("aria-current", "page");
  await expect(page.getByRole("link", { name: /Simulador de Frações/i }).first()).toBeVisible();
  expect(consoleMessages).toEqual([]);
});
