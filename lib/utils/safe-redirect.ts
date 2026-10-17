/** Where to send someone when the requested destination is not trustworthy. */
export const DEFAULT_REDIRECT = "/";

// Guards post-sign-in redirects against open redirects: only provable same-origin paths pass.
export function safeRedirectPath(
    target: string | null | undefined,
    fallback: string = DEFAULT_REDIRECT
): string {
    if (typeof target !== "string" || target.length === 0) {
        return fallback;
    }

    // Strip nothing — evaluate exactly what was supplied, but refuse anything
    // containing characters that let a value mean two different things to a
    // parser and a browser.
    if (/[\x00-\x1F\x7F\s]/.test(target)) {
        return fallback;
    }

    // Must be a path. This single check also rejects `//evil.example` and
    // `https://…`, since neither starts with a lone slash.
    if (!target.startsWith("/")) {
        return fallback;
    }
    if (target.startsWith("//") || target.startsWith("/\\")) {
        return fallback;
    }

    // Resolve against a throwaway origin: anything that escapes it — via an
    // embedded scheme, or a parser quirk we have not thought of — is rejected
    // because the resolved origin will not match.
    const BASE = "https://redirect.invalid";
    let parsed: URL;
    try {
        parsed = new URL(target, BASE);
    } catch {
        return fallback;
    }

    if (parsed.origin !== BASE) {
        return fallback;
    }

    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
}
