"use client";

import { useLocale, useTranslations } from "next-intl";
import { CalendarCheck, ExternalLink, Phone } from "lucide-react";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
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
  "inline-flex shrink-0 items-center gap-1.5 rounded-full border bg-background px-2.5 py-1 text-xs font-medium hover:bg-muted transition-colors";

/** The car's title in the reader's language, or "2020 Toyota Corolla". */
export function useChatCarTitle(car: CarDetail) {
  const locale = useLocale() as Locale;
  const fmt = useFormatters();
  const resolved = resolveCarTitle(car, locale);
  return {
    title: resolved?.text ?? `${fmt.number(car.year, { useGrouping: false })} ${car.make} ${car.model}`,
    dir: resolved?.locale === "ar" ? ("rtl" as const) : undefined,
  };
}

/**
 * The ways out of the chat, as marketplace apps offer them above every
 * conversation. A buyer gets Call and WhatsApp (the dealership's phone;
 * WhatsApp only for a mobile), Test drive while the car is available, and
 * View car. A dealer's side has no buyer phone to offer, so only View car.
 */
export function CarContactActions({
  car,
  audience,
  showViewCar = true,
  className,
}: {
  car: CarDetail;
  audience: "buyer" | "dealer";
  showViewCar?: boolean;
  className?: string;
}) {
  const t = useTranslations("chat.dock");
  const { title } = useChatCarTitle(car);
  const phone = audience === "buyer" ? car.organization?.phone : null;
  const call = telHref(phone);
  const whatsapp = whatsappHref(phone, t("whatsappText", { car: title }));
  const testDrive = audience === "buyer" && car.status === "AVAILABLE";

  if (!call && !whatsapp && !testDrive && !showViewCar) return null;
  return (
    <div className={cn("flex gap-1.5 overflow-x-auto [scrollbar-width:none]", className)}>
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
      {testDrive && (
        <Link href={`/test-drive?carId=${car.id}`} className={ACTION}>
          <CalendarCheck className="h-3.5 w-3.5" aria-hidden />
          {t("testDrive")}
        </Link>
      )}
      {showViewCar && (
        <Link href={`/cars/${car.id}`} className={ACTION}>
          <ExternalLink className="h-3.5 w-3.5" aria-hidden />
          {t("viewCar")}
        </Link>
      )}
    </div>
  );
}
