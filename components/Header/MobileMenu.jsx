"use client";

import { useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MobileUserSection } from "./_components/MobileUserSection";
import { MobileNavigation } from "./_components/MobileNavigation";
import { useMobileMenu } from "./_components/useMobileMenu";

export default function MobileMenu({ isMenuOpen, setIsMenuOpen, user, organization, userOrgSlug }) {
  const menuRef = useRef(null);
  const { pathname, hasOrgMembership, isOwner, isOnAdminPath, navToShow } = useMobileMenu(
    user,
    organization,
    isMenuOpen,
    setIsMenuOpen,
    menuRef
  );

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
            <MobileNavigation
              hasOrgMembership={hasOrgMembership}
              isOwner={isOwner}
              pathname={pathname}
              navToShow={navToShow}
              setIsMenuOpen={setIsMenuOpen}
              userOrgSlug={userOrgSlug}
            />

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
