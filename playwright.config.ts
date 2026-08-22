import { defineConfig, devices } from "@playwright/test";

/**
 * Suíte de fumaça pública e verificação do fluxo administrativo de materiais.
 * O teste autenticado usa um link temporário gerado pela API administrativa e
 * é ignorado quando as credenciais ou um administrador ativo não estão
 * disponíveis. `channel: "chrome"` usa o Chrome já instalado no sistema em
 * vez de baixar o Chromium do Playwright.
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: "list",
  // Next dev compila cada rota sob demanda no primeiro acesso — rodando
  // várias rotas novas em paralelo, isso pode passar de 30s (timeout
  // padrão do goto). 60s absorve o cold-compile sem mascarar timeout real
  // de app quebrado.
  timeout: 60_000,
  expect: { timeout: 15_000 },
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
    navigationTimeout: 60_000,
  },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        ...(process.env.CI ? {} : { channel: "chrome" }),
      },
    },
  ],
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
