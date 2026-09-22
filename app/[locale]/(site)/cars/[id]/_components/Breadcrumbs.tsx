import { Link } from "@/i18n/navigation";
import { Home, ChevronRight } from "lucide-react";
import type { CarDetail } from "../_lib/car-detail-types";
import { useTranslations, useLocale } from "next-intl";
import { formatNumber } from "@/lib/utils/number";
import type { Locale } from "@/i18n/routing";

const Breadcrumbs = ({ car }: { car: CarDetail }) => {
  const t = useTranslations("carDetail.breadcrumb");
  // Server component: useFormatters is a "use client" hook, so the plain
  // formatter is used with the locale next-intl exposes on the server.
  const locale = useLocale() as Locale;
    const label =
        car.title ||
        `${formatNumber(car.year, locale, { useGrouping: false })} ${car.make} ${car.model}`;

    return (
        <nav
            aria-label={t("label")}
            className="flex items-center gap-1.5 text-sm text-muted-foreground mb-6"
        >
            <Link
                href="/"
                className="flex items-center gap-1 hover:text-foreground transition-colors"
            >
                <Home className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{t("home")}</span>
            </Link>
            <ChevronRight className="h-3.5 w-3.5" />
            <Link
                href="/cars"
                className="hover:text-foreground transition-colors"
            >
                {t("cars")}
            </Link>
            <ChevronRight className="h-3.5 w-3.5" />
            <span className="text-foreground font-medium truncate max-w-[200px] sm:max-w-[300px]">
                {label}
            </span>
        </nav>
    );
};

export default Breadcrumbs;
