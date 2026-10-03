"use client";

import { useTranslations } from "next-intl";
import { SignedIn, SignedOut, UserButton, useClerk } from "@clerk/nextjs";
import { CarFront, ChevronRight, LogOut } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { navItems, subdomainNavItems, adminNavItems } from "@/lib/HeaderConfig";
import { useAuthRedirects } from "@/hooks/use-auth-redirects";
import LanguageSwitcher from "./components/LanguageSwitcher";
import { isCurrentSection, type HeaderOrganization, type HeaderUser } from "./MainHeader";
import { useHeaderAccess } from "./use-header-access";
import { cn } from "@/lib/utils";

/**
 * The phone "More" sheet, opened from the bottom tab bar: everything that is
 * not one of the four primary tabs — the remaining sections, the dashboard
 * for dealership members, language, and the account.
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
  organization,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user?: HeaderUser;
  organizationSlug?: string | null;
  organization?: HeaderOrganization;
}) {
  const t = useTranslations("nav");
  const tFooter = useTranslations("footer");
  const { signOut } = useClerk();
  const { afterSignOut, signIn } = useAuthRedirects();
  const access = useHeaderAccess(user, organizationSlug);
  const close = () => onOpenChange(false);

  // Home and Browse are tabs already; the rest of the section nav lives here.
  const sections = (access.showAdminNav ? adminNavItems : access.isOnSubdomain ? subdomainNavItems : navItems).filter(
    (item) => item.href !== "/cars"
  );
  const extra = access.isOnSubdomain
    ? []
    : [
        { href: "/about", label: tFooter("aboutUs") },
        { href: "/contact", label: tFooter("contactUs") },
      ];

  const row = (href: string, label: string, icon?: React.ReactNode) => (
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
      {icon}
      <span className="flex-1">{label}</span>
      <ChevronRight aria-hidden className="size-4 text-muted-foreground rtl:rotate-180" />
    </Link>
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[85dvh] gap-0 rounded-t-sheet border-0 bg-card p-0 pb-[env(safe-area-inset-bottom)]">
        <SheetTitle className="sr-only">{t("more")}</SheetTitle>
        <div aria-hidden className="mx-auto mt-3 h-1 w-10 rounded-full bg-border" />

        <div className="overflow-y-auto px-4 pb-4 pt-3">
          <SignedIn>
            <div className="mb-3 flex items-center gap-3 rounded-control bg-muted p-3">
              <UserButton afterSignOutUrl={afterSignOut} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-caption font-semibold">{user?.name || t("welcomeBack")}</p>
                {user?.email && <p dir="ltr" className="truncate text-micro text-muted-foreground rtl:text-right">{user.email}</p>}
              </div>
              <Button
                variant="ghost"
                size="icon-control"
                aria-label={t("signOut")}
                title={t("signOut")}
                onClick={() => {
                  close();
                  signOut({ redirectUrl: afterSignOut });
                }}
              >
                <LogOut className="size-5" />
              </Button>
            </div>
          </SignedIn>

          {access.showDashboardLink && (
            <Button variant="inverse" size="xl" asChild className="mb-3 w-full">
              <Link href={access.isOnAdminPath ? "/" : access.dashboardHref} onClick={close}>
                {access.isOnAdminPath ? t("viewStorefront") : t("dashboard")}
              </Link>
            </Button>
          )}

          <nav aria-label={t("more")} className="flex flex-col">
            {sections.map((item) => row(item.href, t(item.labelKey)))}
            <SignedIn>{!access.isOwner && row("/test-drive", t("testDrive"), <CarFront aria-hidden className="size-5" />)}</SignedIn>
            {extra.map((item) => row(item.href, item.label))}
            {access.showForDealers && row("/for-dealers", t("forDealers"))}
          </nav>

          <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
            <LanguageSwitcher className="h-11 rounded-control" onSwitch={close} />
            <SignedOut>
              <Button variant="marker" size="xl" asChild>
                <Link href={signIn} onClick={close}>
                  {t("signIn")}
                </Link>
              </Button>
            </SignedOut>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
