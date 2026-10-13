import { describe, it, expect } from "vitest";
import { checkOpsEnvironment, checkRolePosture, confineToReadOnly } from "@/lib/mcp/ops/guard";

const RO = "postgresql://autome_ops_ro:secret@localhost:54329/autome";
const APP = "postgresql://postgres:app-secret@localhost:54329/autome";
const allowed = { OPS_MCP_ENV: "development", NODE_ENV: "development", OPS_MCP_DATABASE_URL: RO, DATABASE_URL: APP };

const problemsWith = (overrides: Record<string, string | undefined>) =>
  checkOpsEnvironment({ ...allowed, ...overrides });

describe("checkOpsEnvironment", () => {
  it("allows a developer's machine with a separate local role", () => {
    expect(checkOpsEnvironment(allowed)).toEqual([]);
    expect(problemsWith({ OPS_MCP_ENV: "test", NODE_ENV: "test" })).toEqual([]);
  });

  it.each([
    ["unset", undefined],
    ["production", "production"],
    ["staging", "staging"],
    ["a near miss", "Development"],
  ])("refuses OPS_MCP_ENV %s", (_, value) => {
    expect(problemsWith({ OPS_MCP_ENV: value })).toEqual(["OPS_MCP_ENV must be exactly development or test"]);
  });

  it.each([undefined, "production"])("refuses NODE_ENV %s", (value) => {
    expect(problemsWith({ NODE_ENV: value })).toEqual(["NODE_ENV must be development or test"]);
  });

  it.each(["CI", "VERCEL", "VERCEL_ENV", "VERCEL_URL"])("refuses when %s is set", (name) => {
    expect(problemsWith({ [name]: "1" })).toEqual([`${name} is set: the ops server runs only on a developer's machine`]);
  });

  it("refuses without the role's URL, or with one that is not postgres", () => {
    expect(problemsWith({ OPS_MCP_DATABASE_URL: undefined })[0]).toMatch(/OPS_MCP_DATABASE_URL is required/);
    expect(problemsWith({ OPS_MCP_DATABASE_URL: "https://localhost/x" })[0]).toMatch(/not a postgres:\/\//);
    expect(problemsWith({ OPS_MCP_DATABASE_URL: "not a url" })[0]).toMatch(/not a postgres:\/\//);
  });

  it("refuses a database host outside the allowlist — a remote one by default", () => {
    const remote = "postgresql://autome_ops_ro:secret@db.abc.supabase.co:5432/postgres";
    expect(problemsWith({ OPS_MCP_DATABASE_URL: remote })).toEqual([
      "OPS_MCP_DATABASE_URL's host is not in OPS_MCP_ALLOWED_DB_HOSTS",
    ]);
    expect(problemsWith({ OPS_MCP_DATABASE_URL: remote, OPS_MCP_ALLOWED_DB_HOSTS: "localhost, DB.abc.supabase.co" })).toEqual([]);
    // A list replaces the default: localhost is then refused unless listed.
    expect(problemsWith({ OPS_MCP_ALLOWED_DB_HOSTS: "db.abc.supabase.co" })).toHaveLength(1);
  });

  it("refuses the app's own user, however the URL is written", () => {
    for (const [name, url] of [
      ["DATABASE_URL", APP],
      ["DIRECT_URL", "postgres://postgres:other@LOCALHOST:54329/autome?sslmode=disable"],
    ]) {
      expect(checkOpsEnvironment({ ...allowed, DATABASE_URL: undefined, [name]: url, OPS_MCP_DATABASE_URL: APP })).toEqual([
        `OPS_MCP_DATABASE_URL connects as the app's own user (${name}); use the read-only role`,
      ]);
    }
  });

  it("never repeats a credential in what it reports", () => {
    const problems = checkOpsEnvironment({
      OPS_MCP_DATABASE_URL: "postgresql://postgres:app-secret@db.example.com:5432/x",
      DATABASE_URL: "postgresql://postgres:app-secret@db.example.com:5432/x",
      OPS_MCP_ALLOWED_DB_HOSTS: "db.example.com",
      VERCEL: "1",
    }).join("\n");
    expect(problems).not.toMatch(/app-secret|db\.example\.com/);
  });
});

describe("checkRolePosture", () => {
  const readOnly = { readOnly: true, superuser: false, canCreate: false, writable: [] };

  it("accepts a role that can only read", () => {
    expect(checkRolePosture(readOnly)).toEqual([]);
  });

  it("refuses each way a role could write", () => {
    expect(checkRolePosture({ ...readOnly, superuser: true })).toEqual(["the role is a superuser"]);
    expect(checkRolePosture({ ...readOnly, readOnly: false })[0]).toMatch(/not read-only/);
    expect(checkRolePosture({ ...readOnly, canCreate: true })[0]).toMatch(/create objects/);
    const writable = ["AiTrace", "AiUsage", "Car", "Organization", "TestDrive", "User", "_prisma_migrations"];
    expect(checkRolePosture({ ...readOnly, writable })).toEqual([
      "the role may write to AiTrace, AiUsage, Car, Organization, TestDrive and 2 more",
    ]);
  });
});

describe("confineToReadOnly", () => {
  it("leaves the process with the read-only role and no Redis credentials", () => {
    const env: Record<string, string | undefined> = {
      ...allowed,
      DIRECT_URL: APP,
      UPSTASH_REDIS_REST_URL: "https://redis",
      UPSTASH_REDIS_REST_TOKEN: "write-token",
    };
    confineToReadOnly(env);
    expect(env.DATABASE_URL).toBe(RO);
    expect(env).not.toHaveProperty("DIRECT_URL");
    expect(env).not.toHaveProperty("UPSTASH_REDIS_REST_URL");
    expect(env).not.toHaveProperty("UPSTASH_REDIS_REST_TOKEN");
  });
});
