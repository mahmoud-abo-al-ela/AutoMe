import { enforceMcpPublicLimit } from "@/lib/middleware/with-rate-limit";
import { MAX_BODY_BYTES, callerIp, limitRefusal, methodNotAllowed, readJsonBody, refuse, serveMcp } from "@/lib/mcp/http";
import { createPublicMcpServer } from "@/lib/mcp/public/server";

export const runtime = "nodejs";
export const maxDuration = 10;

// Off unless MCP_PUBLIC_ENABLED is "true", so a deploy never opens it by accident.
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
