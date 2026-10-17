"use client";

import type { ReactNode } from "react";
import { useTranslations } from "next-intl";
import { Car } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useFormatters } from "@/hooks/use-formatters";
import { cn } from "@/lib/utils";
import type { CarDetail } from "@/app/[locale]/(site)/cars/[id]/_lib/car-detail-types";
import { useChatCarTitle } from "./CarContactActions";

export function ChatCarSummary({
  car,
  subtitle,
  className,
}: {
  car: CarDetail;
  subtitle?: ReactNode;
  className?: string;
}) {
  const t = useTranslations("chat.dock");
  const fmt = useFormatters();
  const { title, dir } = useChatCarTitle(car);
  const image = car.images?.[0];

  return (
    <div className={cn("flex min-w-0 flex-1 items-start gap-3", className)}>
      <Avatar className="h-12 w-12 shrink-0 rounded-lg">
        {image ? <AvatarImage src={image.url} alt={image.alt ?? title} className="object-cover" /> : null}
        <AvatarFallback className="rounded-lg bg-primary/10">
          <Car className="h-5 w-5 text-primary" />
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold" dir={dir}>
          {title}
        </p>
        <div className="flex items-center gap-2 text-xs">
          <span className="font-semibold text-primary">{fmt.price(car.price, car.priceCurrency)}</span>
          {car.status !== "AVAILABLE" && (
            <span
              className={cn(
                "rounded-full px-1.5 py-px font-medium",
                car.status === "SOLD" ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-700"
              )}
            >
              {car.status === "SOLD" ? t("sold") : t("unavailable")}
            </span>
          )}
        </div>
        {subtitle && <p className="truncate text-xs text-muted-foreground">{subtitle}</p>}
      </div>
    </div>
  );
}

export function ChatCarSummarySkeleton({ image, className }: { image?: string; className?: string }) {
  return (
    <div className={cn("flex min-w-0 flex-1 items-start gap-3", className)} aria-busy="true">
      <Avatar className="h-12 w-12 shrink-0 rounded-lg">
        {image ? <AvatarImage src={image} alt="" className="object-cover" /> : null}
        <AvatarFallback className="rounded-lg bg-muted animate-pulse" />
      </Avatar>
      <div className="min-w-0 flex-1 space-y-1.5 pt-0.5">
        <span className="block h-4 w-40 max-w-full animate-pulse rounded bg-muted" />
        <span className="block h-3 w-24 animate-pulse rounded bg-muted" />
        <span className="block h-3 w-20 animate-pulse rounded bg-muted" />
      </div>
    </div>
  );
}
