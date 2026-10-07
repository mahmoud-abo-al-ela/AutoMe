"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Button, buttonVariants } from "@/components/ui/button";
import { ErrorScreen, RoadBarrier } from "@/components/brand/ErrorScreen";

// The error boundary for the whole (site) route group — the customer-facing
// half of the product. Named for that, rather than `GlobalError`, which is what
// app/global-error.tsx is. Shown inside the site's header and footer, so the
// buyer keeps the navigation as well as the two ways out below.
export default function SiteRouteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations("common.errorPage");

  useEffect(() => {
    console.error("Site error:", error);
    // This boundary is nearer than app/error.tsx, so it catches every customer
    // -facing error first. Without this, none of them ever reached Sentry.
    Sentry.captureException(error);
  }, [error]);

  return (
    <ErrorScreen
      art={<RoadBarrier />}
      title={t("title")}
      body={t("body")}
      reference={error.digest ? t("reference", { digest: error.digest }) : undefined}
      actions={
        <>
          <Button variant="marker" size="xl" onClick={() => reset()}>
            {t("retry")}
          </Button>
          <Link href="/" className={buttonVariants({ variant: "outline-strong", size: "xl" })}>
            {t("home")}
          </Link>
        </>
      }
    />
  );
}
