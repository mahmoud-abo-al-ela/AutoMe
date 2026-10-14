"use client";

import { useId } from "react";
import { useTranslations } from "next-intl";
import { ArrowRight, ChevronRight, Store } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { navItems, subdomainNavItems, adminNavItems } from "@/lib/HeaderConfig";
import { isCurrentSection, type HeaderOrganization, type HeaderUser } from "./MainHeader";
import { useHeaderAccess } from "./use-header-access";
import { mobileTabs } from "./mobile-tabs";
import { cn } from "@/lib/utils";

type Row = { href: string; label: string };

/**
 * The phone "More" sheet, opened from the bottom tab bar: the pages that are
 * not one of the viewer's tabs (mobileTabs), in groups — the viewer's own
 * activity, the marketplace, help — with the pitch to dealers as its own card
 * at the foot rather than one more row. The account and the language are in
 * the top bar, one of each; this sheet used to repeat both.
 *
 * A Radix sheet rather than the hand-rolled panel it replaces, so focus is
 * trapped, Escape closes it, focus returns to the More tab, and scroll lock
 * is handled — none of which the old panel did.
 */
export default function MobileMenu({
  open,
  onOpenChange,
  user,
  organizationSlug,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user?: HeaderUser;
  organizationSlug?: string | null;
  organization?: HeaderOrganization;
}) {
  const t = useTranslations("nav");
  const tFooter = useTranslations("footer");
  const access = useHeaderAccess(user, organizationSlug);
  const close = () => onOpenChange(false);
  const id = useId();

  const onTabs = new Set(
    mobileTabs(access.viewer, { onSubdomain: access.isOnSubdomain, dashboardHref: access.dashboardHref }).map((tab) => tab.href)
  );
  const notATab = (row: Row) => !onTabs.has(row.href);

  const sections: Row[] = (access.showAdminNav ? adminNavItems : access.isOnSubdomain ? subdomainNavItems : navItems).map(
    (item) => ({ href: item.href, label: t(item.labelKey) })
  );
  const isFaq = (row: Row) => row.href === "/faq";

  // A signed-in shopper's own pages. Owners and admins manage cars rather than
  // buy them; a staff member who also shops finds them here, not on a tab.
  const activity: Row[] =
    access.viewer !== "guest" && !access.isOwner
      ? [
          { href: "/test-drive", label: t("testDrives") },
          { href: "/wishlist", label: t("wishlist") },
          { href: "/messages", label: t("messages") },
        ]
      : [];
  const help: Row[] = [
    ...sections.filter(isFaq),
    ...(access.isOnSubdomain
      ? []
      : [
          { href: "/about", label: tFooter("aboutUs") },
          { href: "/contact", label: tFooter("contactUs") },
        ]),
  ];
  const groups = [
    { key: "activity", title: t("groups.activity"), rows: activity.filter(notATab) },
    { key: "explore", title: t("groups.explore"), rows: sections.filter((row) => !isFaq(row)).filter(notATab) },
    { key: "help", title: t("groups.help"), rows: help.filter(notATab) },
  ].filter((group) => group.rows.length > 0);

  const row = ({ href, label }: Row) => (
    <Link
      key={href}
      href={href}
      onClick={close}
      aria-current={isCurrentSection(access.pathname, href) ? "page" : undefined}
      className={cn(
        "flex min-h-12 items-center gap-3 rounded-control px-3 text-body font-medium transition-colors hover:bg-muted",
        isCurrentSection(access.pathname, href) && "bg-muted"
      )}
    >
      <span className="flex-1">{label}</span>
      <ChevronRight aria-hidden className="size-4 text-muted-foreground rtl:rotate-180" />
    </Link>
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[85dvh] gap-0 rounded-t-sheet border-0 bg-card p-0 pb-[env(safe-area-inset-bottom)]">
        <SheetTitle className="sr-only">{t("more")}</SheetTitle>
        <div aria-hidden className="mx-auto mt-3 h-1 w-10 rounded-full bg-border" />

        <nav aria-label={t("more")} className="flex flex-col gap-4 overflow-y-auto px-4 pb-5 pt-2">
          {groups.map((group) => (
            <div key={group.key} role="group" aria-labelledby={`${id}-${group.key}`} className="flex flex-col">
              <h3 id={`${id}-${group.key}`} className="px-3 pb-1 text-micro font-semibold uppercase tracking-wide text-muted-foreground">
                {group.title}
              </h3>
              {group.rows.map(row)}
            </div>
          ))}

          {access.showForDealers && (
            <Link
              href="/for-dealers"
              onClick={close}
              className="flex items-center gap-3 rounded-control border border-border bg-muted p-4 transition-colors hover:bg-muted/70"
            >
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-marker text-marker-foreground">
                <Store aria-hidden className="size-5" />
              </span>
              <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="text-body font-semibold">{t("sellCta.title")}</span>
                <span className="text-caption text-muted-foreground">{t("sellCta.body")}</span>
              </span>
              <ArrowRight aria-hidden className="size-5 shrink-0 rtl:rotate-180" />
            </Link>
          )}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
