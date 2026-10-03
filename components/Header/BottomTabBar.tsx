"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Heart, Home, LayoutDashboard, Menu, MessageSquare, Search } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { UnreadBadge } from "@/components/StreamChat";
import MobileMenu from "./MobileMenu";
import { isCurrentSection, type HeaderOrganization, type HeaderUser } from "./MainHeader";
import { useHeaderAccess } from "./use-header-access";
import { cn } from "@/lib/utils";

/**
 * Pages that are a single focused task with their own bottom bar (a car's
 * contact bar, the chat composer, the onboarding wizard) — the tab bar would
 * cover it, so it steps aside there.
 */
const HIDDEN_ON = [/^\/cars\/[^/]+$/, /^\/messages(\/|$)/, /^\/onboarding(\/|$)/];

/** The tab bar's height, safe area included. Exported for anything that must clear it. */
export const TAB_BAR_CLEARANCE = "calc(4rem + env(safe-area-inset-bottom))";

function Tab({
  href,
  onClick,
  label,
  active,
  icon: Icon,
  badge,
}: {
  href?: string;
  onClick?: () => void;
  label: string;
  active: boolean;
  icon: React.ComponentType<{ className?: string }>;
  badge?: React.ReactNode;
}) {
  const body = (
    <>
      <span
        className={cn(
          "relative flex h-7 w-13 items-center justify-center rounded-full transition-colors",
          active ? "bg-marker text-marker-foreground" : "text-inverse-foreground/70"
        )}
      >
        <Icon className="size-5" />
        {badge}
      </span>
      <span className={cn("text-micro leading-none", active ? "font-semibold text-inverse-foreground" : "text-inverse-foreground/70")}>
        {label}
      </span>
    </>
  );
  const className = "flex min-w-0 flex-1 flex-col items-center justify-center gap-1 py-2 outline-none focus-visible:bg-inverse-hover";
  return href ? (
    <Link href={href} aria-current={active ? "page" : undefined} className={className}>
      {body}
    </Link>
  ) : (
    <button type="button" onClick={onClick} aria-expanded={active} aria-haspopup="dialog" className={className}>
      {body}
    </button>
  );
}

/**
 * Phone navigation (Figma: BottomTabBar). Asphalt bar, the current tab in a
 * marker pill. Flex order follows the page direction, so Home sits at the
 * reading start in both languages without a separate RTL layout.
 *
 * Renders an in-flow spacer as well as the fixed bar, so the end of every
 * page scrolls clear of it without each page knowing it exists.
 */
export default function BottomTabBar({
  user,
  organizationSlug,
  organization,
}: {
  user?: HeaderUser;
  organizationSlug?: string | null;
  organization?: HeaderOrganization;
}) {
  const t = useTranslations("nav");
  const access = useHeaderAccess(user, organizationSlug);
  const [moreOpen, setMoreOpen] = useState(false);
  const { pathname } = access;

  if (pathname && HIDDEN_ON.some((pattern) => pattern.test(pathname))) return null;

  return (
    <>
      <div aria-hidden className="md:hidden" style={{ height: TAB_BAR_CLEARANCE }} />
      <nav
        aria-label={t("primaryNav")}
        className="fixed inset-x-0 bottom-0 z-40 flex bg-inverse px-2 pb-[env(safe-area-inset-bottom)] md:hidden"
      >
        <Tab href="/" label={t("home")} icon={Home} active={isCurrentSection(pathname, "/")} />
        <Tab href="/cars" label={t("search")} icon={Search} active={isCurrentSection(pathname, "/cars")} />
        {access.isOwner ? (
          <Tab href={access.dashboardHref} label={t("dashboard")} icon={LayoutDashboard} active={false} />
        ) : (
          <>
            <Tab href="/wishlist" label={t("saved")} icon={Heart} active={isCurrentSection(pathname, "/wishlist")} />
            <Tab
              href="/messages"
              label={t("messages")}
              icon={MessageSquare}
              active={isCurrentSection(pathname, "/messages")}
              badge={<UnreadBadge className="absolute -top-1 -end-0.5" organizationId={organization?.id} />}
            />
          </>
        )}
        <Tab onClick={() => setMoreOpen(true)} label={t("more")} icon={Menu} active={moreOpen} />
      </nav>
      <MobileMenu
        open={moreOpen}
        onOpenChange={setMoreOpen}
        user={user}
        organizationSlug={organizationSlug}
        organization={organization}
      />
    </>
  );
}
