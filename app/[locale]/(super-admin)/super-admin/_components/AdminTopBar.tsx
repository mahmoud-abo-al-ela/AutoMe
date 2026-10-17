"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { UserButton } from "@clerk/nextjs";
import { ArrowUpRight, Menu } from "lucide-react";
import { Link, usePathname } from "@/i18n/navigation";
import { Logo, useRememberPlateBand } from "@/components/brand";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import LanguageSwitcher from "@/components/Header/components/LanguageSwitcher";
import { cn } from "@/lib/utils";
import { DrawerNavGroups } from "@/components/dashboard/DrawerNavGroups";
import { ADMIN_SECTIONS as SECTIONS } from "./admin-sections";

const BASE = "/super-admin";

/** The phone menu's groups (DrawerNavGroups): the platform's pulse, the accounts on it, and the oversight of what admins do there. */
const MENU_GROUPS = [
  { key: "platform", keys: ["overview", "analytics"] },
  { key: "accounts", keys: ["organizations", "users", "plans"] },
  { key: "oversight", keys: ["impersonation", "auditLogs"] },
] as const;

/** Overview is current only on its own page; every other section also on the pages under it. */
function isCurrent(pathname: string, path: string) {
  const href = `${BASE}${path}`;
  return path === "" ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
}

/** A square 44px control on the asphalt bar. */
const barIcon =
  "relative flex size-11 shrink-0 items-center justify-center rounded-control text-inverse-foreground transition-colors hover:bg-inverse-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marker";

export function AdminTopBar() {
  const t = useTranslations("superAdmin.nav");
  useRememberPlateBand("admin");
  const locale = useLocale();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-inverse text-inverse-foreground">
      <div className="mx-auto flex w-full max-w-[1760px] flex-wrap items-center gap-x-2 px-2 sm:px-6 md:gap-x-6 md:px-8">
        {/* Phones: the sections are in a sheet. */}
        <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
          <SheetTrigger asChild>
            <button type="button" aria-label={t("openMenu")} className={cn(barIcon, "order-1 md:hidden")}>
              <Menu aria-hidden className="size-[22px]" />
            </button>
          </SheetTrigger>
          <SheetContent
            side="left"
            className="w-72 gap-0 border-inverse-hover bg-inverse p-0 text-inverse-foreground [&>button]:text-inverse-foreground"
          >
            <div className="flex h-16 items-center border-b border-inverse-foreground/10 px-4 pe-12">
              <SheetTitle className="truncate text-body font-semibold text-inverse-foreground">{t("brand")}</SheetTitle>
            </div>
            <DrawerNavGroups
              label={t("label")}
              onNavigate={() => setMenuOpen(false)}
              indicatorClassName="bg-inverse-foreground"
              groups={MENU_GROUPS.map((group) => ({
                key: group.key,
                title: t(`groups.${group.key}`),
                items: SECTIONS.filter(({ key }) => (group.keys as readonly string[]).includes(key)).map(({ key, path }) => ({
                  href: `${BASE}${path}`,
                  label: t(key),
                  current: isCurrent(pathname, path),
                })),
              }))}
            />
            <div className="border-t border-inverse-foreground/10 p-3">
              <Link
                href="/"
                onClick={() => setMenuOpen(false)}
                className="flex h-12 items-center gap-3 rounded-control px-4 text-body text-inverse-foreground/75 hover:bg-inverse-hover hover:text-inverse-foreground"
              >
                <ArrowUpRight aria-hidden className="size-5 rtl:-scale-x-100" />
                {t("backToSite")}
              </Link>
            </div>
          </SheetContent>
        </Sheet>

        <Link
          href={BASE}
          className="order-2 flex h-16 min-w-0 flex-1 items-center rounded-control focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marker md:flex-none xl:h-[72px]"
        >
          <Logo band="admin" className="border-inverse-foreground" />
          <span className="sr-only">{t("overview")}</span>
        </Link>

        <div className="order-3 ms-auto flex items-center gap-1 sm:gap-2 xl:order-4 xl:ms-0">
          <Link
            href="/"
            className="hidden h-11 items-center gap-1.5 rounded-control px-3 text-caption font-medium text-inverse-foreground/70 hover:bg-inverse-hover hover:text-inverse-foreground md:inline-flex"
          >
            {t("backToSite")}
            <ArrowUpRight aria-hidden className="size-4 rtl:-scale-x-100" />
          </Link>
          {/* Phones too: the menu no longer repeats it. */}
          <LanguageSwitcher
            showLabel={false}
            className="inline-flex size-11 text-inverse-foreground/80 hover:bg-inverse-hover hover:text-inverse-foreground [&_svg]:size-5"
          />
          <span className="flex size-11 items-center justify-center">
            <UserButton />
          </span>
        </div>

        {/* md and up: the sections as tabs; below xl they take their own row. */}
        <nav
          aria-label={t("label")}
          className="order-4 -mx-6 hidden w-[calc(100%+3rem)] overflow-x-auto border-t border-inverse-foreground/10 px-4 [scrollbar-width:none] md:-mx-8 md:block md:w-[calc(100%+4rem)] xl:order-3 xl:mx-0 xl:w-auto xl:flex-1 xl:border-0 xl:px-0 [&::-webkit-scrollbar]:hidden"
        >
          <ul className="flex">
            {SECTIONS.map(({ key, path }) => {
              const current = isCurrent(pathname, path);
              return (
                <li key={key} className="shrink-0">
                  <Link
                    href={`${BASE}${path}`}
                    aria-current={current ? "page" : undefined}
                    className={cn(
                      "relative flex h-12 items-center whitespace-nowrap px-3 text-caption transition-colors xl:h-[72px]",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-marker",
                      current ? "font-semibold text-inverse-foreground" : "font-medium text-inverse-foreground/70 hover:text-inverse-foreground",
                    )}
                  >
                    {t(key)}
                    {current && <span aria-hidden className="absolute inset-x-3 bottom-0 h-[3px] rounded-t-full bg-inverse-foreground" />}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </header>
  );
}
