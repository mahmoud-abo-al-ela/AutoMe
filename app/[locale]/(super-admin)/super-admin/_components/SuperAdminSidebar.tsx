"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Shield } from "lucide-react";
import SuperAdminDesktopSidebar from "./SuperAdminDesktopSidebar";
import SuperAdminMobileSidebar from "./SuperAdminMobileSidebar";
import type { CurrentUser } from "@/lib/checkUser";

export default function SuperAdminSidebar({ user }: { user: CurrentUser }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();

  // Handle hydration
  useEffect(() => {
    setMounted(true);
  }, []);

  // Auto-collapse on mobile
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setCollapsed(true);
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Update CSS variable when collapsed state changes
  useEffect(() => {
    if (typeof document !== "undefined") {
      const updateSidebarWidth = () => {
        if (window.innerWidth >= 768) {
          document.documentElement.style.setProperty(
            "--sidebar-width",
            collapsed ? "64px" : "256px"
          );
        } else {
          document.documentElement.style.removeProperty("--sidebar-width");
        }
      };

      updateSidebarWidth();
      window.addEventListener("resize", updateSidebarWidth);
      return () => window.removeEventListener("resize", updateSidebarWidth);
    }
  }, [collapsed]);

  if (!mounted) {
    return null;
  }

  return (
    <>
      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-sidebar border-b border-sidebar-border z-40 flex items-center justify-between px-4">
        <div className="flex items-center">
          <SuperAdminMobileSidebar pathname={pathname} user={user} />
          <div className="flex items-center space-x-2 ml-4">
            <div className="h-8 w-8 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <span className="font-bold text-lg text-sidebar-foreground">
              Super Admin
            </span>
          </div>
        </div>
      </div>

      {/* Desktop Sidebar */}
      <SuperAdminDesktopSidebar
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        pathname={pathname}
        user={user}
      />
    </>
  );
}
