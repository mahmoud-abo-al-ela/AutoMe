"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { SignedIn } from "@clerk/nextjs";
import {
  Heart,
  CarFront,
  MessageSquare,
  Home,
  Search,
  Scale,
  HelpCircle,
} from "lucide-react";
import { navItems, signedInLinks } from "@/lib/HeaderConfig";
import MobileNavLink from "./components/MobileNavLink";
import MobileUserSection from "./components/MobileUserSection";
import MobileSignedOutSection from "./components/MobileSignedOutSection";
import DashboardButton from "./components/DashboardButton";

// Icon map for nav items
const iconMap = {
  Heart,
  CarFront,
  MessageSquare,
  Home,
  Search,
  Scale,
  HelpCircle,
};

// Get icon for nav item based on label
function getNavIcon(label) {
  const icons = {
    "Browse Cars": Search,
    Compare: Scale,
    FAQ: HelpCircle,
    Messages: MessageSquare,
  };
  return icons[label] || Home;
}

export default function MobileMenu({ isMenuOpen, setIsMenuOpen, user }) {
  const pathname = usePathname();

  // Check if user has any organization membership
  const hasOrgMembership = user?.memberships?.length > 0;
  const isAdmin = user?.role === "ADMIN";

  // Check if user can manage the organization (OWNER role in any org)
  // const isOwner = hasOrgMembership && user.memberships.some((m) => m.role === "OWNER");
  // isOwner is actually unused in the filtering below, as we check !hasOrgMembership && !isAdmin for some links

  const menuRef = useRef(null);

  // Filter out messages from signed-in links (it's now in header)
  const filteredSignedInLinks = signedInLinks.filter(
    (link) => link.icon !== "MessageSquare"
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
            <MobileUserSection user={user} setIsMenuOpen={setIsMenuOpen} />

            {/* Navigation */}
            <div
              className="p-3 overflow-y-auto"
              style={{ maxHeight: "calc(100vh - 14rem)" }}
            >
              {/* Context switcher for org members */}
              {(hasOrgMembership || isAdmin) && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className="mb-3"
                >
                  <DashboardButton
                    user={user}
                    hasOrgMembership={hasOrgMembership}
                    isAdmin={isAdmin}
                    className="w-full"
                    buttonClassName="w-full py-6 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold shadow-lg shadow-blue-500/25"
                    onClick={() => setIsMenuOpen(false)}
                  />
                </motion.div>
              )}

              {/* Main nav */}
              <div className="space-y-1">
                {navItems.map((item, index) => {
                  const NavIcon = getNavIcon(item.label);
                  return (
                    <MobileNavLink
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
                    .filter((link) => !hasOrgMembership && !isAdmin)
                    .map((link, index) => (
                      <MobileNavLink
                        key={link.href}
                        href={link.href}
                        label={link.label}
                        IconComponent={iconMap[link.icon]} // icon string map
                        size={18}
                        onClick={() => setIsMenuOpen(false)}
                        isActive={pathname === link.href}
                        animationDelay={(navItems.length + index) * 40}
                        showUnreadBadge={link.showUnreadBadge}
                      />
                    ))}
                </div>
              </SignedIn>

              {/* Sign in button */}
              <MobileSignedOutSection
                pathname={pathname}
                setIsMenuOpen={setIsMenuOpen}
              />
            </div>

            {/* Footer */}
            <div className="px-5 py-3 border-t bg-muted/30 text-center">
              <p className="text-[10px] text-muted-foreground">
                © 2026 AutoMe • All rights reserved
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
