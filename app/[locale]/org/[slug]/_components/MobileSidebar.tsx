"use client";

import { useState } from "react";
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
  Menu,
  CreditCard,
  ScrollText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { sidebarItems } from "@/lib/SidebarConfig";
import { OrgUnreadBadge } from "@/components/StreamChat";
import LanguageSwitcher from "@/components/Header/components/LanguageSwitcher";
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

export default function MobileSidebar({
  pathname,
  organization,
  userRole,
}: OrgSidebarProps & { pathname: string }) {
  const t = useTranslations("org.nav");
  const [open, setOpen] = useState(false);
  const orgName = organization?.name || t("fallbackOrgName");

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="md:hidden h-10 w-10 p-0 hover:bg-sidebar-accent"
          aria-label={t("openSidebar")}
        >
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent
        side="left"
        className="w-72 p-0 bg-sidebar border-sidebar-border"
      >
        <div className="flex flex-col h-full">
          <div className="p-6 border-b border-sidebar-border">
            <div className="flex items-center gap-3">
              {organization?.logo ? (
                <div className="h-10 w-10 rounded-lg overflow-hidden flex-shrink-0 relative">
                  <Image
                    src={organization.logo}
                    alt={orgName}
                    fill
                    className="object-cover"
                    sizes="40px"
                  />
                </div>
              ) : (
                <div className="h-10 w-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                  <CarFront className="h-6 w-6 text-white" />
                </div>
              )}
              <h2 className="text-xl font-bold text-sidebar-foreground truncate">
                {orgName}
              </h2>
            </div>
          </div>

          <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
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
              .map((item) => {
                const ItemIcon = iconMap[item.icon];
                const fullPath = `/org/${organization.slug}${item.path}`;
                const isActive = pathname === fullPath;

                return (
                  <Link
                    key={item.name}
                    href={fullPath}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "flex items-center px-4 py-3 text-sm rounded-lg transition-all duration-200 group",
                      isActive
                        ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium shadow-sm"
                        : "text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground ltr:hover:translate-x-1 rtl:hover:-translate-x-1"
                    )}
                  >
                    {ItemIcon && (
                      <ItemIcon
                        className={cn(
                          "h-5 w-5 me-3 transition-colors",
                          isActive
                            ? "text-sidebar-accent-foreground"
                            : "text-sidebar-foreground/70 group-hover:text-sidebar-accent-foreground"
                        )}
                      />
                    )}
                    <span className="font-medium flex-1">{t(item.labelKey)}</span>
                    {item.name === "messages" && item.showUnreadBadge && (
                      <OrgUnreadBadge
                        organizationId={organization.id}
                        className="ms-auto"
                      />
                    )}
                  </Link>
                );
              })}

          </nav>

          <div className="p-4 border-t border-sidebar-border space-y-1">
            <LanguageSwitcher
              onSwitch={() => setOpen(false)}
              className="w-full h-auto justify-start px-4 py-3 gap-3 text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground rounded-lg" />
            <Link
              href="/"
              onClick={() => setOpen(false)}
              className="flex items-center px-4 py-3 text-sm text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground rounded-lg transition-all duration-200 group"
              title={t("backToSite")}
            >
              <LogOut className="h-5 w-5 me-3 rotate-180 rtl:rotate-0 transition-colors group-hover:text-sidebar-accent-foreground" />
              <span className="font-medium">{t("backToSite")}</span>
            </Link>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
