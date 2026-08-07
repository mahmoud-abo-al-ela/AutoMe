import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";
import path from "node:path";

// Mirror the `@/*` -> `./*` alias from jsconfig.json so tests import modules the
// same way application code does.
const root = path.dirname(fileURLToPath(import.meta.url));
const alias = { "@": root };

// Server code (lib/, actions/, app/api/) runs in `node`; hooks/components run in
// `jsdom`. Split into two projects so each gets the right environment without a
// per-file pragma. DB-backed suites still run in `node` and gate themselves on
// TEST_DATABASE_URL (see test/db.js).
const sharedExclude = [
  "node_modules/**",
  ".next/**",
  "lib/generated/**",
  "e2e/**",
];

export default defineConfig({
  resolve: { alias },
  test: {
    projects: [
      {
        resolve: { alias },
        test: {
          name: "node",
          environment: "node",
          include: [
            "lib/**/*.test.{js,jsx}",
            "actions/**/*.test.{js,jsx}",
            "app/**/*.test.{js,jsx}",
            "test/**/*.test.{js,jsx}",
          ],
          exclude: [...sharedExclude, "**/*.jsdom.test.{js,jsx}"],
        },
      },
      {
        resolve: { alias },
        test: {
          name: "jsdom",
          environment: "jsdom",
          include: [
            "hooks/**/*.test.{js,jsx}",
            "components/**/*.test.{js,jsx}",
            "**/*.jsdom.test.{js,jsx}",
          ],
          exclude: sharedExclude,
        },
      },
    ],
  },
});
