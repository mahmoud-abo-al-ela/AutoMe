"use client";

import { useAuth } from "@clerk/nextjs";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";

/**
 * "Start free" for dealerships: straight into onboarding when signed in,
 * through sign-up (returning to onboarding) when not. Decided on the client
 * from Clerk's live state, the same way the header gates its auth controls.
 */
export function StartFreeButton({ label, className }: { label: string; className?: string }) {
  const { isSignedIn } = useAuth();
  return (
    <Button variant="inverse" size="xl" asChild className={className}>
      <Link href={isSignedIn ? "/onboarding" : "/sign-up?redirect_url=/onboarding"}>{label}</Link>
    </Button>
  );
}
