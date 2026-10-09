import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { config } from "dotenv";

// Before any worker starts: the setup file imports the AI client, and with it
// Prisma, ahead of each suite's own .env loading — so the ledger needs the
// variables in place first. In CI there is no .env and this does nothing.
config({ quiet: true });

/**
 * The real-model evaluation run — the nightly workflow (.github/workflows/
 * ai-eval.yml) and anyone checking a prompt change by hand:
 *
 *   AI_EVAL=1 pnpm eval
 *   pnpm eval:compare
 *
 * Separate from vitest.config.mjs so `pnpm test` never spends provider quota,
 * and so only this run carries the call recorder and the report writer.
 */
const root = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  resolve: { alias: { "@": root } },
  test: {
    name: "ai-eval",
    environment: "node",
    include: ["lib/ai/evaluation/**/*.eval.test.ts"],
    setupFiles: ["lib/ai/evaluation/setup.ts"],
    reporters: ["default", "./lib/ai/evaluation/reporter.ts"],
    // One file at a time: the suites share provider caps measured per minute,
    // and parallel files only turn real answers into "AI busy".
    fileParallelism: false,
  },
});
