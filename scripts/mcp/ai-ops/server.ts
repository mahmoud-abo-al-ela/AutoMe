/**
 * The internal AI-ops MCP server, over stdio, for a developer's machine only.
 *
 *   pnpm -s mcp:ops            # serve (an MCP client starts this; -s keeps pnpm's banner off stdout)
 *   pnpm -s mcp:ops --check    # run every startup check, report, exit
 *
 * Reads `.env` and then `.env.ops` (both optional, both gitignored). It
 * refuses to start unless:
 *   - OPS_MCP_ENV and NODE_ENV are development or test, and no CI or VERCEL*
 *     variable is set;
 *   - OPS_MCP_DATABASE_URL is a role other than the app's, on a host in
 *     OPS_MCP_ALLOWED_DB_HOSTS (default localhost,127.0.0.1);
 *   - that role, asked by the database itself, cannot write or create
 *     anything and starts its sessions read-only.
 *
 * The role, once per local database (as a user allowed to create roles):
 *
 *   CREATE ROLE autome_ops_ro LOGIN PASSWORD '<local secret>' NOINHERIT;
 *   GRANT USAGE ON SCHEMA public TO autome_ops_ro;
 *   GRANT SELECT ON "AiUsage", "AiTrace" TO autome_ops_ro;
 *   ALTER ROLE autome_ops_ro SET default_transaction_read_only = on;
 *
 * Optional:
 *   OPS_MCP_REDIS_REST_URL + OPS_MCP_REDIS_READ_ONLY_TOKEN   the breaker's live
 *     counters, with Upstash's read-only token; without them, the ledger.
 *   OPS_MCP_EVAL_REPORT, OPS_MCP_EVAL_PREVIOUS_REPORT   eval-report.json files
 *     from the nightly workflow, for get_latest_eval_report / compare_eval_runs.
 *
 * Tools: get_ai_usage_summary, get_recent_ai_errors, get_breaker_status,
 * list_recent_traces, get_trace, get_latest_eval_report, compare_eval_runs.
 * Each call is logged to stderr: time, tool, its arguments, outcome.
 *
 * stdout carries the protocol: everything this file says goes to stderr.
 */
import path from "node:path";
import { checkOpsEnvironment, checkRolePosture, confineToReadOnly } from "@/lib/mcp/ops/guard";

function refuse(problems: string[]): never {
  for (const problem of problems) console.error(`ai-ops: refused: ${problem}`);
  process.exit(1);
}

async function main() {
  const environment = checkOpsEnvironment(process.env);
  if (environment.length > 0) refuse(environment);
  confineToReadOnly(process.env);

  // Imported only now: lib/prisma builds its client from DATABASE_URL at import.
  const { readRolePosture } = await import("@/lib/repositories/ops/role");
  const role = checkRolePosture(await readRolePosture());
  if (role.length > 0) refuse(role);

  if (process.argv.includes("--check")) {
    console.error("ai-ops: every check passed (environment, database host, read-only role)");
    process.exit(0);
  }

  const { createOpsMcpServer } = await import("@/lib/mcp/ops/server");
  const { readOnlyRedis } = await import("@/lib/mcp/ops/redis");
  const { StdioServerTransport } = await import("@modelcontextprotocol/server/stdio");
  const file = (name: string) => (process.env[name] ? path.resolve(process.env[name]!) : undefined);
  const server = createOpsMcpServer({
    redis: readOnlyRedis(process.env),
    evalReport: file("OPS_MCP_EVAL_REPORT"),
    previousEvalReport: file("OPS_MCP_EVAL_PREVIOUS_REPORT"),
    audit: (line) => console.error(line),
  });
  await server.connect(new StdioServerTransport());
  console.error("ai-ops: serving over stdio as a read-only role");
}

main().catch((error) => {
  // A connection or query failure: say which, not the connection string.
  console.error(`ai-ops: could not start: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
});
