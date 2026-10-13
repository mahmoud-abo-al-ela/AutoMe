import { auth } from "@clerk/nextjs/server";
import { enforceMcpAccountLimit, enforceMcpPublicLimit } from "@/lib/middleware/with-rate-limit";
import { createAccountMcpServer } from "@/lib/mcp/account/server";
import { MAX_BODY_BYTES, callerIp, limitRefusal, methodNotAllowed, readJsonBody, refuse, serveMcp } from "@/lib/mcp/http";
import { ACCOUNT_METADATA_PATH, accountMcpEnabled, resolveAccountCaller } from "@/lib/services/mcp/account";
import { mcpClientLabel } from "@/lib/services/mcp/account-test-drives";
import { siteUrl } from "@/lib/services/public-catalog/urls";

/**
 * The signed-in buyer's MCP endpoint (plans/mcp AUTH_MCP_REVIEW.md, D-27):
 * the same stateless JSON transport as the public one (app/api/mcp), for an
 * MCP client the person signed in to AutoMe with — OAuth, with Clerk as the
 * authorization server. Every call carries a Clerk OAuth access token; the
 * token's user is the only account any tool reads or changes.
 *
 * In order: the off switch (MCP_ACCOUNT_ENABLED), the size limit, the
 * per-address limit — before the token is checked, so junk tokens cannot make
 * AutoMe ask Clerk about each one — then the token, then the per-user limit.
 * No token, or one that is not valid: 401 with the metadata address (RFC 9728),
 * which is how a client learns where to sign the person in.
 */

export const runtime = "nodejs";
export const maxDuration = 10;

function unauthorized(invalidToken: boolean) {
  const challenge = [
    ...(invalidToken ? ['error="invalid_token"'] : []),
    `resource_metadata="${siteUrl(ACCOUNT_METADATA_PATH)}"`,
  ].join(", ");
  return refuse(401, "unauthorized", { "WWW-Authenticate": `Bearer ${challenge}` });
}

export async function POST(request: Request) {
  if (!accountMcpEnabled()) return refuse(503, "disabled");

  const declared = Number(request.headers.get("content-length") ?? 0);
  if (declared > MAX_BODY_BYTES) return refuse(413, "too_large");

  try {
    await enforceMcpPublicLimit();
  } catch (error) {
    return limitRefusal(error);
  }

  const presented = request.headers.get("authorization")?.toLowerCase().startsWith("bearer ") ?? false;
  const token = await auth({ acceptsToken: "oauth_token" });
  if (!token.isAuthenticated || !token.userId) return unauthorized(presented);
  // A valid token for an account AutoMe no longer has is not a caller either.
  const user = await resolveAccountCaller(token.userId);
  if (!user) return unauthorized(true);

  try {
    await enforceMcpAccountLimit(user.id);
  } catch (error) {
    return limitRefusal(error);
  }

  const read = await readJsonBody(request);
  if ("refused" in read) return read.refused;

  const server = createAccountMcpServer({
    ip: callerIp(request),
    userAgent: request.headers.get("user-agent"),
    user,
    client: mcpClientLabel(token.clientId),
  });
  return serveMcp(server, request, read.body);
}

export const GET = methodNotAllowed;
export const DELETE = methodNotAllowed;
