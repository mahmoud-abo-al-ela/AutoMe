"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { CarFront, MessageSquare } from "lucide-react";
import MobileSidebar from "./MobileSidebar";
import DesktopSidebar from "./DesktopSidebar";
import { OrgUnreadBadge } from "@/components/StreamChat";
import Link from "next/link";

export default function AdminSidebar({ organization, userRole }) {
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

  const orgName = organization?.name || "AutoMe Admin";

  return (
    <>
      {/* Mobile Header with Hamburger */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-sidebar border-b border-sidebar-border z-40 flex items-center justify-between px-4">
        <div className="flex items-center">
          <MobileSidebar pathname={pathname} organization={organization} userRole={userRole} />
          <div className="flex items-center space-x-2 ml-4">
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
              <div className="h-8 w-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                <CarFront className="h-5 w-5 text-white" />
              </div>
            )}
            <span className="font-bold text-lg text-sidebar-foreground truncate max-w-[150px]">
              {orgName}
            </span>
          </div>
        </div>
        {/* Messages icon with unread badge */}
        <Link
          href={`/org/${organization.slug}/messages`}
          className="relative p-2 rounded-lg hover:bg-sidebar-accent transition-colors"
          title="Messages"
        >
          <MessageSquare className="h-5 w-5 text-sidebar-foreground" />
          <OrgUnreadBadge
            organizationId={organization.id}
            className="absolute -top-0.5 -right-0.5"
          />
        </Link>
      </div>

      {/* Desktop Sidebar */}
      <DesktopSidebar
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        pathname={pathname}
        organization={organization}
        userRole={userRole}
      />
    </>
  );
}
