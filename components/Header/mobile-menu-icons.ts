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
import type { NavLabelKey } from "@/lib/HeaderConfig";

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

/**
 * Icon for a nav item, keyed by its message key.
 *
 * This used to be keyed by the English label, which worked only for as long as
 * the label *was* English. Translating the nav would have made every lookup
 * miss and silently rendered the Home icon for every item — no error, just a
 * column of identical icons in Arabic.
 */
export function getNavIcon(labelKey: NavLabelKey): LucideIcon {
  const icons: Record<NavLabelKey, LucideIcon> = {
    browseCars: Search,
    dealerships: Building2,
    compare: Scale,
    faq: HelpCircle,
    dashboard: LayoutDashboard,
    cars: CarFront,
    testDrives: Calendar,
    testDrive: Calendar,
    messages: MessageSquare,
    wishlist: Heart,
  };
  return icons[labelKey] ?? Home;
}
