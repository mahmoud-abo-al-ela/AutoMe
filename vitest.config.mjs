import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";
import path from "node:path";

// Mirror the `@/*` -> `./*` alias from jsconfig.json so tests import modules the
// same way application code does.
const root = path.dirname(fileURLToPath(import.meta.url));
const alias = { "@": root };

const oxc = { jsx: { runtime: "automatic" } };

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
        oxc,
        test: {
          name: "node",
          environment: "node",
          include: [
            "lib/**/*.test.{js,jsx,ts,tsx}",
            "actions/**/*.test.{js,jsx,ts,tsx}",
            "app/**/*.test.{js,jsx,ts,tsx}",
            "i18n/**/*.test.{js,jsx,ts,tsx}",
          ],
          exclude: [...sharedExclude, "**/*.jsdom.test.{js,jsx,ts,tsx}"],
        },
      },
      {
        // The DB-backed suites share one database, and some read or wipe a
        // whole table (platform AI usage, traces). Run side by side, one
        // file's clean-up removed rows another had just written. One file at
        // a time; without TEST_DATABASE_URL they skip, so it costs nothing.
        resolve: { alias },
        oxc,
        test: {
          name: "db",
          environment: "node",
          include: ["test/**/*.test.{js,jsx,ts,tsx}"],
          exclude: sharedExclude,
          fileParallelism: false,
        },
      },
      {
        resolve: { alias },
        oxc,
        test: {
          name: "jsdom",
          environment: "jsdom",
          include: [
            "hooks/**/*.test.{js,jsx,ts,tsx}",
            "components/**/*.test.{js,jsx,ts,tsx}",
            "**/*.jsdom.test.{js,jsx,ts,tsx}",
          ],
          exclude: sharedExclude,
        },
      },
    ],
  },
});
