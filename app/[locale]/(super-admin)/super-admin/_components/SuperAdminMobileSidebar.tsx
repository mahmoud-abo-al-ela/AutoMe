"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { Menu, X, Shield, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { superAdminSidebarItems } from "@/lib/SuperAdminSidebarConfig";
import LanguageSwitcher from "@/components/Header/components/LanguageSwitcher";

export default function SuperAdminMobileSidebar({
  pathname,
}: {
  pathname: string;
}) {
  const t = useTranslations("superAdmin.nav");
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-10 w-10 p-0 hover:bg-sidebar-accent"
        >
          <Menu className="h-5 w-5" />
          <span className="sr-only">{t("openMenu")}</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-72 p-0 bg-sidebar">
        {/* Header */}
        <div className="p-4 flex items-center justify-between border-b border-sidebar-border">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <span className="font-bold text-lg bg-gradient-to-r from-purple-600 to-purple-700 bg-clip-text text-transparent">
              {t("brand")}
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => setOpen(false)}
            aria-label={t("closeMenu")}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 px-3 space-y-1">
          {superAdminSidebarItems.map((item) => {
            const ItemIcon = item.icon;
            const isActive =
              pathname === item.path ||
              (item.path !== "/super-admin" && pathname.startsWith(item.path));

            return (
              <Link
                key={item.name}
                href={item.path}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center px-4 py-3 text-sm rounded-lg transition-all duration-200",
                  isActive
                    ? "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 font-medium"
                    : "text-sidebar-foreground hover:bg-sidebar-accent/60"
                )}
              >
                {ItemIcon && (
                  <ItemIcon
                    className={cn(
                      "h-5 w-5 me-3",
                      isActive
                        ? "text-purple-600 dark:text-purple-400"
                        : "text-sidebar-foreground/70"
                    )}
                  />
                )}
                <span>{t(item.labelKey)}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-3 border-t border-sidebar-border space-y-2 mt-auto">
          <LanguageSwitcher
            onSwitch={() => setOpen(false)}
            className="w-full h-auto justify-start px-4 py-3 gap-3 text-sidebar-foreground hover:bg-sidebar-accent/60 rounded-lg"
          />
          <Link
            href="/"
            onClick={() => setOpen(false)}
            className="flex items-center px-4 py-3 text-sm text-sidebar-foreground hover:bg-sidebar-accent/60 rounded-lg transition-all duration-200"
          >
            <LogOut className="h-5 w-5 me-3 rotate-180 rtl:rotate-0" />
            <span>{t("backToSite")}</span>
          </Link>
        </div>
      </SheetContent>
    </Sheet>
  );
}
