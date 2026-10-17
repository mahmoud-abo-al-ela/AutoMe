"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Menu } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { UnreadBadge } from "@/components/StreamChat";
import MobileMenu from "./MobileMenu";
import { isCurrentSection, type HeaderOrganization, type HeaderUser } from "./MainHeader";
import { useHeaderAccess } from "./use-header-access";
import { mobileTabs } from "./mobile-tabs";
import { cn } from "@/lib/utils";

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
  const tabs = mobileTabs(access.viewer, { onSubdomain: access.isOnSubdomain, dashboardHref: access.dashboardHref });

  if (pathname && HIDDEN_ON.some((pattern) => pattern.test(pathname))) return null;

  return (
    <>
      <div aria-hidden className="md:hidden" style={{ height: TAB_BAR_CLEARANCE }} />
      <nav
        aria-label={t("primaryNav")}
        className="fixed inset-x-0 bottom-0 z-40 flex bg-inverse px-2 pb-[env(safe-area-inset-bottom)] md:hidden"
      >
        {tabs.map((tab) => (
          <Tab
            key={tab.href}
            href={tab.href}
            label={t(tab.labelKey)}
            icon={tab.icon}
            active={isCurrentSection(pathname, tab.href)}
            badge={tab.unread ? <UnreadBadge className="absolute -top-1 -end-0.5" organizationId={organization?.id} /> : undefined}
          />
        ))}
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
