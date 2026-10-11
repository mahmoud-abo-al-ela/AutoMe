"use client";

import { useTranslations } from "next-intl";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { useFormatters } from "@/hooks/use-formatters";
import { cn } from "@/lib/utils";

/**
 * Previous, numbered and next page links, for a list or tab with more than one
 * page. A tab keeps the reader's place (`scroll` off); a full-page list may
 * send them back to the top. `linkClassName` adds to each link's classes.
 */
export function Pager({
  page,
  pages,
  href,
  scroll = false,
  linkClassName,
}: {
  page: number;
  pages: number;
  href: (page: number) => string;
  scroll?: boolean;
  linkClassName?: string;
}) {
  const t = useTranslations("superAdmin.organizations.details.pagination");
  const fmt = useFormatters();
  if (pages <= 1) return null;
  const link =
    "flex size-10 items-center justify-center rounded-control border border-border bg-field text-caption font-semibold hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";
  const shown = Array.from({ length: pages }, (_, i) => i + 1).filter(
    (p) => pages <= 7 || p === 1 || p === pages || Math.abs(p - page) <= 1,
  );
  return (
    <nav aria-label={t("label")} className="flex items-center gap-1.5">
      <Link
        href={href(Math.max(1, page - 1))}
        scroll={scroll}
        aria-label={t("previous")}
        aria-disabled={page === 1}
        className={cn(link, linkClassName, page === 1 && "pointer-events-none opacity-40")}
      >
        <ChevronLeft aria-hidden className="size-4 rtl:-scale-x-100" />
      </Link>
      {shown.map((p, i) => (
        <span key={p} className="flex items-center gap-1.5">
          {i > 0 && p - shown[i - 1] > 1 && <span aria-hidden>…</span>}
          <Link
            href={href(p)}
            scroll={scroll}
            aria-current={p === page ? "page" : undefined}
            className={cn(
              link,
              linkClassName,
              p === page && "border-inverse bg-inverse text-inverse-foreground",
            )}
          >
            {fmt.number(p)}
          </Link>
        </span>
      ))}
      <Link
        href={href(Math.min(pages, page + 1))}
        scroll={scroll}
        aria-label={t("next")}
        aria-disabled={page === pages}
        className={cn(link, linkClassName, page === pages && "pointer-events-none opacity-40")}
      >
        <ChevronRight aria-hidden className="size-4 rtl:-scale-x-100" />
      </Link>
    </nav>
  );
}
