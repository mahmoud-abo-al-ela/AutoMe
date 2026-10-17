import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import { execFile } from "node:child_process";
import { randomBytes } from "node:crypto";
import path from "node:path";
import pg from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/lib/generated/prisma";

vi.hoisted(() => {
  if (process.env.TEST_DATABASE_URL) {
    process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
  }
});

const hasTestDb = Boolean(process.env.TEST_DATABASE_URL);

import { checkRolePosture } from "@/lib/mcp/ops/guard";
import { readRolePosture } from "@/lib/repositories/ops/role";
import { db } from "@/lib/prisma";

const ROLE = "autome_ops_ro_test";
const PASSWORD = randomBytes(12).toString("hex");
let roleUrl = "";

function asRole(base: string) {
  const url = new URL(base);
  url.username = ROLE;
  url.password = PASSWORD;
  return url.toString();
}

/** Run one statement as the role; the Postgres error code it fails with, or "ok". */
async function attempt(sql: string, { readWrite = false } = {}): Promise<string> {
  const client = new pg.Client({ connectionString: roleUrl });
  await client.connect();
  try {
    if (readWrite) await client.query("BEGIN READ WRITE");
    await client.query(sql);
    return "ok";
  } catch (error) {
    return (error as { code?: string }).code ?? "unknown";
  } finally {
    await client.end();
  }
}

/** The ops server as a developer starts it, with only the environment given here. */
function startOps(env: Record<string, string>, args: string[] = ["--check"]) {
  const tsx = path.resolve("node_modules/tsx/dist/cli.mjs");
  const base: Record<string, string> = {};
  // Enough of the machine to run node; nothing else leaks in — CI=true above all.
  for (const name of ["PATH", "Path", "SystemRoot", "TEMP", "TMP", "HOME", "USERPROFILE"]) {
    if (process.env[name]) base[name] = process.env[name]!;
  }
  return new Promise<{ code: number | null; stderr: string }>((resolve) => {
    execFile(
      process.execPath,
      [tsx, "scripts/mcp/ai-ops/server.ts", ...args],
      { env: { ...base, ...env } as NodeJS.ProcessEnv, timeout: 60_000 },
      (error, _stdout, stderr) => resolve({ code: error ? ((error as { code?: number }).code ?? 1) : 0, stderr })
    );
  });
}

describe.skipIf(!hasTestDb)("the ops read-only role (real Postgres)", () => {
  beforeAll(async () => {
    roleUrl = asRole(process.env.TEST_DATABASE_URL!);
    await db.$executeRawUnsafe(`DROP OWNED BY ${ROLE}`).catch(() => undefined);
    await db.$executeRawUnsafe(`DROP ROLE IF EXISTS ${ROLE}`);
    // D-10, as written in scripts/mcp/ai-ops/server.ts.
    await db.$executeRawUnsafe(`CREATE ROLE ${ROLE} LOGIN PASSWORD '${PASSWORD}' NOINHERIT`);
    await db.$executeRawUnsafe(`GRANT USAGE ON SCHEMA public TO ${ROLE}`);
    await db.$executeRawUnsafe(`GRANT SELECT ON "AiUsage", "AiTrace" TO ${ROLE}`);
    await db.$executeRawUnsafe(`ALTER ROLE ${ROLE} SET default_transaction_read_only = on`);
  });

  afterAll(async () => {
    await db.$executeRawUnsafe(`DROP OWNED BY ${ROLE}`);
    await db.$executeRawUnsafe(`DROP ROLE IF EXISTS ${ROLE}`);
  });

  it("reads the AI ledger and traces, and nothing else", async () => {
    expect(await attempt(`SELECT count(*) FROM "AiUsage"`)).toBe("ok");
    expect(await attempt(`SELECT count(*) FROM "AiTrace"`)).toBe("ok");
    expect(await attempt(`SELECT count(*) FROM "User"`)).toBe("42501");
    expect(await attempt(`SELECT count(*) FROM "Organization"`)).toBe("42501");
  });

  it("cannot write: its sessions are read-only, and the grants refuse even a read-write transaction", async () => {
    expect(await attempt(`INSERT INTO "AiUsage" ("id") VALUES ('x')`)).toBe("25006");
    for (const sql of [
      `INSERT INTO "AiUsage" ("id") VALUES ('x')`,
      `UPDATE "AiUsage" SET "feature" = 'x'`,
      `DELETE FROM "AiUsage"`,
      `TRUNCATE "AiTrace"`,
      `CREATE TABLE ops_probe (id int)`,
    ]) {
      expect(await attempt(sql, { readWrite: true }), sql).toBe("42501");
    }
  });

  it("is what the guard accepts, and the app's own login is not", async () => {
    const pool = new pg.Pool({ connectionString: roleUrl, max: 1 });
    const asOps = new PrismaClient({ adapter: new PrismaPg(pool) });
    try {
      const posture = await readRolePosture(asOps);
      expect(posture).toEqual({ readOnly: true, superuser: false, canCreate: false, writable: [] });
      expect(checkRolePosture(posture)).toEqual([]);
    } finally {
      await asOps.$disconnect();
    }

    const app = await readRolePosture(db);
    expect(checkRolePosture(app).length).toBeGreaterThan(0);
  });

  describe("the server, started", () => {
    const allowed = () => ({ OPS_MCP_ENV: "test", NODE_ENV: "test", OPS_MCP_DATABASE_URL: roleUrl });

    it("passes every check as the read-only role", async () => {
      const run = await startOps(allowed());
      expect(run.stderr).toContain("every check passed");
      expect(run.code).toBe(0);
    }, 60_000);

    it("exits non-zero on Vercel or CI, before touching the database", async () => {
      const run = await startOps({ ...allowed(), VERCEL: "1", CI: "true" });
      expect(run.code).not.toBe(0);
      expect(run.stderr).toContain("VERCEL is set");
      expect(run.stderr).toContain("CI is set");
    }, 60_000);

    it("exits non-zero as a role that can write", async () => {
      const run = await startOps({ ...allowed(), OPS_MCP_DATABASE_URL: process.env.TEST_DATABASE_URL! });
      expect(run.code).not.toBe(0);
      expect(run.stderr).toContain("refused: the role is a superuser");
      expect(run.stderr).not.toContain(new URL(process.env.TEST_DATABASE_URL!).password || "\u0000");
    }, 60_000);
  });
});
