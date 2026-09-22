"use client";

import { Link } from "@/i18n/navigation";
import { ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import { UnreadBadge } from "@/components/StreamChat";
import { iconMap } from "./mobile-menu-icons";
import type { LucideIcon } from "lucide-react";

// Reusable animated nav link for the mobile menu.
export default function MobileMenuNavLink({
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
}: {
  href: string;
  label: string;
  /** Key into iconMap; ignored when IconComponent is supplied directly. */
  icon?: string;
  iconClass?: string;
  size?: number;
  onClick?: () => void;
  isActive?: boolean;
  animationDelay?: number;
  showUnreadBadge?: boolean;
  IconComponent?: LucideIcon | null;
  organizationId?: string | null;
}) {
  const Icon =
    IconComponent || (icon ? iconMap[icon as keyof typeof iconMap] : null);

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
