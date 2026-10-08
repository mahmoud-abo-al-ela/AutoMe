"use client";

import { ArrowUpRight, Info } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { BuyerAction } from "@/lib/auth/buyer-policy";
import { useBuyerAccess, type BuyerTarget } from "./BuyerAccessProvider";

/**
 * Stands in for buyer buttons the viewer may not use: why, and where to go
 * instead (the dealership's admin record, or the dealer's own dashboard).
 * Renders nothing when `action` is allowed, so it can sit beside the buttons
 * it replaces.
 */
export function BuyerAccessNotice({
  action,
  target,
  className,
}: {
  action: BuyerAction;
  target?: BuyerTarget | null;
  className?: string;
}) {
  const t = useTranslations("common.buyerAccess");
  const notice = useBuyerAccess(target).noticeFor(action);
  if (!notice) return null;

  const { reason, onCar, href } = notice;
  // A dealer's own car reads differently from their own dealership.
  const key = reason === "ownDealership" && onCar ? "ownListing" : reason;
  const linkLabel =
    reason === "platformAdmin" ? t("openInAdmin") : t(onCar ? "manageCar" : "manageDealership");
  const linkClass = cn(buttonVariants({ variant: "outline-strong", size: "control" }), "w-full");

  return (
    <div role="note" className={cn("flex flex-col gap-3 rounded-control border border-border bg-field p-4", className)}>
      <div className="flex gap-3">
        <Info aria-hidden className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
        <div className="flex min-w-0 flex-col gap-1">
          <p className="text-caption font-semibold">{t(`${key}.title`)}</p>
          {/* The admin notice is a title and a link; the others explain. */}
          {t.has(`${key}.body`) && <p className="text-micro text-muted-foreground">{t(`${key}.body`)}</p>}
        </div>
      </div>
      {href &&
        (href.external ? (
          <a href={href.url} className={linkClass}>
            {linkLabel}
            <ArrowUpRight aria-hidden className="rtl:-scale-x-100" />
          </a>
        ) : (
          <Link href={href.url} className={linkClass}>
            {linkLabel}
          </Link>
        ))}
    </div>
  );
}
