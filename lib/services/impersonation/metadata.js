import { headers } from "next/headers";

/**
 * Get request metadata (IP address and user agent)
 */
export async function getRequestMetadata() {
  const headersList = await headers();
  
  const ipAddress = headersList.get("x-forwarded-for") || 
                    headersList.get("x-real-ip") || 
                    "unknown";
  const userAgent = headersList.get("user-agent") || "unknown";

  return { ipAddress, userAgent };
}
