"use client";

import { navItems } from "@/lib/HeaderConfig";
import HeaderNavLink from "./HeaderNavLink";

export default function DesktopNav({ pathname }) {
  return (
    <nav className="flex justify-center space-x-1 lg:space-x-2 mx-6 flex-1">
      {navItems.map((item) => (
        <HeaderNavLink
          key={item.href}
          href={item.href}
          label={item.label}
          isActive={pathname === item.href}
        />
      ))}
    </nav>
  );
}
