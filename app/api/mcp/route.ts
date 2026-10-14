import { enforceMcpPublicLimit } from "@/lib/middleware/with-rate-limit";
import { MAX_BODY_BYTES, callerIp, limitRefusal, methodNotAllowed, readJsonBody, refuse, serveMcp } from "@/lib/mcp/http";
import { createPublicMcpServer } from "@/lib/mcp/public/server";

/**
 * AutoMe's public MCP endpoint (Streamable HTTP, stateless, JSON responses):
 * read-only search of public listings for AI clients. No sign-in — it serves
 * only what any visitor can see (repositories/car/visibility.ts). The
 * signed-in buyer's endpoint is separate: app/api/mcp/account.
 *
 * Off unless MCP_PUBLIC_ENABLED is "true": a deploy never opens it by
 * accident, and turning it off needs no code change — set it in Vercel and
 * redeploy, as Vercel applies an environment change only to new deployments
 * (docs/mcp-runbook.md). Every request is size-checked
 * and rate-limited before its body is read; see plans/mcp (SECURITY §3) for the
 * layers and their provisional values.
 */

export const runtime = "nodejs";
export const maxDuration = 10;

const enabled = () => process.env.MCP_PUBLIC_ENABLED === "true";

export async function POST(request: Request) {
  if (!enabled()) return refuse(503, "disabled");

  const declared = Number(request.headers.get("content-length") ?? 0);
  if (declared > MAX_BODY_BYTES) return refuse(413, "too_large");

  try {
    await enforceMcpPublicLimit();
  } catch (error) {
    return limitRefusal(error);
  }

  const read = await readJsonBody(request);
  if ("refused" in read) return read.refused;

  const caller = { ip: callerIp(request), userAgent: request.headers.get("user-agent") };
  return serveMcp(() => createPublicMcpServer(caller), request, read.body);
}

export const GET = methodNotAllowed;
export const DELETE = methodNotAllowed;
