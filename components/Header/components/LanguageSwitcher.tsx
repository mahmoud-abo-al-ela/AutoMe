"use client";

import { useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Languages } from "lucide-react";
import { usePathname, useRouter } from "@/i18n/navigation";
import { routing, localeLabels, type Locale } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Language switcher.
 *
 * With exactly two locales a dropdown is one interaction too many, so this is
 * a direct toggle: it names the language you would switch *to*, not the one
 * you are already reading. Reading "English" while the page is Arabic is the
 * affordance — a control labelled with the current language tells you nothing
 * you cannot already see. If a third locale is ever added this has to go back
 * to being a menu; `otherLocale` will throw that into relief rather than
 * silently hiding a locale.
 *
 * `usePathname` here is next-intl's, which returns the path *without* the
 * locale prefix — that is what makes switching stay on the current page
 * instead of dropping the reader on the home page. `router.replace` rather
 * than `push` so the switch does not add a history entry: pressing Back after
 * changing language should leave the page you came from, not bounce you
 * between translations of the same one.
 */
export default function LanguageSwitcher({
  className,
}: {
  className?: string;
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
    startTransition(() => {
      // Passing the params through unchanged keeps dynamic segments intact;
      // only the locale changes.
      router.replace(pathname, { locale: otherLocale });
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
      <span
        lang={otherLocale}
        dir={otherLocale === "ar" ? "rtl" : "ltr"}
        className="text-sm font-medium"
      >
        {otherLabel}
      </span>
    </Button>
  );
}
