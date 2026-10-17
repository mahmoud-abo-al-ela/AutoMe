import { afterAll, afterEach, beforeAll, beforeEach } from "vitest";
import { subscribeAiCalls, type AiCallRecord } from "@/lib/ai/client";

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
