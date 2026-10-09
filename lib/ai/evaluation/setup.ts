import { afterAll, afterEach, beforeAll, beforeEach } from "vitest";
import { subscribeAiCalls, type AiCallRecord } from "@/lib/ai/client";

/**
 * Setup for the evaluation run (vitest.eval.config.mjs): records which model
 * answered every call, so the report can tell a regression from a fallback.
 *
 * Calls made inside a test are that test's; calls made in a `beforeAll` —
 * which is where most suites spend their requests — belong to the file.
 */

declare module "vitest" {
  interface TaskMeta {
    aiCalls?: AiCallRecord[];
  }
}

let current: AiCallRecord[] | null = null;
let unsubscribe: (() => void) | undefined;

// Vitest 4 passes hook fixtures first (they must be destructured) and the
// file's suite second.
beforeAll(({}, file) => {
  const fileCalls: AiCallRecord[] = [];
  file.meta.aiCalls = fileCalls;
  unsubscribe = subscribeAiCalls((call) => (current ?? fileCalls).push(call));
});

beforeEach(({ task }) => {
  current = task.meta.aiCalls = [];
});

afterEach(() => {
  current = null;
});

afterAll(() => unsubscribe?.());
