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
