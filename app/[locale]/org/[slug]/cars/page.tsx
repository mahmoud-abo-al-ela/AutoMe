import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { Plus } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { buttonVariants } from "@/components/ui/button";
import type { Locale } from "@/i18n/routing";
import { formatNumber } from "@/lib/utils/number";
import { cn } from "@/lib/utils";
import { getCarsNeedingAttention } from "@/actions/dashboard";
import { getInventory, getInventoryCounts } from "@/actions/inventory";
import { INVENTORY_VIEWS } from "@/lib/validations/schemas";
import { OrgPageHeader } from "../_components/OrgPageHeader";
import { CarsPlanBanner } from "./_components/cars-plan-banner";
import { AttentionList } from "./_components/AttentionList";
import { CarsLedger } from "./_components/ledger/CarsLedger";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "org.cars.meta" });

  return { title: t("title"), description: t("description") };
}

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ view?: string }>;
};

type View = (typeof INVENTORY_VIEWS)[number] | "attention";

/**
 * The dealer's cars (canvas: Cars — round 1, "1 · Ledger"; page pattern 1,
 * list). One page, five views of the same stock, in the URL (?view=) so the
 * overview can link straight to one: every car, those on sale, those that
 * need attention, hidden, sold. Four are the table, filtered by status; "Needs
 * attention" is its own list, each car with the fix that comes first.
 */
const CarsPage = async ({ params, searchParams }: Props) => {
  const { slug } = await params;
  const requested = (await searchParams).view;
  const view: View =
    requested === "attention" || (INVENTORY_VIEWS as readonly string[]).includes(requested ?? "") ? (requested as View) : "all";
  const locale = (await getLocale()) as Locale;
  const t = await getTranslations("org.cars");
  const base = `/org/${slug}`;
  const n = (value: number) => formatNumber(value, locale);

  const [countsResult, flaggedResult, inventoryResult] = await Promise.all([
    getInventoryCounts(),
    getCarsNeedingAttention(),
    view === "attention" ? null : getInventory({ view }),
  ]);
  const counts = countsResult.success ? countsResult.data : null;
  const flagged = flaggedResult.success ? flaggedResult.data : null;
  const inventory = inventoryResult?.success ? inventoryResult.data : null;

  const views: { key: View; count: number | null; marker?: boolean }[] = [
    { key: "all", count: counts?.all ?? null },
    { key: "available", count: counts?.AVAILABLE ?? null },
    // Marker yellow: cars waiting on the dealer, like every "waiting" count.
    { key: "attention", count: flagged?.length ?? null, marker: true },
    { key: "unavailable", count: counts?.UNAVAILABLE ?? null },
    { key: "sold", count: counts?.SOLD ?? null },
  ];

  return (
    <div className="flex flex-col gap-6">
      <CarsPlanBanner orgSlug={slug} />
      <OrgPageHeader
        title={t("title")}
        description={counts ? t("summary", { total: n(counts.all), onSale: n(counts.AVAILABLE) }) : undefined}
        // Adding a car is this page's own action, so it lives here, not in the top bar.
        actions={
          <Link
            href={`${base}/cars/create`}
            className={cn(buttonVariants({ variant: "inverse", size: "control" }), "h-11 w-full sm:w-auto")}
          >
            <Plus aria-hidden className="size-[18px]" />
            {t("addCar")}
          </Link>
        }
        className="mb-0 md:mb-0"
      />

      <nav aria-label={t("views.label")} className="flex flex-wrap gap-2">
        {views.map(({ key, count, marker }) => (
          <Link
            key={key}
            href={key === "all" ? `${base}/cars` : `${base}/cars?view=${key}`}
            aria-current={view === key ? "page" : undefined}
            className={cn(
              "flex h-11 shrink-0 items-center gap-2 whitespace-nowrap rounded-full px-4 text-caption font-semibold transition-colors",
              view === key ? "bg-inverse text-inverse-foreground" : "border border-[#8c8170] bg-card hover:bg-muted",
            )}
          >
            {t(`views.${key}`)}
            {count !== null &&
              (marker ? (
                count > 0 && (
                  <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-marker px-1.5 text-micro tabular-nums text-marker-foreground">
                    {n(count)}
                  </span>
                )
              ) : (
                <span className={cn("tabular-nums", view === key ? "text-inverse-foreground/80" : "text-muted-foreground")}>{n(count)}</span>
              ))}
          </Link>
        ))}
      </nav>

      {view === "attention" ? <AttentionList cars={flagged} base={base} /> : <CarsLedger view={view} base={base} initial={inventory} />}
    </div>
  );
};

export default CarsPage;
