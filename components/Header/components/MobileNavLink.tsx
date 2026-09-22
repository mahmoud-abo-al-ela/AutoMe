"use client";

import { Link } from "@/i18n/navigation";
import { ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import { UnreadBadge } from "@/components/StreamChat";
import type { LucideIcon } from "lucide-react";

export default function MobileNavLink({
  href,
  label,
  IconComponent,
  onClick,
  isActive,
  animationDelay = 0,
  showUnreadBadge = false,
  size = 18,
}: {
  href: string;
  label: string;
  IconComponent?: LucideIcon | null;
  onClick?: () => void;
  isActive?: boolean;
  animationDelay?: number;
  showUnreadBadge?: boolean;
  size?: number;
}) {
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
          {IconComponent && (
            <IconComponent
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
          {showUnreadBadge && <UnreadBadge />}
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
