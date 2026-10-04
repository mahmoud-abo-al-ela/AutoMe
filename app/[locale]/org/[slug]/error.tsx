"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { AlertTriangle } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Button, buttonVariants } from "@/components/ui/button";

/**
 * A dashboard page that failed to render. Shown inside the dashboard's shell,
 * so the sidebar stays and the dealer can go elsewhere; "Try again" re-renders
 * the page, the other way out is the public site.
 */
export default function OrgError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations("org.error");

  useEffect(() => {
    console.error("Dashboard error:", error);
  }, [error]);

  return (
    <div className="flex flex-1 items-center justify-center py-16">
      <div className="flex w-full max-w-md flex-col items-center gap-4 rounded-sheet border border-border bg-card p-8 text-center">
        <span aria-hidden className="flex size-14 items-center justify-center rounded-full bg-destructive-soft text-destructive">
          <AlertTriangle className="size-7" />
        </span>
        <h1 className="text-h2 font-extrabold">{t("title")}</h1>
        <p className="text-body text-muted-foreground">{t("body")}</p>
        <div className="mt-2 flex w-full flex-col gap-3 sm:flex-row sm:justify-center">
          <Button variant="marker" size="control" onClick={() => reset()}>
            {t("retry")}
          </Button>
          <Link href="/" className={buttonVariants({ variant: "outline-strong", size: "control" })}>
            {t("home")}
          </Link>
        </div>
      </div>
    </div>
  );
}
