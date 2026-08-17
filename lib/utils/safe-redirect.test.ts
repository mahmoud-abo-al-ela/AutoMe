import { describe, it, expect } from "vitest";
import { safeRedirectPath, DEFAULT_REDIRECT } from "@/lib/utils/safe-redirect";

describe("safeRedirectPath", () => {
    it("keeps ordinary internal paths", () => {
        expect(safeRedirectPath("/onboarding")).toBe("/onboarding");
        expect(safeRedirectPath("/org/cairo-cars/dashboard")).toBe(
            "/org/cairo-cars/dashboard"
        );
    });

    it("preserves query and hash on an internal path", () => {
        expect(safeRedirectPath("/cars?make=BMW&page=2#results")).toBe(
            "/cars?make=BMW&page=2#results"
        );
    });

    it.each([
        ["absolute http", "http://evil.example/login"],
        ["absolute https", "https://evil.example/login"],
        // The attack the raw value enabled: a real AutoMe sign-in page that
        // deposits the authenticated user on someone else's site.
        ["lookalike host", "https://autome.com.evil.example/login"],
        ["scheme-relative", "//evil.example"],
        ["scheme-relative with path", "//evil.example/login"],
        ["backslash scheme-relative", "/\\evil.example"],
        ["double backslash", "\\\\evil.example"],
        ["javascript scheme", "javascript:alert(1)"],
        ["data scheme", "data:text/html,<script>alert(1)</script>"],
        ["tab-smuggled javascript", "/\tjavascript:alert(1)"],
        ["newline-smuggled", "/\nhttps://evil.example"],
        ["leading whitespace", "  https://evil.example"],
        ["bare word", "evil.example"],
        ["empty string", ""],
    ])("rejects %s", (_label, input) => {
        expect(safeRedirectPath(input)).toBe(DEFAULT_REDIRECT);
    });

    it("rejects a missing value", () => {
        expect(safeRedirectPath(undefined)).toBe(DEFAULT_REDIRECT);
        expect(safeRedirectPath(null)).toBe(DEFAULT_REDIRECT);
    });

    it("honours a caller-supplied fallback", () => {
        expect(safeRedirectPath("https://evil.example", "/dashboard")).toBe(
            "/dashboard"
        );
    });
});
