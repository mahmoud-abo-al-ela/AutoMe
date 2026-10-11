/**
 * Where a job is delivered, for both sides of the queue: lib/jobs publishes
 * to it and app/api/jobs verifies QStash's signature against it, so the two
 * can never disagree. Null when there is no public URL to deliver to — unset,
 * or local, which QStash cannot reach.
 */
export function jobUrl(name: string): string | null {
  const raw = process.env.NEXT_PUBLIC_APP_URL;
  if (!raw) return null;
  try {
    const url = new URL(raw);
    if (url.hostname === "localhost" || url.hostname.endsWith(".localhost") || url.hostname === "127.0.0.1") {
      return null;
    }
    // A trailing slash in the setting must not make "//api/jobs".
    return `${url.origin}${url.pathname.replace(/\/+$/, "")}/api/jobs/${name}`;
  } catch {
    return null;
  }
}
