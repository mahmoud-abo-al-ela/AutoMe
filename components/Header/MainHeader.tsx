"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Menu,
  X,
  Heart,
  CarFront,
  LayoutDashboard,
  ArrowLeft,
  MessageSquare,
} from "lucide-react";
import MobileMenu from "./MobileMenu";
import { Button } from "@/components/ui/button";
import { UserButton, SignedIn, SignedOut } from "@clerk/nextjs";
import { usePathname } from "next/navigation";
import { navItems, subdomainNavItems, adminNavItems, signedInLinks } from "@/lib/HeaderConfig";
import { UnreadBadge } from "@/components/StreamChat";
import { cn } from "@/lib/utils";

const NAV_ICONS = { Heart, CarFront, LayoutDashboard, ArrowLeft, MessageSquare };

type NavLinkProps = {
  href: string;
  label: string;
  /** Key into NAV_ICONS. A link with no icon renders as a text nav item. */
  icon?: string;
  iconClass?: string;
  size?: number;
  isMobile?: boolean;
  onClick?: () => void;
  isActive?: boolean;
  showUnreadBadge?: boolean;
  organizationId?: string | null;
};

function NavLink({
  href,
  label,
  icon,
  iconClass,
  size = 24,
  isMobile,
  onClick,
  isActive,
  showUnreadBadge,
  organizationId,
}: NavLinkProps) {
  const Icon = icon ? NAV_ICONS[icon as keyof typeof NAV_ICONS] : null;

  // Special styling for messages icon
  const isMessagesIcon = icon === "MessageSquare";

  return (
    <Link
      href={href}
      className={cn(
        "group flex items-center text-sm font-medium transition-all duration-200 relative",
        isMobile ? "py-1 space-x-2" : "rounded-md relative overflow-hidden",
        isMessagesIcon && !isMobile
          ? "p-2"
          : !isMobile
            ? "px-3 py-2 space-x-2"
            : "space-x-2",
        isActive
          ? `text-primary font-semibold ${!isMobile ? "bg-primary/5" : ""}`
          : "hover:text-primary",
      )}
      onClick={onClick}
      aria-current={isActive ? "page" : undefined}
      title={label}
      aria-label={label}
    >
      {Icon && (
        <span
          className={cn(
            "relative inline-flex items-center justify-center",
            isMessagesIcon &&
            !isMobile &&
            "p-1.5 rounded-full hover:bg-muted/80 transition-colors",
          )}
        >
          <Icon
            size={isMessagesIcon ? 22 : size}
            className={cn(
              iconClass,
              isActive ? "text-primary" : "",
              "transition-transform duration-300 group-hover:scale-110",
            )}
          />
          {showUnreadBadge && (
            <UnreadBadge className="absolute -top-0.5 -right-0.5" organizationId={organizationId} />
          )}
        </span>
      )}
      {!icon && (
        <>
          <span className={isActive ? "font-medium" : ""}>{label}</span>
          {!isMobile && isActive && (
            <span className="absolute bottom-0 left-0 h-0.5 w-full bg-primary transform origin-left transition-transform duration-300" />
          )}
          {!isMobile && !isActive && (
            <span className="absolute bottom-0 left-0 h-0.5 w-full bg-primary transform origin-left scale-x-0 transition-transform duration-300 group-hover:scale-x-100" />
          )}
        </>
      )}
    </Link>
  );
}

export type HeaderUser = {
  name?: string | null;
  email?: string | null;
  role?: string | null;
  memberships?: {
    role?: string | null;
    organization?: { slug?: string | null } | null;
  }[];
} | null;

export type HeaderOrganization = {
  id?: string | null;
  name?: string | null;
  logo?: string | null;
} | null;

export default function MainHeader({
  user,
  organizationSlug,
  organization,
}: {
  user?: HeaderUser;
  organizationSlug?: string | null;
  organization?: HeaderOrganization;
}) {
  // Check if user has any organization membership
  const hasOrgMembership = (user?.memberships?.length ?? 0) > 0;

  // Get user's first organization (for admin link)
  const userOrg = user?.memberships?.[0]?.organization;
  const userOrgSlug = organizationSlug || userOrg?.slug;

  // Whether we're on a subdomain (tenant context)
  const isOnSubdomain = !!organizationSlug;

  // Check if user is a platform super admin (UserRole.ADMIN)
  const isSuperAdmin = user?.role === "ADMIN";

  // Check if user can manage the organization (OWNER role in any org OR platform ADMIN)
  const isOwner =
    isSuperAdmin ||
    (hasOrgMembership && !!user?.memberships?.some((m) => m.role === "OWNER"));

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const pathname = usePathname();
  const isOnAdminPath = pathname?.startsWith("/super-admin");
  const isOnOrgPath = pathname?.startsWith("/org/");

  // Show admin nav for org members when on subdomain and not already on admin path
  // Show admin nav for org members/admins when on subdomain and not already on admin path
  const showAdminNav = (hasOrgMembership || isSuperAdmin) && organizationSlug && !isOnAdminPath;

  // Dashboard link for org members (used on main domain)
  const orgDashboardHref = userOrgSlug ? `/org/${userOrgSlug}/dashboard` : "/super-admin";

  // Use subdomain-specific nav items when on a tenant subdomain
  const publicNavItems = isOnSubdomain ? subdomainNavItems : navItems;

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
        <div className="container flex h-14 md:h-16 items-center mx-auto">
          <Link
            href="/"
            className="mr-6 flex items-center space-x-2 transition-transform duration-300 hover:scale-105"
            title={isOnSubdomain && organization?.name ? organization.name : "Home"}
            aria-label={isOnSubdomain && organization?.name ? organization.name : "Home"}
          >
            {isOnSubdomain && organization?.logo ? (
              <img
                src={organization.logo}
                alt={organization.name ?? ""}
                className="h-8 w-8 rounded-full object-cover ml-4 md:ml-0"
              />
            ) : null}
            <span className="text-2xl font-bold text-primary ml-4 md:ml-0">
              {isOnSubdomain && organization?.name ? (
                <span className="text-black dark:text-white">{organization.name}</span>
              ) : (
                <>Auto<span className="text-black dark:text-white">Me</span></>
              )}
            </span>
          </Link>
          <div className="hidden md:flex items-center justify-between w-full">
            <nav className="flex justify-center space-x-1 lg:space-x-2 mx-6 flex-1">
              {showAdminNav
                ? // Show admin navigation for org members
                adminNavItems.map((item) => (
                  <NavLink
                    key={item.href}
                    href={item.href}
                    label={item.label}
                    isActive={pathname === item.href}
                  />
                ))
                : // Show public navigation (tenant-aware)
                publicNavItems.map((item) => (
                  <NavLink
                    key={item.href}
                    href={item.href}
                    label={item.label}
                    isActive={pathname === item.href}
                  />
                ))}
            </nav>

            {/* Context switcher for org members */}
            {(hasOrgMembership || isSuperAdmin) && !isOnOrgPath && (
              <div className="mr-4">
                {isOnAdminPath ? (
                  <Button variant="outline" size="sm" asChild>
                    <Link href="/">View Storefront</Link>
                  </Button>
                ) : (
                  <Button variant="default" size="sm" asChild>
                    <Link href={orgDashboardHref}>Dashboard</Link>
                  </Button>
                )}
              </div>
            )}

            <div className="space-x-6">
              <SignedOut>
                {pathname !== "/sign-in" && pathname !== "/sign-up" && (
                  <Button
                    variant="default"
                    className="cursor-pointer transition-all duration-300 hover:shadow-md"
                  >
                    <Link
                      href="/sign-in"
                      className="w-full flex items-center justify-center"
                    >
                      Sign In
                    </Link>
                  </Button>
                )}
              </SignedOut>
              <SignedIn>
                <div className="flex items-center space-x-6">
                  {signedInLinks
                    .filter(
                      // Only notAdmin does any filtering. This also tested
                      // adminOnly and adminPath, which no entry in
                      // signedInLinks defines, so both were constant-true.
                      (link: (typeof signedInLinks)[number] & {
                        showUnreadBadge?: boolean;
                      }) => !link.notAdmin || !isOwner,
                    )
                    .map((link) => (
                      <NavLink
                        key={link.href}
                        href={link.href}
                        label={link.label}
                        icon={link.icon}
                        iconClass={link.iconClass}
                        size={link.size}
                        isActive={pathname === link.href}
                        showUnreadBadge={link.showUnreadBadge}
                        organizationId={organization?.id}
                      />
                    ))}
                  <UserButton
                    afterSignOutUrl="/"
                    appearance={{
                      elements: {
                        avatarBox:
                          "hover:scale-110 transition-transform duration-300",
                      },
                    }}
                  />
                </div>
              </SignedIn>
            </div>
          </div>

          {/* Mobile icons - Messages and Menu */}
          <div className="md:hidden ml-auto flex items-center gap-1">
            {/* Messages icon with unread badge - only show when signed in and not org owner */}
            <SignedIn>
              {!isOwner && (
                <Link
                  href="/messages"
                  className="relative flex items-center justify-center rounded-full w-10 h-10 transition-colors hover:bg-muted active:bg-muted/80"
                  title="Messages"
                >
                  <MessageSquare className="h-5 w-5" />
                  <UnreadBadge className="absolute -top-0.5 -right-0.5" organizationId={organization?.id} />
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
                  className={`absolute inset-0 h-6 w-6 transition-all duration-300 ${isMenuOpen
                    ? "opacity-100 rotate-0 scale-100"
                    : "opacity-0 rotate-90 scale-75"
                    }`}
                />
                <Menu
                  className={`absolute inset-0 h-6 w-6 transition-all duration-300 ${isMenuOpen
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
          organizationSlug={organizationSlug}
          organization={organization}
        />
      </>
    </header>
  );
}
