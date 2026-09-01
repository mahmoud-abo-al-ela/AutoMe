"use client";

import { useTranslations } from "next-intl";
import { navItems } from "@/lib/HeaderConfig";
import HeaderNavLink from "./HeaderNavLink";

export default function DesktopNav({ pathname }: { pathname: string }) {
  const t = useTranslations("nav");

  return (
    <nav className="flex justify-center gap-1 lg:gap-2 mx-6 flex-1">
      {navItems.map((item) => (
        <HeaderNavLink
          key={item.href}
          href={item.href}
          label={t(item.labelKey)}
          isActive={pathname === item.href}
        />
      ))}
    </nav>
  );
}
