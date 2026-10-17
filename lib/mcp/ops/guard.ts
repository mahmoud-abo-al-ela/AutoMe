import type { RolePosture } from "@/lib/repositories/ops/role";

const ALLOWED_ENVIRONMENTS = ["development", "test"];
const DEFAULT_ALLOWED_HOSTS = ["localhost", "127.0.0.1"];

type Env = Record<string, string | undefined>;

interface DatabaseIdentity {
  user: string;
  host: string;
  port: string;
  database: string;
}

function parseDatabaseUrl(value: string): DatabaseIdentity | null {
  try {
    const url = new URL(value);
    if (url.protocol !== "postgres:" && url.protocol !== "postgresql:") return null;
    return {
      user: decodeURIComponent(url.username),
      host: url.hostname.toLowerCase().replace(/^\[|\]$/g, ""),
      port: url.port || "5432",
      database: decodeURIComponent(url.pathname.slice(1)),
    };
  } catch {
    return null;
  }
}

const sameDatabaseAndUser = (a: DatabaseIdentity, b: DatabaseIdentity) =>
  a.user === b.user && a.host === b.host && a.port === b.port && a.database === b.database;

/** Every reason this environment may not run the ops server; empty when it may. */
export function checkOpsEnvironment(env: Env): string[] {
  const problems: string[] = [];

  if (!ALLOWED_ENVIRONMENTS.includes(env.OPS_MCP_ENV ?? "")) {
    problems.push("OPS_MCP_ENV must be exactly development or test");
  }
  if (!ALLOWED_ENVIRONMENTS.includes(env.NODE_ENV ?? "")) {
    problems.push("NODE_ENV must be development or test");
  }
  // CI runs the guard's tests, never the server; Vercel never runs it at all.
  for (const name of Object.keys(env).sort()) {
    if ((name === "CI" || name.startsWith("VERCEL")) && env[name]) {
      problems.push(`${name} is set: the ops server runs only on a developer's machine`);
    }
  }

  const url = env.OPS_MCP_DATABASE_URL;
  const database = url ? parseDatabaseUrl(url) : null;
  if (!url) {
    problems.push("OPS_MCP_DATABASE_URL is required (the read-only role's connection string)");
  } else if (!database) {
    problems.push("OPS_MCP_DATABASE_URL is not a postgres:// connection string");
  } else {
    const allowed = (env.OPS_MCP_ALLOWED_DB_HOSTS ?? "")
      .split(",")
      .map((host) => host.trim().toLowerCase())
      .filter(Boolean);
    if (!(allowed.length > 0 ? allowed : DEFAULT_ALLOWED_HOSTS).includes(database.host)) {
      problems.push("OPS_MCP_DATABASE_URL's host is not in OPS_MCP_ALLOWED_DB_HOSTS");
    }
    for (const name of ["DATABASE_URL", "DIRECT_URL"]) {
      const app = env[name] ? parseDatabaseUrl(env[name]!) : null;
      if (app && sameDatabaseAndUser(app, database)) {
        problems.push(`OPS_MCP_DATABASE_URL connects as the app's own user (${name}); use the read-only role`);
      }
    }
  }
  return problems;
}

/** Every reason the connected role is not read-only; empty when it is. */
export function checkRolePosture(posture: RolePosture): string[] {
  const problems: string[] = [];
  if (posture.superuser) problems.push("the role is a superuser");
  if (!posture.readOnly) problems.push("the role's sessions are not read-only (default_transaction_read_only)");
  if (posture.canCreate) problems.push("the role may create objects in the public schema");
  if (posture.writable.length > 0) {
    const shown = posture.writable.slice(0, 5).join(", ");
    const more = posture.writable.length > 5 ? ` and ${posture.writable.length - 5} more` : "";
    problems.push(`the role may write to ${shown}${more}`);
  }
  return problems;
}

export function confineToReadOnly(env: Env): void {
  env.DATABASE_URL = env.OPS_MCP_DATABASE_URL;
  for (const name of ["DIRECT_URL", "UPSTASH_REDIS_REST_URL", "UPSTASH_REDIS_REST_TOKEN"]) {
    delete env[name];
  }
}
