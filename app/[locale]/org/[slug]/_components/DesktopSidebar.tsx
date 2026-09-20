"use client";

import { Link } from "@/i18n/navigation";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  CarFront,
  Star,
  Settings,
  MessageSquare,
  LogOut,
  Calendar,
  ChevronLeft,
  CreditCard,
  ScrollText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { sidebarItems } from "@/lib/SidebarConfig";
import { OrgUnreadBadge } from "@/components/StreamChat";
import LanguageSwitcher from "@/components/Header/components/LanguageSwitcher";
import type { Dispatch, SetStateAction } from "react";
import type { OrgSidebarProps } from "./AdminSidebar";

const iconMap = {
  LayoutDashboard,
  Users,
  CarFront,
  Star,
  Settings,
  MessageSquare,
  Calendar,
  CreditCard,
  ScrollText,
};

export default function DesktopSidebar({
  collapsed,
  setCollapsed,
  pathname,
  organization,
  userRole,
}: OrgSidebarProps & {
  collapsed: boolean;
  setCollapsed: Dispatch<SetStateAction<boolean>>;
  pathname: string;
}) {
  const t = useTranslations("org.nav");
  const orgName = organization?.name || t("fallbackOrgName");

  return (
    <aside
      className={cn(
        "hidden md:flex flex-col bg-sidebar text-sidebar-foreground border-e border-sidebar-border transition-all duration-300 ease-in-out fixed top-0 start-0 h-screen z-30",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Header */}
      <div className="p-4 flex items-center justify-between border-b border-sidebar-border h-16 relative">
        <div
          className={cn(
            "flex items-center",
            collapsed ? "mx-auto cursor-pointer" : "gap-2"
          )}
          onClick={collapsed ? () => setCollapsed(false) : undefined}
          title={collapsed ? orgName : undefined}
        >
          {organization?.logo ? (
            <div className="h-8 w-8 rounded-lg overflow-hidden flex-shrink-0 relative">
              <Image
                src={organization.logo}
                alt={orgName}
                fill
                className="object-cover"
                sizes="32px"
              />
            </div>
          ) : (
            <div className="h-8 w-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <CarFront className="h-5 w-5 text-white" />
            </div>
          )}
          {!collapsed && (
            <span className="font-bold text-lg bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent truncate">
              {orgName}
            </span>
          )}
        </div>
        {!collapsed && (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 hover:bg-sidebar-accent rounded-lg transition-all duration-200"
            onClick={() => setCollapsed(true)}
            aria-label={t("collapseSidebar")}
          >
            {/* Points at the edge the sidebar collapses toward, which is the
                right-hand one in Arabic. */}
            <ChevronLeft className="h-4 w-4 transition-transform duration-200 rtl:rotate-180" />
          </Button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-3 space-y-1 overflow-hidden">
        {sidebarItems
          .filter((item) => {
            if (
              ["billing", "audit-logs", "settings"].includes(item.name) &&
              userRole !== "OWNER"
            ) {
              return false;
            }
            return true;
          })
          .map((item, index) => {
            const ItemIcon = iconMap[item.icon];
            const fullPath = `/org/${organization.slug}${item.path}`;
            const isActive = pathname === fullPath;

            return (
              <div
                key={item.name}
                className="relative"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <Link
                  href={fullPath}
                  className={cn(
                    "flex items-center text-sm rounded-lg transition-all duration-200 group relative overflow-hidden",
                    collapsed ? "justify-center px-3 py-3" : "px-4 py-3",
                    isActive
                      ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium shadow-sm"
                      : "text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground ltr:hover:translate-x-1 rtl:hover:-translate-x-1"
                  )}
                  title={collapsed ? t(item.labelKey) : ""}
                >
                  {ItemIcon && (
                    <ItemIcon
                      className={cn(
                        "h-5 w-5 transition-all duration-200",
                        collapsed ? "mx-0" : "me-3",
                        isActive
                          ? "text-sidebar-accent-foreground scale-110"
                          : "text-sidebar-foreground/70 group-hover:text-sidebar-accent-foreground group-hover:scale-105"
                      )}
                    />
                  )}
                  {!collapsed && (
                    <span className="font-medium transition-all duration-200">
                      {t(item.labelKey)}
                    </span>
                  )}

                  {/* Unread badge for messages */}
                  {item.name === "messages" && item.showUnreadBadge && (
                    <OrgUnreadBadge
                      organizationId={organization.id}
                      className={cn(
                        "ms-auto",
                        collapsed && "absolute -top-1 -end-1"
                      )}
                    />
                  )}

                  {/* Active indicator */}
                  {isActive && (
                    <div className="absolute start-0 top-0 h-full w-1 bg-gradient-to-b from-blue-500 to-blue-600 rounded-e-full" />
                  )}
                </Link>

                {/* Tooltip for collapsed state */}
                {collapsed && (
                  <div className="absolute start-full ms-2 top-1/2 -translate-y-1/2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                    {t(item.labelKey)}
                  </div>
                )}
              </div>
            );
          })}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-sidebar-border space-y-1">
        <LanguageSwitcher
          showLabel={!collapsed}
          className={cn(
            "w-full h-auto text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground rounded-lg",
            collapsed ? "justify-center px-3 py-3" : "justify-start px-4 py-3 gap-3"
          )}
        />
        <Link
          href="/"
          className={cn(
            "flex items-center text-sm text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground rounded-lg transition-all duration-200 group",
            collapsed ? "justify-center px-3 py-3" : "px-4 py-3"
          )}
          title={collapsed ? t("backToSite") : ""}
        >
          {/* The arrow points back toward the reader's starting edge, so the
              LTR flip has to be undone in Arabic rather than doubled. */}
          <LogOut
            className={cn(
              "h-5 w-5 rotate-180 rtl:rotate-0 transition-all duration-200",
              collapsed ? "mx-0" : "me-3",
              "group-hover:scale-105"
            )}
          />
          {!collapsed && <span className="font-medium">{t("backToSite")}</span>}
        </Link>
      </div>
    </aside>
  );
}
