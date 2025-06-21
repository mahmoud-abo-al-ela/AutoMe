"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { CarFront } from "lucide-react";
import MobileSidebar from "./MobileSidebar";
import DesktopSidebar from "./DesktopSidebar";

export default function AdminSidebar() {
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
        // Only apply sidebar width on non-mobile devices
        if (window.innerWidth >= 768) {
          document.documentElement.style.setProperty(
            "--sidebar-width",
            collapsed ? "64px" : "256px"
          );
        } else {
          // Remove the property on mobile
          document.documentElement.style.removeProperty("--sidebar-width");
        }
      };

      updateSidebarWidth();

      // Update on resize
      window.addEventListener("resize", updateSidebarWidth);
      return () => window.removeEventListener("resize", updateSidebarWidth);
    }
  }, [collapsed]);

  if (!mounted) {
    return null;
  }

  return (
    <>
      {/* Mobile Header with Hamburger */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-sidebar border-b border-sidebar-border z-40 flex items-center px-4">
        <MobileSidebar pathname={pathname} />
        <div className="flex items-center space-x-2 ml-4">
          <div className="h-8 w-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
            <CarFront className="h-5 w-5 text-white" />
          </div>
          <span className="font-bold text-lg text-sidebar-foreground">
            AutoMe Admin
          </span>
        </div>
      </div>

      {/* Desktop Sidebar */}
      <DesktopSidebar
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        pathname={pathname}
      />
    </>
  );
}
