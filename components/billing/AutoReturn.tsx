"use client";

import { useEffect } from "react";
import { useRouter } from "@/i18n/navigation";

/** How long a result stays on screen before going back on its own. */
const DELAY_MS = 5_000;

export function AutoReturn({ href, label }: { href: string; label: string }) {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => router.replace(href), DELAY_MS);
    return () => clearTimeout(timer);
  }, [href, router]);

  return (
    <p className="text-xs text-muted-foreground" aria-live="polite">
      {label}
    </p>
  );
}
