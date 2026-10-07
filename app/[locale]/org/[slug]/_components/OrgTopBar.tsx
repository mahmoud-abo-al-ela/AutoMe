"use client";

import { useState } from "react";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { UserButton } from "@clerk/nextjs";
import { ChevronDown, Menu, MessageSquare } from "lucide-react";
import { Link, usePathname } from "@/i18n/navigation";
import { Logo } from "@/components/brand";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import LanguageSwitcher from "@/components/Header/components/LanguageSwitcher";
import { OrgUnreadBadge } from "@/components/StreamChat";
import { sidebarItems } from "@/lib/SidebarConfig";
import { cn } from "@/lib/utils";
import type { MemberRole, Organization } from "@/lib/generated/prisma";

/** Billing, the audit log and settings are the owner's. A platform admin or
 * an impersonator has no membership role, so they don't see them either. */
const OWNER_ONLY = new Set<string>(["billing", "audit-logs", "settings"]);

/** A section is current on its own page and everything under it: Cars stays
 * lit on /cars/create and on a car's edit page. */
function isCurrent(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

/** The everyday sections, as tabs; the rest wait under "More" (the phone menu lists all). */
const PRIMARY = new Set<string>([
  "dashboard",
  "requests",
  "cars",
  "test-drives",
  "messages",
  "insights",
]);

/** A square 44px control on the asphalt bar. */
const barIcon =
  "relative flex size-11 shrink-0 items-center justify-center rounded-control text-inverse-foreground transition-colors hover:bg-inverse-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marker";

export function OrgTopBar({
  organization,
  userRole,
}: {
  organization: Organization;
  /** undefined for a platform ADMIN or an impersonator (no membership). */
  userRole: MemberRole | undefined;
}) {
  const t = useTranslations("org.nav");
  const locale = useLocale();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const base = `/org/${organization.slug}`;
  const name = organization.name || t("fallbackOrgName");
  const items = sidebarItems
    .filter((item) => !OWNER_ONLY.has(item.name) || userRole === "OWNER")
    .map((item) => ({ ...item, href: `${base}${item.path}` }));
  const more = items.filter((item) => !PRIMARY.has(item.name));
  const currentMore = more.find((item) => isCurrent(pathname, item.href));

  const unread = (className?: string) => (
    <OrgUnreadBadge
      organizationId={organization.id}
      className={cn("h-5 min-w-5 bg-marker text-marker-foreground", className)}
    />
  );

  return (
    <header className="sticky top-0 z-40 bg-inverse text-inverse-foreground">
      <div className="mx-auto flex w-full max-w-[1760px] flex-wrap items-center gap-x-2 px-2 sm:px-6 md:gap-x-6 md:px-8">
        {/* Phones: the sections are in a sheet. */}
        <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
          <SheetTrigger asChild>
            <button
              type="button"
              aria-label={t("openMenu")}
              className={cn(barIcon, "order-1 md:hidden")}
            >
              <Menu aria-hidden className="size-[22px]" />
            </button>
          </SheetTrigger>
          <SheetContent
            side="left"
            className="w-72 gap-0 border-inverse-hover bg-inverse p-0 text-inverse-foreground [&>button]:text-inverse-foreground"
          >
            <div className="flex h-16 items-center border-b border-inverse-foreground/10 px-4 pe-12">
              <SheetTitle className="truncate text-body font-semibold text-inverse-foreground">
                {name}
              </SheetTitle>
            </div>
            <nav
              aria-label={t("navLabel")}
              className="flex-1 overflow-y-auto px-3 py-3"
            >
              <ul className="flex flex-col gap-1">
                {items.map((item) => {
                  const current = isCurrent(pathname, item.href);
                  return (
                    <li key={item.name}>
                      <Link
                        href={item.href}
                        onClick={() => setMenuOpen(false)}
                        aria-current={current ? "page" : undefined}
                        className={cn(
                          "relative flex h-12 items-center gap-3 rounded-control px-4 text-body transition-colors",
                          current
                            ? "bg-inverse-hover font-semibold"
                            : "text-inverse-foreground/75 hover:bg-inverse-hover hover:text-inverse-foreground",
                        )}
                      >
                        {current && (
                          <span
                            aria-hidden
                            className="absolute inset-y-2 start-0 w-1 rounded-e-full bg-marker"
                          />
                        )}
                        <span className="flex-1">{t(item.labelKey)}</span>
                        {item.name === "messages" &&
                          item.showUnreadBadge &&
                          unread()}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>
            <div className="border-t border-inverse-foreground/10 p-3">
              <LanguageSwitcher
                onSwitch={() => setMenuOpen(false)}
                className="h-12 w-full justify-start gap-3 rounded-control px-4 text-inverse-foreground/75 hover:bg-inverse-hover hover:text-inverse-foreground [&_svg]:size-5"
              />
            </div>
          </SheetContent>
        </Sheet>

        <Link
          href={`${base}/dashboard`}
          className="order-2 flex h-16 min-w-0 flex-1 items-center gap-3 rounded-control focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marker md:flex-none xl:h-[72px]"
        >
          {organization.logo && (
            <span className="relative hidden size-10 shrink-0 overflow-hidden rounded-plate bg-field sm:block">
              <Image
                src={organization.logo}
                alt=""
                fill
                sizes="40px"
                className="object-cover"
              />
            </span>
          )}
          <Logo name={name} className="min-w-0 border-inverse-foreground" />
          <span className="sr-only">{t("dashboard")}</span>
        </Link>

        <div className="order-3 ms-auto flex items-center gap-1 sm:gap-2 md:order-3 xl:order-4 xl:ms-0">
          <Link
            href={`${base}/messages`}
            aria-label={t("messages")}
            className={cn(barIcon, "md:hidden")}
          >
            <MessageSquare aria-hidden className="size-[22px]" />
            {unread("absolute -top-0.5 -end-0.5")}
          </Link>
          <LanguageSwitcher
            showLabel={false}
            className="hidden size-11 text-inverse-foreground/80 hover:bg-inverse-hover hover:text-inverse-foreground md:inline-flex [&_svg]:size-5"
          />
          <span className="flex size-11 items-center justify-center">
            <UserButton afterSignOutUrl={`/${locale}`} />
          </span>
        </div>

        {/* md and up: the sections as tabs. */}
        <nav
          aria-label={t("navLabel")}
          className="order-4 -mx-6 hidden w-[calc(100%+3rem)] overflow-x-auto border-t border-inverse-foreground/10 px-4 [scrollbar-width:none] md:-mx-8 md:block md:w-[calc(100%+4rem)] xl:order-3 xl:mx-0 xl:w-auto xl:flex-1 xl:border-0 xl:px-0 [&::-webkit-scrollbar]:hidden"
        >
          <ul className="flex">
            {items
              .filter((item) => PRIMARY.has(item.name))
              .map((item) => {
                const current = isCurrent(pathname, item.href);
                return (
                  <li key={item.name} className="shrink-0">
                    <Link
                      href={item.href}
                      aria-current={current ? "page" : undefined}
                      className={cn(
                        "relative flex h-12 items-center gap-2 whitespace-nowrap px-3 text-caption transition-colors xl:h-[72px]",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-marker",
                        current
                          ? "font-semibold text-inverse-foreground"
                          : "font-medium text-inverse-foreground/70 hover:text-inverse-foreground",
                      )}
                    >
                      {t(item.labelKey)}
                      {item.name === "messages" &&
                        item.showUnreadBadge &&
                        unread()}
                      {current && (
                        <span
                          aria-hidden
                          className="absolute inset-x-3 bottom-0 h-[3px] rounded-t-full bg-marker"
                        />
                      )}
                    </Link>
                  </li>
                );
              })}
            {more.length > 0 && (
              <li className="shrink-0">
                <DropdownMenu>
                  <DropdownMenuTrigger
                    className={cn(
                      "relative flex h-12 items-center gap-2 whitespace-nowrap px-3 text-caption transition-colors xl:h-[72px]",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-marker",
                      currentMore
                        ? "font-semibold text-inverse-foreground"
                        : "font-medium text-inverse-foreground/70 hover:text-inverse-foreground",
                    )}
                  >
                    {currentMore ? t(currentMore.labelKey) : t("more")}
                    <ChevronDown aria-hidden className="size-4" />
                    {currentMore && (
                      <span
                        aria-hidden
                        className="absolute inset-x-3 bottom-0 h-[3px] rounded-t-full bg-marker"
                      />
                    )}
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    className="min-w-52 rounded-control"
                  >
                    {more.map((item) => (
                      <DropdownMenuItem
                        key={item.name}
                        asChild
                        className="h-11 cursor-pointer px-3 text-caption"
                      >
                        <Link
                          href={item.href}
                          aria-current={
                            isCurrent(pathname, item.href) ? "page" : undefined
                          }
                        >
                          {t(item.labelKey)}
                        </Link>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </li>
            )}
          </ul>
        </nav>
      </div>
    </header>
  );
}
