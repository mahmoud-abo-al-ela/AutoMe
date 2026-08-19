"use client";

import { useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Languages } from "lucide-react";
import { usePathname, useRouter } from "@/i18n/navigation";
import { routing, localeLabels, type Locale } from "@/i18n/routing";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Language switcher.
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

  const switchTo = (next: Locale) => {
    if (next === locale) return;
    startTransition(() => {
      // Passing the params through unchanged keeps dynamic segments intact;
      // only the locale changes.
      router.replace(pathname, { locale: next });
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label={t("label")}
          disabled={isPending}
          className={cn("cursor-pointer", className)}
        >
          <Languages className="h-5 w-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {routing.locales.map((option) => (
          <DropdownMenuItem
            key={option}
            onClick={() => switchTo(option)}
            className={cn(
              "cursor-pointer",
              option === locale && "font-semibold"
            )}
            // The language name is always written in its own script, never
            // translated — someone who cannot read the current UI language has
            // to be able to find their own.
            lang={option}
            dir={option === "ar" ? "rtl" : "ltr"}
          >
            {localeLabels[option]}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
