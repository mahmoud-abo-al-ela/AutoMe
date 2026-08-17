/**
 * Validation for post-authentication redirect targets.
 *
 * The sign-in and sign-up pages read `?redirect_url=` straight off the query
 * string and handed it to Clerk's `forceRedirectUrl`. Anything that reached
 * that prop was somewhere the user got sent *after authenticating*, which is
 * the classic open-redirect shape: a link to
 * `https://autome.com/sign-in?redirect_url=https://evil.example/login` shows a
 * genuine, correctly-certificated AutoMe sign-in page and then lands the
 * freshly-authenticated user on an attacker's page — ideal for credential
 * phishing and for leaking whatever the next page puts in the URL.
 *
 * Only same-origin paths are allowed through, and only ones we can prove are
 * paths.
 */

/** Where to send someone when the requested destination is not trustworthy. */
export const DEFAULT_REDIRECT = "/";

/**
 * Narrow an untrusted redirect target to a safe internal path.
 *
 * Returns `DEFAULT_REDIRECT` for anything not provably local. Rejects:
 *  - absolute URLs on any origin (`https://evil.example/x`), including ones
 *    whose host merely starts with ours (`https://autome.com.evil.example`)
 *  - scheme-relative URLs (`//evil.example`), which browsers treat as absolute
 *  - backslash variants (`/\evil.example`, `\\evil.example`) that some parsers
 *    and older browsers normalise to `//`
 *  - non-http schemes, notably `javascript:` and `data:`
 *  - control characters and whitespace used to smuggle the above past naive
 *    prefix checks (`/\tjavascript:alert(1)`)
 *  - anything that fails to parse as a URL at all
 */
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
