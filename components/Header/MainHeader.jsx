"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Menu, X, MessageSquare } from "lucide-react";
import MobileMenu from "./MobileMenu";
import { usePathname } from "next/navigation";
import { UnreadBadge } from "@/components/Chat";
import { SignedIn } from "@clerk/nextjs";
import DesktopNav from "./components/DesktopNav";
import DashboardButton from "./components/DashboardButton";
import AuthSection from "./components/AuthSection";

export default function MainHeader({ user }) {
  const hasOrgMembership = user?.memberships?.length > 0;
  const isAdmin = user?.role === "ADMIN";

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setIsMenuOpen(false);
  }, [pathname]);

  return (
    <header
      className={`fixed top-0 z-50 w-full border-b transition-all duration-300 ease-in-out bg-background
          ${isMenuOpen ? "border-transparent" : ""}
        `}
    >
      <>
        <div className="container flex h-12 md:h-16 items-center mx-auto">
          <Link
            href="/"
            className="mr-6 flex items-center space-x-2 transition-transform duration-300 hover:scale-105"
            title="Home"
            aria-label="Home"
          >
            <span className="text-2xl font-bold text-primary ml-4 md:ml-0">
              Auto<span className="text-black dark:text-white">Me</span>
            </span>
          </Link>
          <div className="hidden md:flex items-center justify-between w-full">
            <DesktopNav pathname={pathname} />

            {/* Context switcher for org members and admins */}
            <DashboardButton
              user={user}
              hasOrgMembership={hasOrgMembership}
              isAdmin={isAdmin}
              className="mr-4"
            />

            <AuthSection
              pathname={pathname}
              hasOrgMembership={hasOrgMembership}
              isAdmin={isAdmin}
            />
          </div>

          {/* Mobile icons - Messages and Menu */}
          <div className="md:hidden ml-auto flex items-center gap-1">
            {/* Messages icon with unread badge - only show when signed in and not org owner or admin */}
            <SignedIn>
              {!hasOrgMembership && !isAdmin && (
                <Link
                  href="/messages"
                  className="relative flex items-center justify-center rounded-full w-10 h-10 transition-colors hover:bg-muted active:bg-muted/80"
                  title="Messages"
                >
                  <MessageSquare className="h-5 w-5" />
                  <UnreadBadge className="absolute -top-0.5 -right-0.5" />
                </Link>
              )}
            </SignedIn>

            {/* Menu toggle */}
            <button
              className="flex items-center justify-center rounded-full w-10 h-10 transition-colors hover:bg-muted active:bg-muted/80"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label={isMenuOpen ? "Close menu" : "Open menu"}
              aria-expanded={isMenuOpen}
              aria-controls="mobile-menu"
            >
              <div className="relative w-6 h-6">
                <X
                  className={`absolute inset-0 h-6 w-6 transition-all duration-300 ${
                    isMenuOpen
                      ? "opacity-100 rotate-0 scale-100"
                      : "opacity-0 rotate-90 scale-75"
                  }`}
                />
                <Menu
                  className={`absolute inset-0 h-6 w-6 transition-all duration-300 ${
                    isMenuOpen
                      ? "opacity-0 -rotate-90 scale-75"
                      : "opacity-100 rotate-0 scale-100"
                  }`}
                />
              </div>
            </button>
          </div>
        </div>

        <MobileMenu
          isMenuOpen={isMenuOpen}
          setIsMenuOpen={setIsMenuOpen}
          user={user}
        />
      </>
    </header>
  );
}
