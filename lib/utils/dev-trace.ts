/**
 * A step-by-step trace of one request, printed to the dev server's terminal —
 * so a developer can watch a feature work from input to output.
 *
 * Development only. In production every method is a no-op: the trace carries
 * what buyers type, and the AiUsage ledger already records what matters there.
 * Each trace has a short id, so two requests running at once stay readable,
 * and each line the time since the trace started.
 */
export interface Trace {
  /** One step along the way. */
  step(message: string): void;
  /** The last line: how the request ended. */
  end(message: string): void;
}

const NOOP: Trace = { step: () => {}, end: () => {} };

export function startTrace(scope: string, firstLine: string): Trace {
  if (process.env.NODE_ENV !== "development") return NOOP;

  const id = Math.random().toString(16).slice(2, 6);
  const started = Date.now();
  const tag = `[${scope} #${id}]`;
  const elapsed = () => {
    const ms = Date.now() - started;
    return ms < 1000 ? `+${ms}ms` : `+${(ms / 1000).toFixed(1)}s`;
  };

  console.info(`${tag} ▶ ${firstLine}`);
  return {
    step: (message) => console.info(`${tag} ${elapsed().padEnd(7)} ${message}`),
    end: (message) => console.info(`${tag} ■ ${message} (${elapsed().replace("+", "")})`),
  };
}
