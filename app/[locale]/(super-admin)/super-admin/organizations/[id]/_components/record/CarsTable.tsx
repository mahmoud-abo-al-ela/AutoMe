"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { CarFront } from "lucide-react";
import { useFormatters } from "@/hooks/use-formatters";
import { cairoNow } from "@/lib/utils/datetime";
import { cn } from "@/lib/utils";
import type { DealershipDetail } from "@/lib/services/super-admin/dealership-detail";
import { CAR_TONES, td, th } from "./record-styles";

type Car = Extract<
  DealershipDetail,
  { summary: unknown }
>["summary"]["cars"][number];

/** A car's first photo, or a plain car shape when it has none. */
function Thumb({ src }: { src: string | null }) {
  return (
    <span className="relative flex h-11 w-16 shrink-0 items-center justify-center overflow-hidden rounded-[8px] bg-muted text-muted-foreground">
      {src ? (
        <Image src={src} alt="" fill sizes="64px" className="object-cover" />
      ) : (
        <CarFront aria-hidden className="size-5" />
      )}
    </span>
  );
}

/**
 * Cars as rows — photo, name, price, status, buyer interest and how long it
 * has been listed. The summary shows the newest five; the Cars tab, a page.
 */
export function CarsTable({
  cars,
  interest = true,
}: {
  cars: Car[];
  interest?: boolean;
}) {
  const t = useTranslations("superAdmin.organizations.details.cars");
  const tStatus = useTranslations("org.cars.ledger.status");
  const fmt = useFormatters();
  const today = cairoNow().date;
  const listed = (iso: string) => {
    const days = Math.round(
      (Date.parse(`${today}T00:00:00Z`) -
        Date.parse(`${cairoNow(new Date(iso)).date}T00:00:00Z`)) /
        86_400_000,
    );
    return days <= 0
      ? t("today")
      : t("days", { count: days, value: fmt.number(days) });
  };
  const name = (car: Car) => (
    <bdi>
      {car.make} {car.model} {fmt.number(car.year, { useGrouping: false })}
    </bdi>
  );
  const status = (car: Car) => (
    <span
      className={cn(
        "whitespace-nowrap rounded-full px-2.5 py-0.5 text-micro font-bold",
        CAR_TONES[car.status],
      )}
    >
      {tStatus(car.status)}
    </span>
  );
  return (
    <>
      {/* Phones: one card per car, the interest as three small figures. */}
      <ul className="flex flex-col border-t border-border lg:hidden">
        {cars.map((car) => (
          <li
            key={car.id}
            className="flex flex-col gap-2.5 border-b border-border px-4 py-3 last:border-b-0"
          >
            <div className="flex items-center gap-3">
              <Thumb src={car.image} />
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">{name(car)}</p>
                <p className="text-micro text-muted-foreground">
                  {fmt.mileage(car.mileage)}
                  {fmt.locale === "ar" ? "، " : ", "}
                  {listed(car.createdAt)}
                </p>
              </div>
              {status(car)}
            </div>
            <div className="flex items-end justify-between gap-3">
              <p className="font-semibold tabular-nums">
                {fmt.price(car.price)}
              </p>
              {interest && (
                <dl className="flex gap-4 text-center text-micro text-muted-foreground">
                  {(
                    [
                      ["saves", car.saves],
                      ["questions", car.questions],
                      ["drives", car.drives],
                    ] as const
                  ).map(([key, value]) => (
                    <div key={key}>
                      <dd className="text-caption font-semibold text-foreground tabular-nums">
                        {fmt.number(value)}
                      </dd>
                      <dt>{t(key)}</dt>
                    </div>
                  ))}
                </dl>
              )}
            </div>
          </li>
        ))}
      </ul>
      <div className="relative hidden overflow-x-auto lg:block">
        <table
          className={cn(
            "w-full border-collapse text-caption",
            interest ? "min-w-[880px]" : "min-w-[600px]",
          )}
        >
          <thead>
            <tr className="whitespace-nowrap border-y border-border bg-muted/60 text-muted-foreground">
              <th scope="col" className={th}>
                {t("car")}
              </th>
              <th scope="col" className={th}>
                {t("price")}
              </th>
              <th scope="col" className={th}>
                {t("status")}
              </th>
              {interest && (
                <>
                  <th scope="col" className={th}>
                    {t("saves")}
                  </th>
                  <th scope="col" className={th}>
                    {t("questions")}
                  </th>
                  <th scope="col" className={th}>
                    {t("drives")}
                  </th>
                </>
              )}
              <th scope="col" className={th}>
                {t("listed")}
              </th>
            </tr>
          </thead>
          <tbody>
            {cars.map((car) => (
              <tr
                key={car.id}
                className="border-b border-border last:border-b-0"
              >
                <td className={td}>
                  <div className="flex items-center gap-3">
                    <Thumb src={car.image} />
                    <div className="min-w-0">
                      <p className="font-semibold">
                        <bdi>
                          {car.make} {car.model}{" "}
                          {fmt.number(car.year, { useGrouping: false })}
                        </bdi>
                      </p>
                      <p className="text-micro text-muted-foreground">
                        {fmt.mileage(car.mileage)}
                      </p>
                    </div>
                  </div>
                </td>
                <td className={cn(td, "whitespace-nowrap tabular-nums")}>
                  {fmt.price(car.price)}
                </td>
                <td className={td}>
                  <span
                    className={cn(
                      "whitespace-nowrap rounded-full px-2.5 py-0.5 text-micro font-bold",
                      CAR_TONES[car.status],
                    )}
                  >
                    {tStatus(car.status)}
                  </span>
                </td>
                {interest && (
                  <>
                    <td className={cn(td, "tabular-nums")}>
                      {fmt.number(car.saves)}
                    </td>
                    <td className={cn(td, "tabular-nums")}>
                      {fmt.number(car.questions)}
                    </td>
                    <td className={cn(td, "tabular-nums")}>
                      {fmt.number(car.drives)}
                    </td>
                  </>
                )}
                <td
                  className={cn(td, "whitespace-nowrap text-muted-foreground")}
                >
                  {listed(car.createdAt)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
