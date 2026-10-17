"use client";

import { useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Languages } from "lucide-react";
import { usePathname, useRouter } from "@/i18n/navigation";
import { routing, localeLabels, type Locale } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function LanguageSwitcher({
  className,
  showLabel = true,
  onSwitch,
}: {
  className?: string;
  /** Hidden in the collapsed org sidebar, where 64px fits an icon and
   * nothing else. The aria-label still names the target language, so the
   * control stays readable to a screen reader either way. */
  showLabel?: boolean;
  /** Fired after a switch is started — the mobile org sidebar closes its
   * sheet on it, which client-side navigation alone does not do. */
  onSwitch?: () => void;
}) {
  const t = useTranslations("common.language");
  const locale = useLocale() as Locale;
  const pathname = usePathname();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const otherLocale = routing.locales.find((l) => l !== locale) ?? locale;
  const otherLabel = localeLabels[otherLocale];

  const switchLanguage = () => {
    if (otherLocale === locale) return;
    onSwitch?.();
    startTransition(() => {
      // Passing the params through unchanged keeps dynamic segments intact;
      // only the locale changes.
      router.replace(`${pathname}${window.location.search}`, {
        locale: otherLocale,
      });
    });
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={switchLanguage}
      disabled={isPending}
      aria-label={t("switchTo", { language: otherLabel })}
      className={cn("cursor-pointer gap-1.5 px-2", className)}
    >
      <Languages className="h-5 w-5" />
      {/* The language name is always written in its own script, never
          translated — someone who cannot read the current UI language has to
          be able to find their own. */}
      {showLabel && (
        <span
          lang={otherLocale}
          dir={otherLocale === "ar" ? "rtl" : "ltr"}
          className="text-sm font-medium"
        >
          {otherLabel}
        </span>
      )}
    </Button>
  );
}
