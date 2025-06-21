"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  CarFront,
  Star,
  Settings,
  MessageSquare,
  FileText,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { sidebarItems } from "@/lib/SidebarConfig";

const iconMap = {
  LayoutDashboard,
  Users,
  CarFront,
  Star,
  Settings,
  MessageSquare,
  FileText,
};

export default function DesktopSidebar({ collapsed, setCollapsed, pathname }) {
  return (
    <aside
      className={cn(
        "hidden md:flex flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border transition-all duration-300 ease-in-out fixed top-0 left-0 h-screen z-30",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Header */}
      <div className="p-4 flex items-center justify-between border-b border-sidebar-border h-16 relative">
        {!collapsed && (
          <div className="flex items-center space-x-2">
            <div className="h-8 w-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
              <CarFront className="h-5 w-5 text-white" />
            </div>
            <span className="font-bold text-lg bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent">
              AutoMe Admin
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
        {sidebarItems.map((item, index) => {
          const ItemIcon = iconMap[item.icon];
          const isActive = pathname === item.path;

          return (
            <div
              key={item.name}
              className="relative"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <Link
                href={item.path}
                className={cn(
                  "flex items-center text-sm rounded-lg transition-all duration-200 group relative overflow-hidden",
                  collapsed ? "justify-center px-3 py-3" : "px-4 py-3",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium shadow-sm"
                    : "text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground hover:translate-x-1"
                )}
                title={collapsed ? item.label : ""}
              >
                {ItemIcon && (
                  <ItemIcon
                    className={cn(
                      "h-5 w-5 transition-all duration-200",
                      collapsed ? "mx-0" : "mr-3",
                      isActive
                        ? "text-sidebar-accent-foreground scale-110"
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
                  <div className="absolute left-0 top-0 h-full w-1 bg-gradient-to-b from-blue-500 to-blue-600 rounded-r-full" />
                )}
              </Link>

              {/* Tooltip for collapsed state */}
              {collapsed && (
                <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                  {item.label}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-sidebar-border">
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
              collapsed ? "mx-0" : "mr-3",
              "group-hover:scale-105"
            )}
          />
          {!collapsed && <span className="font-medium">Back to Site</span>}
        </Link>
      </div>
    </aside>
  );
}
