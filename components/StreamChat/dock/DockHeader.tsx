"use client";

import { useLocale, useTranslations } from "next-intl";
import { CalendarCheck, Car, ExternalLink, Minus, Phone, X } from "lucide-react";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useFormatters } from "@/hooks/use-formatters";
import { resolveCarTitle } from "@/lib/utils/car-text";
import { telHref, whatsappHref } from "@/lib/utils/phone";
import { cn } from "@/lib/utils";
import type { CarDetail } from "@/app/[locale]/(site)/cars/[id]/_lib/car-detail-types";

/** WhatsApp's mark; lucide has no brand icons. */
function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.64.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.03-.52-.07-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48 0 1.46 1.07 2.88 1.21 3.08.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.69.63.71.23 1.36.2 1.87.12.57-.09 1.76-.72 2.01-1.41.25-.7.25-1.29.17-1.41-.07-.12-.27-.2-.57-.35zM12.05 21.5h-.01a9.4 9.4 0 0 1-4.8-1.32l-.34-.2-3.57.94.95-3.48-.22-.36a9.43 9.43 0 1 1 7.99 4.42zm8.03-17.46A11.27 11.27 0 0 0 12.05.7C5.8.7.7 5.8.7 12.05c0 2 .52 3.95 1.52 5.66L.6 23.4l5.83-1.53a11.3 11.3 0 0 0 5.62 1.43h.01c6.25 0 11.35-5.1 11.35-11.35 0-3.03-1.18-5.88-3.33-8.03z" />
    </svg>
  );
}

const ACTION =
  "inline-flex items-center gap-1.5 rounded-full border bg-background px-2.5 py-1 text-xs font-medium hover:bg-muted transition-colors";

/**
 * The top of the floating chat: the car as it is now (live price and status,
 * not the snapshot taken when the conversation started), who is selling it,
 * and the ways to reach them outside the chat — as marketplace apps pin the
 * listing above every conversation.
 */
export function DockHeader({
  car,
  onCarPage,
  onMinimize,
  onClose,
}: {
  car: CarDetail;
  /** Already on this car's page: "View car" would go nowhere. */
  onCarPage: boolean;
  onMinimize: () => void;
  onClose: () => void;
}) {
  const t = useTranslations("chat.dock");
  const locale = useLocale() as Locale;
  const fmt = useFormatters();
  const dealer = car.organization;

  const resolved = resolveCarTitle(car, locale);
  const title =
    resolved?.text ?? `${fmt.number(car.year, { useGrouping: false })} ${car.make} ${car.model}`;
  const call = telHref(dealer?.phone);
  const whatsapp = whatsappHref(dealer?.phone, t("whatsappText", { car: title }));
  const available = car.status === "AVAILABLE";

  return (
    <div className="shrink-0 border-b bg-background">
      <div className="flex items-start gap-3 px-3 pt-3">
        <Avatar className="h-12 w-12 rounded-lg">
          {car.images?.[0] ? (
            <AvatarImage src={car.images[0].url} alt={car.images[0].alt ?? title} className="object-cover" />
          ) : null}
          <AvatarFallback className="rounded-lg bg-primary/10">
            <Car className="h-5 w-5 text-primary" />
          </AvatarFallback>
        </Avatar>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold" dir={resolved?.locale === "ar" ? "rtl" : undefined}>
            {title}
          </p>
          <div className="flex items-center gap-2 text-xs">
            <span className="font-semibold text-primary">{fmt.price(car.price, car.priceCurrency)}</span>
            {!available && (
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
          {dealer?.name && <p className="truncate text-xs text-muted-foreground">{dealer.name}</p>}
        </div>

        <div className="flex shrink-0 items-center">
          <button
            type="button"
            onClick={onMinimize}
            className="cursor-pointer rounded-full p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label={t("minimize")}
          >
            <Minus className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer rounded-full p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label={t("close")}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="flex gap-1.5 overflow-x-auto px-3 py-2 [scrollbar-width:none]">
        {call && (
          <a href={call} className={ACTION}>
            <Phone className="h-3.5 w-3.5" aria-hidden />
            {t("call")}
          </a>
        )}
        {whatsapp && (
          <a href={whatsapp} target="_blank" rel="noopener noreferrer" className={cn(ACTION, "text-[#128C7E]")}>
            <WhatsAppIcon className="h-3.5 w-3.5" />
            {t("whatsapp")}
          </a>
        )}
        {available && (
          <Link href={`/test-drive?carId=${car.id}`} className={ACTION}>
            <CalendarCheck className="h-3.5 w-3.5" aria-hidden />
            {t("testDrive")}
          </Link>
        )}
        {!onCarPage && (
          <Link href={`/cars/${car.id}`} className={ACTION}>
            <ExternalLink className="h-3.5 w-3.5" aria-hidden />
            {t("viewCar")}
          </Link>
        )}
      </div>
    </div>
  );
}
