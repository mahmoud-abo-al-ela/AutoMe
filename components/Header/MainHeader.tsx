"use client";

import { useTranslations } from "next-intl";
import { CarFront, Heart, MessageSquare } from "lucide-react";
import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/brand";
import { UnreadBadge } from "@/components/StreamChat";
import { navItems, subdomainNavItems, adminNavItems } from "@/lib/HeaderConfig";
import { useAuthRedirects } from "@/hooks/use-auth-redirects";
import LanguageSwitcher from "./components/LanguageSwitcher";
import { useHeaderAccess } from "./use-header-access";
import { cn } from "@/lib/utils";

export type HeaderUser = {
  name?: string | null;
  email?: string | null;
  role?: string | null;
  memberships?: {
    role?: string | null;
    organization?: { slug?: string | null } | null;
  }[];
} | null;

export type HeaderOrganization = {
  id?: string | null;
  name?: string | null;
  logo?: string | null;
} | null;

/** A section is current on its own page and on everything under it (/cars/123 is still Browse). */
export function isCurrentSection(pathname: string | null | undefined, href: string) {
  if (!pathname) return false;
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}

/**
 * Desktop nav item (Figma: Header). The current page is marked twice — full
 * ink and a marker bar on the header's bottom edge — so it never relies on
 * colour alone.
 */
function NavItem({ href, label, active }: { href: string; label: string; active: boolean }) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "group relative flex h-full items-center px-3 text-caption font-medium transition-colors",
        active ? "text-foreground" : "text-muted-foreground hover:text-foreground"
      )}
    >
      {label}
      <span
        aria-hidden
        className={cn(
          "absolute inset-x-3 bottom-0 h-[3px] rounded-t-full bg-marker transition-opacity",
          active ? "opacity-100" : "opacity-0 group-hover:opacity-40"
        )}
      />
    </Link>
  );
}

/** Square 40px icon link; the label is both its tooltip and its accessible name. */
function IconLink({
  href,
  label,
  active,
  children,
}: {
  href: string;
  label: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      title={label}
      aria-label={label}
      aria-current={active ? "page" : undefined}
      className={cn(
        "relative inline-flex size-10 items-center justify-center rounded-control transition-colors hover:bg-muted",
        active && "bg-muted"
      )}
    >
      {children}
    </Link>
  );
}

/**
 * Site header (Figma: Header, MobileTopBar) — sticky and in normal flow, so
 * pages no longer guess its height with their own top margins.
 *
 * Phones get only the brand and the language toggle here: navigation lives in
 * the bottom tab bar (BottomTabBar), so nothing crowds — or clips at — the
 * screen edge.
 */
export default function MainHeader({
  user,
  organizationSlug,
  organization,
}: {
  user?: HeaderUser;
  organizationSlug?: string | null;
  organization?: HeaderOrganization;
}) {
  const t = useTranslations("nav");
  const { afterSignOut, signIn } = useAuthRedirects();
  const access = useHeaderAccess(user, organizationSlug);
  const { pathname } = access;

  const brandName = access.isOnSubdomain && organization?.name ? organization.name : "AutoMe";
  const items = access.showAdminNav
    ? adminNavItems
    : access.isOnSubdomain
      ? subdomainNavItems
      : navItems;
  const onAuthPage = pathname === "/sign-in" || pathname === "/sign-up";

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur-md supports-[backdrop-filter]:bg-background/85">
      <div className="mx-auto flex h-14 max-w-[1440px] items-center gap-6 px-4 md:h-[72px] md:px-8 xl:px-20">
        <Link
          href="/"
          aria-label={access.isOnSubdomain ? brandName : t("goHome")}
          className="flex shrink-0 items-center gap-2 rounded-plate"
        >
          {access.isOnSubdomain && organization?.logo ? (
            // Dealership logos are arbitrary remote URLs; next/image would need
            // every host allow-listed.
            // eslint-disable-next-line @next/next/no-img-element
            <img src={organization.logo} alt="" className="size-9 rounded-control object-cover" />
          ) : null}
          <Logo name={brandName} />
        </Link>

        <nav aria-label={t("primaryNav")} className="hidden h-full flex-1 items-stretch justify-center gap-1 md:flex">
          {items.map((item) => (
            <NavItem
              key={item.href}
              href={item.href}
              label={t(item.labelKey)}
              active={isCurrentSection(pathname, item.href)}
            />
          ))}
        </nav>

        <div className="ms-auto flex items-center gap-2 md:ms-0">
          {access.showDashboardLink && (
            <Button
              variant={access.isOnAdminPath ? "outline-strong" : "inverse"}
              size="control"
              asChild
              className="hidden md:inline-flex"
            >
              <Link href={access.isOnAdminPath ? "/" : access.dashboardHref}>
                {access.isOnAdminPath ? t("viewStorefront") : t("dashboard")}
              </Link>
            </Button>
          )}

          <LanguageSwitcher className="h-10 rounded-control px-2.5 max-md:[&>span]:hidden" />

          <SignedOut>
            {!access.isOnSubdomain && (
              <Link
                href="/#for-dealers"
                className="hidden rounded-control px-2.5 py-2 text-caption font-medium text-muted-foreground transition-colors hover:text-foreground lg:inline-flex"
              >
                {t("forDealers")}
              </Link>
            )}
            {!onAuthPage && (
              <Button variant="outline-strong" size="control" asChild className="hidden md:inline-flex">
                <Link href={signIn}>{t("signIn")}</Link>
              </Button>
            )}
          </SignedOut>

          <SignedIn>
            {!access.isOwner && (
              <div className="hidden items-center gap-1 md:flex">
                <IconLink href="/wishlist" label={t("wishlist")} active={isCurrentSection(pathname, "/wishlist")}>
                  <Heart className="size-5" />
                </IconLink>
                <IconLink href="/messages" label={t("messages")} active={isCurrentSection(pathname, "/messages")}>
                  <MessageSquare className="size-5" />
                  <UnreadBadge className="absolute -top-0.5 -end-0.5" organizationId={organization?.id} />
                </IconLink>
                <IconLink href="/test-drive" label={t("testDrive")} active={isCurrentSection(pathname, "/test-drive")}>
                  <CarFront className="size-5" />
                </IconLink>
              </div>
            )}
            <div className="hidden md:block">
              <UserButton afterSignOutUrl={afterSignOut} />
            </div>
          </SignedIn>
        </div>
      </div>
    </header>
  );
}
