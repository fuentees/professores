import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  resolve: {
    alias: {
      "@/": `${path.resolve(import.meta.dirname, "src")}/`,
      // "server-only" throws when resolved outside Next's "react-server"
      // bundler condition; under plain Node (Vitest) it would break every
      // import of a server-side lib file, so it's aliased to a no-op here.
      "server-only": path.resolve(import.meta.dirname, "test/stubs/server-only.ts"),
    },
  },
  test: {
    environment: "node",
    // e2e/ roda via Playwright (npm run test:e2e), não Vitest — sem isso,
    // o glob padrão do Vitest também pegava os *.spec.ts de lá e quebrava
    // ("test() from an async test.describe()... only sync supported").
    exclude: ["**/node_modules/**", "**/e2e/**"],
  },
});
