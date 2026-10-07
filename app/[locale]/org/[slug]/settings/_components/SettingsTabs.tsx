"use client";

import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

const TABS = [
  { key: "storefront", path: "" },
  { key: "team", path: "/team" },
  // The weekly summary's own address, which its emails link to.
  { key: "emails", path: "/weekly-summary" },
] as const;

/** Settings' three tabs, as links: each is its own page and address. */
export function SettingsTabs({ base }: { base: string }) {
  const t = useTranslations("org.settings.tabs");
  const pathname = usePathname();
  const current = TABS.find(({ path }) => path && pathname.endsWith(`/settings${path}`))?.key ?? "storefront";

  return (
    <nav aria-label={t("label")} className="flex flex-wrap gap-2">
      {TABS.map(({ key, path }) => (
        <Link
          key={key}
          href={`${base}${path}`}
          aria-current={current === key ? "page" : undefined}
          className={cn(
            "flex h-10 items-center whitespace-nowrap rounded-full px-4 text-caption font-semibold transition-colors sm:h-11",
            current === key ? "bg-inverse text-inverse-foreground" : "border border-[#8c8170] bg-card hover:bg-muted",
          )}
        >
          {t(key)}
        </Link>
      ))}
    </nav>
  );
}
