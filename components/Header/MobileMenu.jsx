"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { SignedIn, SignedOut, UserButton, useClerk } from "@clerk/nextjs";
import {
  Heart,
  CarFront,
  LayoutDashboard,
  ArrowLeft,
  ChevronRight,
  MessageSquare,
  Home,
  Search,
  Scale,
  HelpCircle,
  Calendar,
  LogOut,
  Building2,
} from "lucide-react";
import { usePathname } from "next/navigation";
import { navItems, subdomainNavItems, adminNavItems, signedInLinks } from "@/lib/HeaderConfig";
import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { UnreadBadge } from "@/components/StreamChat";

// Icon map for nav items
const iconMap = {
  Heart,
  CarFront,
  LayoutDashboard,
  ArrowLeft,
  MessageSquare,
  Home,
  Search,
  Scale,
  HelpCircle,
  Calendar,
};

// Get icon for nav item based on label
function getNavIcon(label) {
  const icons = {
    "Browse Cars": Search,
    Dealerships: Building2,
    Compare: Scale,
    FAQ: HelpCircle,
    Dashboard: LayoutDashboard,
    Cars: CarFront,
    "Test Drives": Calendar,
    Messages: MessageSquare,
  };
  return icons[label] || Home;
}

// Reusable NavLink component
function NavLink({
  href,
  label,
  icon,
  iconClass,
  size = 18,
  onClick,
  isActive,
  animationDelay = 0,
  showUnreadBadge = false,
  IconComponent = null,
  organizationId,
}) {
  const Icon = IconComponent || (icon ? iconMap[icon] : null);

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.2, delay: animationDelay / 1000 }}
    >
      <Link
        href={href}
        className={`group flex items-center justify-between w-full text-sm font-medium transition-all duration-200 py-3.5 px-4 rounded-2xl ${isActive
          ? "text-white bg-gradient-to-r from-blue-600 to-indigo-600 shadow-lg shadow-blue-500/25"
          : "text-foreground hover:bg-muted"
          }`}
        onClick={onClick}
        aria-current={isActive ? "page" : undefined}
      >
        <div className="flex items-center gap-3">
          {Icon && (
            <Icon
              size={size}
              className={`${isActive
                ? "text-white"
                : "text-muted-foreground group-hover:text-foreground"
                } transition-colors`}
            />
          )}
          <span>{label}</span>
        </div>
        <div className="flex items-center gap-2">
          {showUnreadBadge && <UnreadBadge organizationId={organizationId} />}
          {!isActive && (
            <ChevronRight
              size={16}
              className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-all group-hover:translate-x-0.5"
            />
          )}
        </div>
      </Link>
    </motion.div>
  );
}

export default function MobileMenu({
  isMenuOpen,
  setIsMenuOpen,
  user,
  organizationSlug,
  organization,
}) {
  const pathname = usePathname();

  // Check if user has any organization membership
  const hasOrgMembership = user?.memberships?.length > 0;

  // Get user's first organization (for dashboard link)
  const userOrg = user?.memberships?.[0]?.organization;
  const userOrgSlug = organizationSlug || userOrg?.slug;

  // Whether we're on a subdomain (tenant context)
  const isOnSubdomain = !!organizationSlug;

  // Check if user can manage the organization (OWNER role in any org)
  const isOwner =
    hasOrgMembership && user.memberships.some((m) => m.role === "OWNER");

  const menuRef = useRef(null);
  const { signOut } = useClerk();
  const isOnAdminPath = pathname?.startsWith("/admin");
  const isOnOrgPath = pathname?.startsWith("/org/");

  // Show admin nav for org members when on subdomain and not already on admin path
  const showAdminNav = hasOrgMembership && organizationSlug && !isOnAdminPath;

  // Dashboard link for org members (used on main domain)
  const orgDashboardHref = userOrgSlug ? `/org/${userOrgSlug}/dashboard` : "/admin";

  // Use subdomain-specific nav items when on a tenant subdomain
  const publicNavItems = isOnSubdomain ? subdomainNavItems : navItems;
  const navToShow = showAdminNav ? adminNavItems : publicNavItems;

  // Filter out messages from signed-in links (it's now in header)
  const filteredSignedInLinks = signedInLinks.filter(
    (link) => link.icon !== "MessageSquare",
  );

  useEffect(() => {
    // Prevent body scroll when menu is open
    if (isMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMenuOpen]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target) &&
        isMenuOpen
      ) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isMenuOpen, setIsMenuOpen]);

  return (
    <AnimatePresence>
      {isMenuOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm md:hidden"
            style={{ zIndex: 39 }}
            onClick={() => setIsMenuOpen(false)}
          />

          {/* Menu Panel */}
          <motion.div
            ref={menuRef}
            initial={{ opacity: 0, y: -10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="fixed top-14 left-3 right-3 bg-background border rounded-3xl shadow-2xl md:hidden overflow-hidden"
            style={{ zIndex: 40, maxHeight: "calc(100vh - 5rem)" }}
          >
            {/* User section */}
            <SignedIn>
              <div className="px-5 py-4 bg-gradient-to-r from-slate-50 to-blue-50 border-b">
                <div className="flex items-center gap-3">
                  <UserButton
                    afterSignOutUrl="/"
                    appearance={{
                      elements: {
                        avatarBox: "w-11 h-11 rounded-full shadow-md",
                      },
                    }}
                  />
                  <div className="flex-1">
                    <p className="font-semibold text-sm">
                      {user?.name || "Welcome back"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {user?.email}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setIsMenuOpen(false);
                      signOut({ redirectUrl: "/" });
                    }}
                    className="p-2 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-50 transition-colors"
                    aria-label="Sign out"
                  >
                    <LogOut className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </SignedIn>

            {/* Navigation */}
            <div
              className="p-3 overflow-y-auto"
              style={{ maxHeight: "calc(100vh - 14rem)" }}
            >
              {/* Context switcher for org members */}
              {hasOrgMembership && !isOnOrgPath && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className="mb-3"
                >
                  {isOnAdminPath ? (
                    <Link href="/" onClick={() => setIsMenuOpen(false)}>
                      <Button
                        variant="outline"
                        className="w-full py-6 rounded-2xl font-semibold"
                      >
                        View Storefront
                      </Button>
                    </Link>
                  ) : (
                    <Link href={orgDashboardHref} onClick={() => setIsMenuOpen(false)}>
                      <Button className="w-full py-6 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold shadow-lg shadow-blue-500/25">
                        Dashboard
                      </Button>
                    </Link>
                  )}
                </motion.div>
              )}

              {/* Main nav */}
              <div className="space-y-1">
                {navToShow.map((item, index) => {
                  const NavIcon = getNavIcon(item.label);
                  return (
                    <NavLink
                      key={item.href}
                      href={item.href}
                      label={item.label}
                      IconComponent={NavIcon}
                      onClick={() => setIsMenuOpen(false)}
                      isActive={pathname === item.href}
                      animationDelay={index * 40}
                    />
                  );
                })}
              </div>

              {/* Signed in links */}
              <SignedIn>
                <div className="my-3 mx-2 h-px bg-border" />
                <div className="space-y-1">
                  {filteredSignedInLinks
                    .filter(
                      (link) =>
                        (!link.adminOnly || isOwner) &&
                        (!link.notAdmin || !isOwner) &&
                        (!link.adminPath || pathname === link.adminPath),
                    )
                    .map((link, index) => (
                      <NavLink
                        key={link.href}
                        href={link.href}
                        label={link.label}
                        icon={link.icon}
                        iconClass={link.iconClass}
                        size={18}
                        onClick={() => setIsMenuOpen(false)}
                        isActive={pathname === link.href}
                        animationDelay={(navItems.length + index) * 40}
                        showUnreadBadge={link.showUnreadBadge}
                        organizationId={organization?.id}
                      />
                    ))}
                </div>
              </SignedIn>

              {/* Sign in button */}
              <SignedOut>
                {pathname !== "/sign-in" && pathname !== "/sign-up" && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, delay: 0.15 }}
                    className="mt-4"
                  >
                    <Link href="/sign-in" onClick={() => setIsMenuOpen(false)}>
                      <Button className="w-full py-6 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold shadow-lg shadow-blue-500/25">
                        Sign In
                      </Button>
                    </Link>
                  </motion.div>
                )}
              </SignedOut>
            </div>

            {/* Footer */}
            <div className="px-5 py-3 border-t bg-muted/30 text-center">
              <p className="text-[10px] text-muted-foreground">
                {isOnSubdomain && organization?.name
                  ? `© 2026 ${organization.name} • Powered by AutoMe`
                  : "© 2026 AutoMe • All rights reserved"}
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
