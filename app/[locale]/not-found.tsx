"use client";

import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { Button, buttonVariants } from "@/components/ui/button";
import { ErrorScreen } from "@/components/brand/ErrorScreen";
import { useFormatters } from "@/hooks/use-formatters";

export default function NotFound() {
  const t = useTranslations("common.errorPage.notFound");
  const router = useRouter();
  const fmt = useFormatters();

  return (
    <ErrorScreen
      fullPage
      art={
        <span aria-hidden className="text-[7rem] font-black leading-none tracking-tight tabular-nums sm:text-[9rem]">
          {fmt.number(404, { useGrouping: false })}
        </span>
      }
      title={t("title")}
      body={t("body")}
      actions={
        <>
          <Link href="/" className={buttonVariants({ variant: "marker", size: "xl" })}>
            {t("home")}
          </Link>
          <Button variant="outline-strong" size="xl" onClick={() => router.back()}>
            {t("back")}
          </Button>
        </>
      }
    />
  );
}
