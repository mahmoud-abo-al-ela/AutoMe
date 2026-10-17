const PRODUCTION_HOST = "auto-me.vercel.app";

function arg(name: string): string | undefined {
  const index = process.argv.indexOf(`--${name}`);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

const url = arg("url");
const profile = arg("profile") ?? "normal";

if (!url) {
  console.error("--url is required, e.g. --url http://localhost:3000/api/mcp");
  process.exit(2);
}
if (new URL(url).host === PRODUCTION_HOST && !process.argv.includes("--production")) {
  console.error(`Refusing ${PRODUCTION_HOST} without --production: it spends the live limits and adds to the pilot's measures.`);
  process.exit(2);
}

const headers: Record<string, string> = {
  "content-type": "application/json",
  accept: "application/json, text/event-stream",
  "user-agent": "autome-load-test/1.0",
};
if (process.env.VERCEL_AUTOMATION_BYPASS_SECRET) {
  headers["x-vercel-protection-bypass"] = process.env.VERCEL_AUTOMATION_BYPASS_SECRET;
}

let nextId = 1;
const call = (name: string, args: Record<string, unknown>) =>
  JSON.stringify({ jsonrpc: "2.0", id: nextId++, method: "tools/call", params: { name, arguments: args } });

const QUERIES = ["toyota", "كيا", "سيدان اوتوماتيك", "sunroof", "corola", "هيونداي؟", "bmw x5", "family suv"];

interface Outcome {
  status: number;
  ms: number;
  toolError?: string;
}

async function send(body: string): Promise<Outcome> {
  const started = performance.now();
  try {
    const response = await fetch(url!, { method: "POST", headers, body });
    const text = await response.text();
    const toolError = /"error":"([a-z_]+)"/.exec(text)?.[1];
    return { status: response.status, ms: performance.now() - started, ...(toolError && { toolError }) };
  } catch {
    return { status: 0, ms: performance.now() - started };
  }
}

/** A buyer's conversation: search, then open a result, sometimes the options. */
function normalCalls(count: number): string[] {
  return Array.from({ length: count }, (_, i) =>
    i % 5 === 4
      ? call("get_search_options", { locale: i % 2 ? "ar" : "en" })
      : call("search_cars", { query: QUERIES[i % QUERIES.length], limit: 5 })
  );
}

async function run() {
  const outcomes: Outcome[] = [];
  if (profile === "normal") {
    for (const body of normalCalls(40)) {
      outcomes.push(await send(body));
      await new Promise((resolve) => setTimeout(resolve, 1_500));
    }
  } else if (profile === "burst") {
    const bodies = Array.from({ length: 200 }, (_, i) => call("get_search_options", { locale: i % 2 ? "ar" : "en" }));
    for (let i = 0; i < bodies.length; i += 20) {
      outcomes.push(...(await Promise.all(bodies.slice(i, i + 20).map(send))));
    }
  } else {
    console.error(`Unknown --profile ${profile}: normal or burst`);
    process.exit(2);
  }

  const byStatus: Record<string, number> = {};
  const byToolError: Record<string, number> = {};
  for (const outcome of outcomes) {
    byStatus[outcome.status] = (byStatus[outcome.status] ?? 0) + 1;
    if (outcome.toolError) byToolError[outcome.toolError] = (byToolError[outcome.toolError] ?? 0) + 1;
  }
  const sorted = outcomes.map((o) => o.ms).sort((a, b) => a - b);
  const pct = (p: number) => Math.round(sorted[Math.min(sorted.length - 1, Math.floor(p * sorted.length))]);
  const firstLimited = outcomes.findIndex((o) => o.status === 429);

  console.info(JSON.stringify({
    url,
    profile,
    requests: outcomes.length,
    byStatus,
    byToolError,
    latencyMs: { p50: pct(0.5), p95: pct(0.95), max: Math.round(sorted[sorted.length - 1]) },
    firstRateLimitedRequest: firstLimited >= 0 ? firstLimited + 1 : null,
  }, null, 2));
}

run();
