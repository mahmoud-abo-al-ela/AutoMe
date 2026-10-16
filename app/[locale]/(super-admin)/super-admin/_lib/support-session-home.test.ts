import { describe, expect, it } from "vitest";
import type { CurrentUser } from "@/lib/checkUser";
import { supportSessionHome } from "./support-session-home";

const member = (organizationId: string, slug: string) => ({ organizationId, organization: { slug } });

const user = (fields: Partial<CurrentUser>) => ({ role: "USER", memberships: [], ...fields }) as unknown as CurrentUser;

const session = (targetOrganizationId: string) =>
  ({ sessionId: "s1", superAdmin: { id: "admin", email: null, name: null }, targetUserId: "u1", targetOrganizationId }) as CurrentUser["impersonation"];

describe("supportSessionHome", () => {
  it("is the dashboard of the dealership the session is for", () => {
    const viewing = user({
      impersonation: session("org-2"),
      memberships: [member("org-1", "other-motors"), member("org-2", "nile-crest-motors")] as CurrentUser["memberships"],
    });
    expect(supportSessionHome(viewing, "ar")).toBe("/ar/org/nile-crest-motors/dashboard");
  });

  it("is nothing outside a support session", () => {
    expect(supportSessionHome(user({ role: "ADMIN" }), "en")).toBeNull();
  });

  it("is nothing when the member no longer belongs to that dealership", () => {
    const viewing = user({ impersonation: session("org-2"), memberships: [member("org-1", "other-motors")] as CurrentUser["memberships"] });
    expect(supportSessionHome(viewing, "en")).toBeNull();
  });
});
