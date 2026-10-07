"use client";

import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import type { Channel } from "stream-chat";
import { CarFront } from "lucide-react";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { Button, buttonVariants } from "@/components/ui/button";
import { PricePlate } from "@/components/brand/PricePlate";
import { usePriceVerdictText } from "@/components/brand/FairPriceGauge";
import { getDealContext } from "@/actions/dashboard";
import { useFormatters } from "@/hooks/use-formatters";
import { useConversationSide } from "@/components/StreamChat/ConversationHeader";
import { resolveCarTitle } from "@/lib/utils/car-text";
import { queryKeys } from "@/lib/query-client";
import { cn } from "@/lib/utils";
import { compose, testDriveLink } from "./compose";

const VERDICT_TONE = { below: "text-price-below", above: "text-price-above", fair: "text-foreground", unknown: "text-muted-foreground" } as const;
const DRIVE_STATUS = { PENDING: "PENDING", CONFIRMED: "CONFIRMED", COMPLETED: "COMPLETED", CANCELLED: "CANCELLED" } as const;

/**
 * The deal for a conversation, fetched once and shared by the header's car
 * strip and the panel (same query key).
 */
export function useDeal(channel: Channel) {
  const { buyer } = useConversationSide(channel);
  const buyerId = buyer?.id ?? channel.data?.created_by?.id ?? null;
  const carId = channel.data?.car_data?.id ?? (channel.data?.car_id as string | undefined) ?? null;
  return useQuery({
    queryKey: [...queryKeys.cars.all, "deal", buyerId, carId],
    queryFn: async () => {
      const response = await getDealContext({ buyerId, carId });
      if (!response.success) throw response.error;
      return response.data;
    },
    enabled: !!buyerId,
    staleTime: 60_000,
  });
}

/**
 * The deal beside the conversation (canvas: 2 · Sales desk): the car with its
 * licence-plate price and where that sits among similar cars, then what this
 * buyer has done with the dealership — saves, other cars, test drives — and
 * the two moves that follow: send the booking link, or open the car.
 */
export function DealPanel({ channel, base, className }: { channel: Channel; base: string; className?: string }) {
  const t = useTranslations("org.messages");
  const tMessages = useTranslations("org.messages.quick");
  const tStatus = useTranslations("org.testDrives.status");
  const fmt = useFormatters();
  const locale = useLocale() as Locale;
  const { buyer } = useConversationSide(channel);
  const query = useDeal(channel);
  const deal = query.data;
  const verdict = usePriceVerdictText(deal?.market?.percent ?? null);
  const name = deal?.buyer.name || buyer?.name || t("row.unknownBuyer");

  if (query.isError) {
    return (
      <div className={cn("flex flex-col items-start gap-3 p-4", className)}>
        <p role="alert" className="text-caption">{t("deal.loadFailed")}</p>
        <Button variant="outline-strong" size="control" onClick={() => query.refetch()}>
          {t("deal.title")}
        </Button>
      </div>
    );
  }

  if (!deal) {
    return (
      <div aria-busy className={cn("flex flex-col gap-3 p-4", className)}>
        <span className="skeleton-shimmer h-40 rounded-control" />
        <span className="skeleton-shimmer h-5 w-2/3 rounded" />
        <span className="skeleton-shimmer h-24 rounded-control" />
      </div>
    );
  }

  const car = deal.car;
  const carName = car ? (resolveCarTitle(car, locale)?.text ?? `${car.make} ${car.model} ${fmt.number(car.year, { useGrouping: false })}`) : null;

  return (
    <div className={cn("flex min-h-0 flex-col gap-4 overflow-y-auto p-4", className)}>
      {car ? (
        <section aria-label={carName ?? undefined} className="overflow-hidden rounded-control border border-border bg-field">
          <span className="relative flex h-40 items-center justify-center bg-muted">
            {car.image ? <Image src={car.image} alt="" fill sizes="340px" className="object-cover" /> : <CarFront aria-hidden className="size-8 text-muted-foreground" />}
          </span>
          <div className="flex flex-col gap-2.5 p-3">
            <p dir="auto" className="text-body font-semibold">{carName}</p>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <PricePlate amount={car.price} currency={car.priceCurrency} size="sm" />
              <span className={cn("text-caption font-semibold", VERDICT_TONE[verdict.verdict])}>{verdict.text}</span>
            </div>
            <p className="text-caption text-muted-foreground">
              {deal.market
                ? t("deal.fair", { price: fmt.price(deal.market.median, car.priceCurrency), count: fmt.number(deal.market.listings) })
                : t("deal.unknownMarket")}
            </p>
            <p className="text-micro text-muted-foreground">{t("deal.saves", { count: car.saves, value: fmt.number(car.saves) })}</p>
          </div>
        </section>
      ) : (
        <p className="rounded-control bg-muted/60 px-3 py-2.5 text-caption text-muted-foreground">{t("deal.notOurs")}</p>
      )}

      <section aria-labelledby="with-you" className="rounded-control border border-border bg-field p-3">
        <h3 id="with-you" className="mb-2 text-caption font-semibold">
          {t("deal.withYou", { name })}
        </h3>
        <ul className="flex flex-col gap-1.5 text-caption">
          {deal.buyer.savedThisAt && <Item>{t("deal.savedThis", { when: fmt.relativeToNow(deal.buyer.savedThisAt, { addSuffix: true }) })}</Item>}
          {deal.buyer.savedOthers > 0 && <Item>{t("deal.savedOthers", { count: deal.buyer.savedOthers, value: fmt.number(deal.buyer.savedOthers) })}</Item>}
          {deal.buyer.drives.map((drive) => (
            <Item key={drive.id} tone={drive.status === "PENDING" ? "amber" : undefined}>
              {t("deal.drive", {
                day: fmt.date(`${drive.date}T00:00:00Z`, { weekday: "long", day: "numeric", month: "long", year: undefined, timeZone: "UTC" }),
                status: tStatus(DRIVE_STATUS[drive.status]),
              })}
            </Item>
          ))}
          {!deal.buyer.savedThisAt && deal.buyer.savedOthers === 0 && deal.buyer.drives.length === 0 && (
            <li className="text-muted-foreground">{t("deal.nothingYet")}</li>
          )}
        </ul>
      </section>

      {car && (
        <div className="mt-auto flex flex-col gap-2">
          <Button variant="inverse" size="control" className="h-11" onClick={() => compose(channel, tMessages("testDrive", { link: testDriveLink(car.id) }))}>
            {t("deal.sendLink")}
          </Button>
          <Link href={`${base}/cars/${car.id}/edit`} className={cn(buttonVariants({ variant: "outline-strong", size: "control" }), "h-11 border bg-field")}>
            {t("deal.openCar")}
          </Link>
        </div>
      )}
    </div>
  );
}

function Item({ children, tone }: { children: React.ReactNode; tone?: "amber" }) {
  return (
    <li className={cn("flex items-start gap-2", tone === "amber" && "font-semibold text-[#8a5e00]")}>
      <span aria-hidden className={cn("mt-1.5 size-2 shrink-0 rounded-full", tone === "amber" ? "bg-[#a87200]" : "bg-[#1d4e9e]")} />
      <span>{children}</span>
    </li>
  );
}
