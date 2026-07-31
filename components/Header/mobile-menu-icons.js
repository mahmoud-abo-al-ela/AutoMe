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

// Icon map for nav items (keyed by the icon name in HeaderConfig).
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
export function getNavIcon(label) {
  const icons = {
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
