"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useCarAttributes } from "@/hooks/use-car-attributes";
import { useFormatters } from "@/hooks/use-formatters";
import {
  Bars,
  Change,
  Panel,
  Stat,
  type Of,
} from "./report-parts";

/** New buyers, what they did, the cars they saved most, and the body types they want. */
export function BuyersReport({ data }: { data: Of<"buyers"> }) {
  const t = useTranslations("superAdmin.analytics.buyers");
  const fmt = useFormatters();
  const attrs = useCarAttributes();
  const n = (value: number) => fmt.number(value);

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label={t("joined")} value={n(data.joined.current)} note={<Change pair={data.joined} />} />
        <Stat label={t("saved")} value={n(data.saved.current)} note={<Change pair={data.saved} />} />
        <Stat label={t("askedToDrive")} value={n(data.askedToDrive.current)} note={<Change pair={data.askedToDrive} />} />
        <Stat label={t("askedAgain")} value={n(data.askedAgain.current)} note={<Change pair={data.askedAgain} />} />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Panel title={t("mostSaved")} note={t("mostSavedNote")}>
          {data.mostSaved.length === 0 ? (
            <p className="px-5 py-8 text-center text-caption text-muted-foreground">{t("empty")}</p>
          ) : (
            <ol className="flex flex-col">
              {data.mostSaved.map((car, i) => (
                <li key={car.id} className="flex items-center gap-3 border-b border-border px-5 py-3 text-caption last:border-b-0">
                  <span className="w-5 shrink-0 text-muted-foreground tabular-nums">{n(i + 1)}</span>
                  <span className="min-w-0 flex-1">
                    {/* A car's name stays Latin, its year included, as everywhere else. */}
                    <span className="block truncate font-semibold">
                      <bdi dir="ltr">{`${car.make} ${car.model} ${car.year}`}</bdi>
                    </span>
                    <span className="block truncate text-micro text-muted-foreground">
                      <Link href={`/super-admin/organizations/${car.organization.id}`} className="underline-offset-2 hover:text-[#1d4e9e] hover:underline">
                        <bdi>{car.organization.name}</bdi>
                      </Link>
                      {" · "}
                      {fmt.price(car.price)}
                    </span>
                  </span>
                  {/* The panel's note says what the number counts; the sentence is for screen readers. */}
                  <span className="relative shrink-0 text-body font-bold tabular-nums">
                    <span aria-hidden>{n(car.saves)}</span>
                    <span className="sr-only">{t("saves", { count: car.saves, value: n(car.saves) })}</span>
                  </span>
                </li>
              ))}
            </ol>
          )}
        </Panel>
        <Panel title={t("bodyTypes")} note={t("bodyTypesNote")}>
          <Bars rows={data.bodyTypes.map((row) => ({ key: row.key, label: attrs.body(row.key), value: row.count }))} empty={t("empty")} />
        </Panel>
      </div>
    </div>
  );
}
