// Icon config for the mobile menu nav items.
import {
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
  Building2,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

// Icon map for nav items (keyed by the icon name in HeaderConfig). Left to
// infer its literal keys so `keyof typeof iconMap` stays meaningful at the
// call site; a Record<string, …> would make that lookup accept anything.
export const iconMap = {
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

// Get icon for a nav item based on its label.
export function getNavIcon(label: string): LucideIcon {
  const icons: Record<string, LucideIcon> = {
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
