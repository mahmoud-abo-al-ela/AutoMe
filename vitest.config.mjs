import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";
import path from "node:path";

// Mirror the `@/*` -> `./*` alias from jsconfig.json so tests import modules the
// same way application code does.
const root = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      "@": root,
    },
  },
  test: {
    // Phase 0 reproduction tests are all server-side. hooks/components (jsdom)
    // arrive with the Phase 1 harness.
    environment: "node",
    include: ["**/*.test.{js,jsx}"],
    exclude: ["node_modules/**", ".next/**", "lib/generated/**", "e2e/**"],
  },
});
