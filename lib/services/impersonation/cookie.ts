import { cookies } from "next/headers";

/**
 * Set impersonation cookies
 */
export async function setImpersonationCookies(
  sessionId: string,
  targetUserId: string,
  organizationSlug: string
): Promise<void> {
  const cookieStore = await cookies();

  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: 60 * 60 * 4, // 4 hours max
  };

  cookieStore.set("x-impersonated-org", organizationSlug, cookieOptions);
  cookieStore.set("x-impersonated-user", targetUserId, cookieOptions);
  cookieStore.set("x-impersonation-session", sessionId, cookieOptions);
}

/**
 * Clear impersonation cookies
 */
export async function clearImpersonationCookies(): Promise<void> {
  const cookieStore = await cookies();
  
  cookieStore.delete("x-impersonated-org");
  cookieStore.delete("x-impersonated-user");
  cookieStore.delete("x-impersonation-session");
}

/**
 * Get impersonation session ID from cookies
 */
export async function getSessionIdFromCookies(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get("x-impersonation-session")?.value;
}
