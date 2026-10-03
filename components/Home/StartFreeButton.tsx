"use client";

import { useAuth } from "@clerk/nextjs";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";

/**
 * "Start free" for dealerships: straight into onboarding when signed in,
 * through sign-up (returning to onboarding) when not. Decided on the client
 * from Clerk's live state, the same way the header gates its auth controls.
 *
 * `inverse` (asphalt) on the marker band; `marker` on an asphalt panel.
 */
export function StartFreeButton({
  label,
  variant = "inverse",
  className,
}: {
  label: string;
  variant?: "inverse" | "marker";
  className?: string;
}) {
  const { isSignedIn } = useAuth();
  return (
    <Button variant={variant} size="xl" asChild className={className}>
      <Link href={isSignedIn ? "/onboarding" : "/sign-up?redirect_url=/onboarding"}>{label}</Link>
    </Button>
  );
}
