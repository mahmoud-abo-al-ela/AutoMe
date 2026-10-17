"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Button, buttonVariants } from "@/components/ui/button";
import { ErrorScreen, RoadBarrier } from "@/components/brand/ErrorScreen";

export default function SuperAdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations("common.errorPage");

  useEffect(() => {
    console.error("Super-admin error:", error);
  }, [error]);

  return (
    <div data-theme="site" className="flex flex-1 flex-col">
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
    </div>
  );
}
