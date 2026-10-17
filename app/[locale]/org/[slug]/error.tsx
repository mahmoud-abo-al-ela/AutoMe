"use client";

import { useEffect } from "react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Button, buttonVariants } from "@/components/ui/button";
import { ErrorScreen, RoadBarrier } from "@/components/brand/ErrorScreen";

export default function OrgError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations("common.errorPage");
  const { slug } = useParams<{ slug: string }>();

  useEffect(() => {
    console.error("Dashboard error:", error);
  }, [error]);

  return (
    <ErrorScreen
      art={<RoadBarrier />}
      title={t("title")}
      body={t("bodyDashboard")}
      reference={error.digest ? t("reference", { digest: error.digest }) : undefined}
      actions={
        <>
          <Button variant="marker" size="xl" onClick={() => reset()}>
            {t("retry")}
          </Button>
          <Link href={`/org/${slug}/dashboard`} className={buttonVariants({ variant: "outline-strong", size: "xl" })}>
            {t("dashboard")}
          </Link>
        </>
      }
    />
  );
}
