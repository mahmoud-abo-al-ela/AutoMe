"use client";

import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { Shield, LogOut, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { superAdminSidebarItems } from "@/lib/SuperAdminSidebarConfig";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { Dispatch, SetStateAction } from "react";
import type { CurrentUser } from "@/lib/checkUser";

export default function SuperAdminDesktopSidebar({
  collapsed,
  setCollapsed,
  pathname,
  user,
}: {
  collapsed: boolean;
  setCollapsed: Dispatch<SetStateAction<boolean>>;
  pathname: string;
  user: CurrentUser;
}) {
  return (
    <aside
      className={cn(
        "hidden md:flex flex-col bg-sidebar text-sidebar-foreground border-e border-sidebar-border transition-all duration-300 ease-in-out fixed top-0 start-0 h-screen z-30",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Header */}
      <div className="p-4 flex items-center justify-between border-b border-sidebar-border h-16 relative">
        {!collapsed && (
          <div className="flex items-center space-x-2">
            <div className="h-8 w-8 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <span className="font-bold text-lg bg-gradient-to-r from-purple-600 to-purple-700 bg-clip-text text-transparent">
              Super Admin
            </span>
          </div>
        )}
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "h-8 w-8 p-0 hover:bg-sidebar-accent rounded-lg transition-all duration-200",
            collapsed && "mx-auto"
          )}
          onClick={() => setCollapsed(!collapsed)}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4 transition-transform duration-200" />
          ) : (
            <ChevronLeft className="h-4 w-4 transition-transform duration-200" />
          )}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-3 space-y-1 overflow-hidden">
        {superAdminSidebarItems.map((item, index) => {
          const ItemIcon = item.icon;
          const isActive =
            pathname === item.path ||
            (item.path !== "/super-admin" && pathname.startsWith(item.path));

          return (
            <div
              key={item.name}
              className="relative group"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <Link
                href={item.path}
                className={cn(
                  "flex items-center text-sm rounded-lg transition-all duration-200 relative overflow-hidden",
                  collapsed ? "justify-center px-3 py-3" : "px-4 py-3",
                  isActive
                    ? "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 font-medium shadow-sm"
                    : "text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground hover:translate-x-1"
                )}
                title={collapsed ? item.label : ""}
              >
                {ItemIcon && (
                  <ItemIcon
                    className={cn(
                      "h-5 w-5 transition-all duration-200",
                      collapsed ? "mx-0" : "me-3",
                      isActive
                        ? "text-purple-600 dark:text-purple-400 scale-110"
                        : "text-sidebar-foreground/70 group-hover:text-sidebar-accent-foreground group-hover:scale-105"
                    )}
                  />
                )}
                {!collapsed && (
                  <span className="font-medium transition-all duration-200">
                    {item.label}
                  </span>
                )}

                {/* Active indicator */}
                {isActive && (
                  <div className="absolute start-0 top-0 h-full w-1 bg-gradient-to-b from-purple-500 to-purple-600 rounded-e-full" />
                )}
              </Link>

              {/* Tooltip for collapsed state */}
              {collapsed && (
                <div className="absolute start-full ms-2 top-1/2 -translate-y-1/2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                  {item.label}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* User info & Footer */}
      <div className="p-3 border-t border-sidebar-border space-y-2">
        {/* User info */}
        {!collapsed && user && (
          <div className="px-2 py-2 flex items-center space-x-3">
            <Avatar className="h-8 w-8">
              <AvatarImage src={user.imageUrl ?? undefined} alt={user.name ?? ""} />
              <AvatarFallback className="bg-purple-100 text-purple-700 text-xs">
                {user.name?.charAt(0) || "SA"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user.name}</p>
              <p className="text-xs text-muted-foreground truncate">
                {user.email}
              </p>
            </div>
          </div>
        )}

        {/* Back to Site link */}
        <Link
          href="/"
          className={cn(
            "flex items-center text-sm text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground rounded-lg transition-all duration-200 group",
            collapsed ? "justify-center px-3 py-3" : "px-4 py-3"
          )}
          title={collapsed ? "Back to Site" : ""}
        >
          <LogOut
            className={cn(
              "h-5 w-5 rotate-180 transition-all duration-200",
              collapsed ? "mx-0" : "me-3",
              "group-hover:scale-105"
            )}
          />
          {!collapsed && <span className="font-medium">Back to Site</span>}
        </Link>
      </div>
    </aside>
  );
}
