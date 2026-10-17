import type { Metadata } from "next";
import ConsentCard from "./ConsentCard";

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
