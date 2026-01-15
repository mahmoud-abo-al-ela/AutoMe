"use client";

import Link from "next/link";
import MobileMenu from "./MobileMenu";
import { DesktopNav } from "./_components/DesktopNav";
import { ContextSwitcher } from "./_components/ContextSwitcher";
import { UserSection } from "./_components/UserSection";
import { MobileHeaderIcons } from "./_components/MobileHeaderIcons";
import { useHeaderLogic } from "./_components/useHeaderLogic";

export default function MainHeader({ user, organization }) {
  const {
    isMenuOpen,
    setIsMenuOpen,
    pathname,
    hasOrgMembership,
    isOwner,
    isOnAdminPath,
    showAdminNav,
  } = useHeaderLogic(user, organization);

  // Get the user's first organization slug for admin link
  const userOrgSlug = user?.memberships?.[0]?.organization?.slug || organization?.slug;

  return (
    <header
      className={`fixed top-0 z-50 w-full border-b transition-all duration-300 ease-in-out bg-background ${isMenuOpen ? "border-transparent" : ""
        }`}
    >
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
          <DesktopNav showAdminNav={showAdminNav} pathname={pathname} />
          <ContextSwitcher
            hasOrgMembership={hasOrgMembership}
            orgSlug={userOrgSlug}
          />
          <UserSection
            pathname={pathname}
            isOwner={isOwner}
            hasOrgMembership={hasOrgMembership}
          />
        </div>

        <MobileHeaderIcons
          hasOrgMembership={hasOrgMembership}
          isMenuOpen={isMenuOpen}
          setIsMenuOpen={setIsMenuOpen}
        />
      </div>

      <MobileMenu
        isMenuOpen={isMenuOpen}
        setIsMenuOpen={setIsMenuOpen}
        user={user}
        organization={organization}
        userOrgSlug={userOrgSlug}
      />
    </header>
  );
}
