"use client";

import { Button } from "@/components/ui/button";
import { MessageSquare } from "lucide-react";
import { useUser } from "@clerk/nextjs";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { StartConversationButton, carChatReturnPath, useChatDock } from "@/components/StreamChat";
import { PricePlate } from "@/components/brand";
import { useAuthRedirects } from "@/hooks/use-auth-redirects";
import { useBuyerAccess } from "@/components/BuyerAccess";
import { useFormatters } from "@/hooks/use-formatters";
import { resolveCarTitle } from "@/lib/utils/car-text";
import type { Locale } from "@/i18n/routing";
import type { CarDetail } from "../_lib/car-detail-types";

/**
 * Phones and tablets: the price and the one primary action, pinned to the
 * bottom (Figma: Car detail — mobile, sticky action bar). The site's tab bar
 * steps aside on this page so the two never stack.
 */
const MobileStickyBar = ({ car }: { car: CarDetail }) => {
  const t = useTranslations("carDetail.actions");
  const locale = useLocale() as Locale;
  const fmt = useFormatters();
  const { isSignedIn } = useUser();
  const router = useRouter();
  const { openCarChat } = useChatDock();
  const { signInTo } = useAuthRedirects();
  const { can } = useBuyerAccess();
  // The title in the reader's language, as on the page above — `car.title`
  // alone was the English one on the Arabic page.
  const title = resolveCarTitle(car, locale)?.text ?? `${fmt.number(car.year, { useGrouping: false })} ${car.make} ${car.model}`;

  return (
    <>
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md lg:hidden">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-3">
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <PricePlate amount={car.price} currency={car.priceCurrency} size="sm" className="self-start" />
            <span className="truncate text-micro text-muted-foreground">{title}</span>
          </div>
          {/* No chat for staff or the dealer's own team; the card above says why. */}
          {!can("message") ? null : isSignedIn ? (
            <StartConversationButton carId={car.id} onChatOpen={openCarChat} variant="marker" size="xl" />
          ) : (
            <Button
              variant="marker"
              size="xl"
              // Sign in, then back to this car with its chat open.
              onClick={() => router.push(signInTo(carChatReturnPath(car.id)))}
            >
              <MessageSquare />
              {t("chatNow")}
            </Button>
          )}
        </div>
      </div>

      {/* Keeps the end of the page clear of the bar. */}
      <div aria-hidden className="h-24 lg:hidden" />
    </>
  );
};

export default MobileStickyBar;
