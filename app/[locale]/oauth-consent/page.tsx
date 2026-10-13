import type { Metadata } from "next";
import ConsentCard from "./ConsentCard";

/**
 * Clerk's OAuth consent screen, hosted here: where a person approves an MCP
 * client (Claude, Claude Code) acting on their AutoMe account. Clerk normally
 * hosts it on its Account Portal, which a production instance on a vercel.app
 * domain does not have; the Dashboard's Paths setting points the consent step
 * at this page instead (plans/mcp AUTH_MCP_REVIEW.md).
 *
 * Outside the site's (site) group on purpose — no header or menus to wander
 * off into mid-authorization, as Clerk advises.
 */
export const metadata: Metadata = {
  // Clerk rejects the consent form when a cross-origin submission arrives
  // with `Origin: null`, which a stricter referrer policy can cause.
  referrer: "strict-origin-when-cross-origin",
  robots: { index: false, follow: false },
};

export default function OAuthConsentPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <ConsentCard />
    </main>
  );
}
