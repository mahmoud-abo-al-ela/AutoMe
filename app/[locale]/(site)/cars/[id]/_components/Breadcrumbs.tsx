import { Link } from "@/i18n/navigation";
import { ChevronRight } from "lucide-react";
import type { CarDetail } from "../_lib/car-detail-types";
import { useTranslations, useLocale } from "next-intl";
import { formatNumber } from "@/lib/utils/number";
import { resolveCarTitle } from "@/lib/utils/car-text";
import type { Locale } from "@/i18n/routing";

/**
 * Desktop breadcrumbs (Figma: Breadcrumbs). Phones go back with the browser
 * or the tab bar instead, so this is hidden below md. The separators point
 * along the reading direction.
 */
const Breadcrumbs = ({ car }: { car: CarDetail }) => {
  const t = useTranslations("carDetail.breadcrumb");
  // Server component: useFormatters is a "use client" hook, so the plain
  // formatter is used with the locale next-intl exposes on the server.
  const locale = useLocale() as Locale;
  const label =
    resolveCarTitle(car, locale)?.text ?? `${formatNumber(car.year, locale, { useGrouping: false })} ${car.make} ${car.model}`;
  const separator = <ChevronRight aria-hidden className="size-3.5 shrink-0 rtl:rotate-180" />;

  return (
    <nav aria-label={t("label")} className="mb-5 hidden items-center gap-2 text-caption text-muted-foreground md:flex">
      <Link href="/" className="hover:text-foreground hover:underline">
        {t("home")}
      </Link>
      {separator}
      <Link href="/cars" className="hover:text-foreground hover:underline">
        {t("cars")}
      </Link>
      {separator}
      <span aria-current="page" className="max-w-[24rem] truncate font-medium text-foreground">
        {label}
      </span>
    </nav>
  );
};

export default Breadcrumbs;
