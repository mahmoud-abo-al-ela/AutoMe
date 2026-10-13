import { describe, it, expect, vi, afterEach } from "vitest";

vi.mock("@/lib/repositories/user", () => ({ findUserByClerkId: vi.fn() }));
vi.mock("@/lib/services/test-drive/status", () => ({ getTestDrives: vi.fn() }));
vi.mock("@/lib/services/wishlist", () => ({ getUserWishlist: vi.fn() }));

import { accountResourceMetadata, oauthIssuer } from "./account";
import { ServiceUnavailableError } from "@/lib/utils/errors";

const key = (prefix: string, host: string) => `${prefix}${Buffer.from(`${host}$`).toString("base64")}`;

afterEach(() => vi.unstubAllEnvs());

describe("oauthIssuer", () => {
  it("is the Clerk instance the publishable key names", () => {
    vi.stubEnv("NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY", key("pk_test_", "happy-fox-12.clerk.accounts.dev"));
    expect(oauthIssuer()).toBe("https://happy-fox-12.clerk.accounts.dev");
    vi.stubEnv("NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY", key("pk_live_", "clerk.auto-me.example"));
    expect(oauthIssuer()).toBe("https://clerk.auto-me.example");
  });

  it("refuses a missing or malformed key rather than naming a wrong server", () => {
    for (const value of ["", "sk_test_abc", "pk_test_", key("pk_test_", "not a host"), "pk_test_%%%"]) {
      vi.stubEnv("NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY", value);
      expect(() => oauthIssuer(), value).toThrow(ServiceUnavailableError);
    }
  });
});

describe("accountResourceMetadata", () => {
  it("names the endpoint, its authorization server and the header the token goes in", () => {
    vi.stubEnv("NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY", key("pk_test_", "happy-fox-12.clerk.accounts.dev"));
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://auto-me.example");
    expect(accountResourceMetadata()).toEqual({
      resource: "https://auto-me.example/api/mcp/account",
      authorization_servers: ["https://happy-fox-12.clerk.accounts.dev"],
      scopes_supported: ["profile", "email", "offline_access"],
      bearer_methods_supported: ["header"],
      resource_name: "AutoMe — your account",
    });
  });
});
