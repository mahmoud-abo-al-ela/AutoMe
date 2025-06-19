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
} from "lucide-react";
import MobileMenu from "./MobileMenu";
import { Button } from "@/components/ui/button";
import { UserButton, SignedIn, SignedOut } from "@clerk/nextjs";
import { usePathname } from "next/navigation";
import { navItems, signedInLinks } from "@/lib/HeaderConfig";

function NavLink({
  href,
  label,
  icon,
  iconClass,
  size = 24,
  isMobile,
  onClick,
  isActive,
}) {
  const Icon = icon
    ? { Heart, CarFront, LayoutDashboard, ArrowLeft }[icon]
    : null;
  return (
    <Link
      href={href}
      className={`group flex items-center space-x-2 text-sm font-medium transition-all duration-200 
        ${isMobile ? "py-1" : "px-3 py-2 rounded-md relative overflow-hidden"}
        ${
          isActive
            ? "text-primary font-semibold" + (!isMobile ? " bg-primary/5" : "")
            : "hover:text-primary"
        }
      `}
      onClick={onClick}
      aria-current={isActive ? "page" : undefined}
      title={label}
      aria-label={label}
    >
      {Icon && (
        <Icon
          size={size}
          className={`${iconClass} ${
            isActive ? "text-primary" : ""
          } transition-transform duration-300 group-hover:scale-110`}
        />
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

export default function MainHeader({ user }) {
  const isAdmin = user?.role === "ADMIN";
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const pathname = usePathname();
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener("scroll", handleScroll);

    handleScroll();

    if (isMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      window.removeEventListener("scroll", handleScroll);
      document.body.style.overflow = "unset";
    };
  }, [isMenuOpen]);

  useEffect(() => {
    setIsMenuOpen(false);
  }, [pathname]);

  return (
    <header
      className={`fixed top-0 z-50 w-full border-b transition-all duration-300 ease-in-out
          ${isMenuOpen ? "border-transparent" : ""}
          ${
            isScrolled
              ? "bg-background/90 backdrop-blur-md supports-[backdrop-filter]:bg-background/60 shadow-sm"
              : "bg-background"
          }
        `}
    >
      <>
        <div className="container flex h-16 items-center mx-auto">
          <Link
            href="/"
            className="mr-6 flex items-center space-x-2 transition-transform duration-300 hover:scale-105"
            title="Home"
            aria-label="Home"
          >
            <span className="text-2xl font-bold text-primary">
              Auto<span className="text-black dark:text-white">Me</span>
            </span>
          </Link>
          <div className="hidden md:flex items-center justify-between w-full">
            <nav className="flex justify-center space-x-1 lg:space-x-2 mx-6 flex-1">
              {navItems.map((item) => (
                <NavLink
                  key={item.href}
                  href={item.href}
                  label={item.label}
                  isActive={pathname === item.href}
                />
              ))}
            </nav>

            <div className="space-x-6">
              <SignedOut>
                {pathname !== "/sign-in" && pathname !== "/sign-up" && (
                  <Button
                    variant="default"
                    className="cursor-pointer bg-[#0532a3] text-white hover:bg-[#0532a3]/90 hover:text-white transition-all duration-300 hover:shadow-md"
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
                      (link) =>
                        (!link.adminOnly || isAdmin) &&
                        (!link.notAdmin || !isAdmin) &&
                        (!link.adminPath || pathname === link.adminPath)
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

          <button
            className="md:hidden ml-auto flex items-center justify-center rounded-full w-10 h-10 transition-colors hover:bg-muted active:bg-muted/80"
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

        <MobileMenu
          isMenuOpen={isMenuOpen}
          setIsMenuOpen={setIsMenuOpen}
          user={user}
        />
      </>
    </header>
  );
}
