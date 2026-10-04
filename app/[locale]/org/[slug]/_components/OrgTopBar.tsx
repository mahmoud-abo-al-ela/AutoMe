"use client";

import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { UserButton } from "@clerk/nextjs";
import { Plus } from "lucide-react";
import { Link, usePathname } from "@/i18n/navigation";
import { Logo } from "@/components/brand";
import { buttonVariants } from "@/components/ui/button";
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

/**
 * The dashboard's navigation (Figma/canvas: Dashboard A — Showroom): one
 * asphalt bar across the top instead of a sidebar, so the work area keeps
 * the full width. The dealership's name on the plate, the sections as tabs —
 * the current one underlined in marker yellow, never colour alone — and the
 * page-independent actions at the far end, "Add car" the one marker button.
 *
 * On phones and narrow windows the tabs drop to their own scrolling row
 * under the plate; from xl everything sits on one line. Rendered on the
 * server and switched by CSS, so nothing shifts after hydration.
 */
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
  const base = `/org/${organization.slug}`;
  const name = organization.name || t("fallbackOrgName");

  return (
    <header className="sticky top-0 z-40 bg-inverse text-inverse-foreground">
      <div className="mx-auto flex w-full max-w-[1440px] flex-wrap items-center gap-x-6 px-4 sm:px-6 md:px-8">
        <Link href={`${base}/dashboard`} className="order-1 flex h-16 min-w-0 items-center gap-3 rounded-control focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marker xl:h-[72px]">
          {organization.logo && (
            <span className="relative size-10 shrink-0 overflow-hidden rounded-plate bg-field">
              <Image src={organization.logo} alt="" fill sizes="40px" className="object-cover" />
            </span>
          )}
          <Logo name={name} className="min-w-0 border-inverse-foreground" />
          <span className="sr-only">{t("dashboard")}</span>
        </Link>

        <div className="order-2 ms-auto flex items-center gap-1 sm:gap-2 xl:order-3 xl:ms-0">
          <LanguageSwitcher
            showLabel={false}
            className="size-11 text-inverse-foreground/80 hover:bg-inverse-hover hover:text-inverse-foreground [&_svg]:size-5"
          />
          <Link
            href={`${base}/cars/create`}
            aria-label={t("addCar")}
            className={cn(buttonVariants({ variant: "marker", size: "control" }), "h-11 border-inverse-foreground px-3 shadow-none sm:px-4")}
          >
            <Plus aria-hidden className="size-[18px]" />
            <span className="hidden sm:inline">{t("addCar")}</span>
          </Link>
          <span className="flex size-11 items-center justify-center">
            <UserButton afterSignOutUrl={`/${locale}`} />
          </span>
        </div>

        <nav
          aria-label={t("navLabel")}
          className="order-3 -mx-4 w-[calc(100%+2rem)] overflow-x-auto border-t border-inverse-foreground/10 px-2 [scrollbar-width:none] sm:-mx-6 sm:w-[calc(100%+3rem)] sm:px-4 xl:order-2 xl:mx-0 xl:w-auto xl:flex-1 xl:border-0 xl:px-0 [&::-webkit-scrollbar]:hidden"
        >
          <ul className="flex">
            {sidebarItems
              .filter((item) => !OWNER_ONLY.has(item.name) || userRole === "OWNER")
              .map((item) => {
                const href = `${base}${item.path}`;
                const current = isCurrent(pathname, href);
                return (
                  <li key={item.name} className="shrink-0">
                    <Link
                      href={href}
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
                      {item.name === "messages" && item.showUnreadBadge && (
                        <OrgUnreadBadge
                          organizationId={organization.id}
                          className="h-5 min-w-5 bg-marker text-marker-foreground"
                        />
                      )}
                      {current && <span aria-hidden className="absolute inset-x-3 bottom-0 h-[3px] rounded-t-full bg-marker" />}
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
