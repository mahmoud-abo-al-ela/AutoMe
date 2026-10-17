"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { Button, buttonVariants } from "@/components/ui/button";
import { ErrorScreen, RoadBarrier } from "@/components/brand/ErrorScreen";

export default function RootRouteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations("common.errorPage");
  const pathname = usePathname();
  const dashboard = pathname.match(/^\/org\/([^/]+)/)?.[1];

  useEffect(() => {
    console.error("Global Error:", error);
    Sentry.captureException(error);
  }, [error]);

  return (
    <ErrorScreen
      fullPage
      art={<RoadBarrier />}
      title={t("title")}
      body={dashboard ? t("bodyDashboard") : t("body")}
      reference={error.digest ? t("reference", { digest: error.digest }) : undefined}
      actions={
        <>
          <Button variant="marker" size="xl" onClick={() => reset()}>
            {t("retry")}
          </Button>
          <Link href={dashboard ? `/org/${dashboard}/dashboard` : "/"} className={buttonVariants({ variant: "outline-strong", size: "xl" })}>
            {dashboard ? t("dashboard") : t("home")}
          </Link>
        </>
      }
    />
  );
}
