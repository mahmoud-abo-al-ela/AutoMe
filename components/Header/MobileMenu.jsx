"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import {
  Heart,
  CarFront,
  LayoutDashboard,
  ArrowLeft,
  ChevronRight,
} from "lucide-react";
import { usePathname } from "next/navigation";
import { navItems, signedInLinks } from "@/lib/HeaderConfig";
import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

// Reusable NavLink component with animation delay support
function NavLink({
  href,
  label,
  icon,
  iconClass,
  size = 20,
  onClick,
  isActive,
  animationDelay = 0,
}) {
  const Icon = icon
    ? { Heart, CarFront, LayoutDashboard, ArrowLeft }[icon]
    : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: animationDelay / 1000 }}
    >
      <Link
        href={href}
        className={`group flex items-center justify-between w-full 
        ${icon ? "flex-row" : "flex-row"} 
        text-sm font-medium transition-all duration-300 py-3 px-4 rounded-lg 
        ${
          isActive
            ? "text-primary bg-primary/10 shadow-sm"
            : "hover:text-primary hover:bg-muted"
        }`}
        onClick={onClick}
        aria-current={isActive ? "page" : undefined}
        title={label}
        aria-label={label}
      >
        <div className="flex items-center space-x-3">
          {Icon && (
            <div
              className={`p-1.5 rounded-md ${
                isActive
                  ? "bg-primary/20"
                  : "bg-muted group-hover:bg-primary/10"
              } transition-colors duration-200`}
            >
              <Icon
                size={size}
                className={`${iconClass} ${
                  isActive ? "text-primary" : ""
                } transition-transform duration-300 group-hover:scale-110`}
              />
            </div>
          )}
          <span className={`${isActive ? "font-semibold" : ""}`}>{label}</span>
        </div>
        <ChevronRight
          size={16}
          className={`text-muted-foreground transition-transform duration-300 ${
            isActive ? "opacity-100" : "opacity-0 group-hover:opacity-70"
          } group-hover:translate-x-1`}
        />
      </Link>
    </motion.div>
  );
}

export default function MobileMenu({ isMenuOpen, setIsMenuOpen, user }) {
  const pathname = usePathname();
  const isAdmin = user?.role === "ADMIN";
  const menuRef = useRef(null);

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

  useEffect(() => {
    const handleTouchStart = (e) => {
      const touchDown = e.touches[0].clientY;
      menuRef.current.dataset.touchStartY = touchDown;
    };

    const handleTouchMove = (e) => {
      if (!menuRef.current || !menuRef.current.dataset.touchStartY) return;

      const touchDown = parseInt(menuRef.current.dataset.touchStartY);
      const currentTouch = e.touches[0].clientY;
      const diff = touchDown - currentTouch;

      if (diff < -50) {
        setIsMenuOpen(false);
        menuRef.current.dataset.touchStartY = 0;
      }
    };

    if (isMenuOpen && menuRef.current) {
      menuRef.current.addEventListener("touchstart", handleTouchStart);
      menuRef.current.addEventListener("touchmove", handleTouchMove);
    }

    return () => {
      if (menuRef.current) {
        menuRef.current.removeEventListener("touchstart", handleTouchStart);
        menuRef.current.removeEventListener("touchmove", handleTouchMove);
      }
    };
  }, [isMenuOpen, setIsMenuOpen]);

  return (
    <AnimatePresence>
      {isMenuOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm md:hidden"
            style={{ zIndex: 39 }}
            onClick={() => setIsMenuOpen(false)}
          />
          <X
            className="fixed top-4 right-4 z-50 hover:text-primary cursor-pointer bg-white rounded-md p-1"
            size={24}
            onClick={() => setIsMenuOpen(false)}
          />
          <motion.div
            ref={menuRef}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{
              duration: 0.3,
              type: "spring",
              stiffness: 400,
              damping: 30,
            }}
            className="fixed top-16 left-0 w-full bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 border-b shadow-lg md:hidden py-4 px-4 max-h-[calc(100vh-4rem)] overflow-y-auto"
            style={{ zIndex: 40 }}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Menu</h2>
              <SignedIn>
                <div className="flex items-center space-x-3">
                  <div className="text-sm text-muted-foreground">
                    Your Account
                  </div>
                  <UserButton
                    afterSignOutUrl="/"
                    appearance={{
                      elements: {
                        avatarBox: "w-8 h-8 rounded-full shadow-md",
                      },
                    }}
                  />
                </div>
              </SignedIn>
            </div>

            <nav className="flex flex-col space-y-1.5">
              {navItems.map((item, index) => (
                <NavLink
                  key={item.href}
                  href={item.href}
                  label={item.label}
                  onClick={() => setIsMenuOpen(false)}
                  isActive={pathname === item.href}
                  animationDelay={index * 50 + 50}
                />
              ))}

              <div className="h-[1px] bg-border my-3"></div>

              <SignedOut>
                {pathname !== "/sign-in" && pathname !== "/sign-up" && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: 0.3,
                      delay: navItems.length * 0.05 + 0.1,
                    }}
                  >
                    <Button
                      variant="default"
                      className="w-full cursor-pointer bg-[#0532a3] text-white hover:bg-[#0532a3]/90 hover:text-white mt-2 py-5 rounded-lg shadow-sm transition-all duration-300 hover:shadow"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <Link
                        href="/sign-in"
                        className="w-full flex items-center justify-center"
                      >
                        Sign In
                      </Link>
                    </Button>
                  </motion.div>
                )}
              </SignedOut>
              <SignedIn>
                <div className="flex flex-col space-y-1.5">
                  {signedInLinks
                    .filter(
                      (link) =>
                        (!link.adminOnly || isAdmin) &&
                        (!link.notAdmin || !isAdmin) &&
                        (!link.adminPath || pathname === link.adminPath)
                    )
                    .map((link, index) => (
                      <NavLink
                        key={link.href}
                        href={link.href}
                        label={link.label}
                        icon={link.icon}
                        iconClass={link.iconClass}
                        size={link.size}
                        onClick={() => setIsMenuOpen(false)}
                        isActive={pathname === link.href}
                        animationDelay={(navItems.length + index) * 50 + 100}
                      />
                    ))}
                </div>
              </SignedIn>
            </nav>

            <div className="mt-6 pt-4 border-t border-border">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.3,
                  delay: (navItems.length + signedInLinks.length) * 0.05 + 0.15,
                }}
                className="text-xs text-center text-muted-foreground"
              >
                © 2023 AutoMe. All rights reserved.
              </motion.div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
