"use client";

import { useId, useState, useTransition } from "react";
import { Languages } from "lucide-react";
import { usePathname, useRouter } from "@/i18n/navigation";
import { localeDirection, type Locale } from "@/i18n/routing";
import { rememberLocaleChoice } from "@/lib/utils/locale-suggestion";
import { Button } from "@/components/ui/button";

/**
 * The bar itself; `LocaleSuggestion` decides whether it renders at all.
 *
 * It sits fixed just under the (fixed) header, over the top of the page,
 * rather than in the flow: there is no in-flow slot above a fixed header, and
 * overlaying means dismissing it moves nothing. z-40 keeps it beneath the
 * header's open mobile menu.
 *
 * Both buttons record the choice, so the offer is made once. Dismissing
 * records the page's language — "keep English" is as much a choice as
 * switching. `data-nosnippet` because a crawler that sends Accept-Language
 * would otherwise index an English sentence as part of an Arabic page.
 */
export default function LocaleSuggestionBanner({
  current,
  suggested,
  body,
  acceptLabel,
  dismissLabel,
}: {
  current: Locale;
  suggested: Locale;
  body: string;
  acceptLabel: string;
  dismissLabel: string;
}) {
  const [open, setOpen] = useState(true);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const pathname = usePathname();
  const bodyId = useId();

  if (!open) return null;

  const accept = () => {
    rememberLocaleChoice(suggested);
    startTransition(() => {
      // Same page, other language, filters intact.
      router.replace(`${pathname}${window.location.search}`, {
        locale: suggested,
      });
    });
  };

  const dismiss = () => {
    rememberLocaleChoice(current);
    setOpen(false);
  };

  return (
    <div
      role="region"
      aria-labelledby={bodyId}
      lang={suggested}
      dir={localeDirection[suggested]}
      data-nosnippet=""
      className="fixed inset-x-0 top-14 z-40 border-b border-primary/20 bg-primary text-primary-foreground shadow-md md:top-16"
    >
      <div className="container mx-auto flex flex-wrap items-center justify-center gap-x-4 gap-y-2 px-4 py-2 text-sm">
        <p id={bodyId} className="flex items-center gap-2">
          <Languages className="h-4 w-4 shrink-0" aria-hidden="true" />
          {body}
        </p>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="secondary"
            onClick={accept}
            disabled={isPending}
            className="cursor-pointer"
          >
            {acceptLabel}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={dismiss}
            className="cursor-pointer hover:bg-primary-foreground/10 hover:text-primary-foreground"
          >
            {dismissLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
