"use client";

import { useAuth } from "@clerk/nextjs";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";

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
