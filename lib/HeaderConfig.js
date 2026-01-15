// Shared navigation configuration
export const navItems = [
  { href: "/cars", label: "Browse Cars" },
  { href: "/compare", label: "Compare" },
  { href: "/faq", label: "FAQ" },
];

// Admin navigation for organization members (OWNER, ADMIN, MEMBER)
export const adminNavItems = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/cars", label: "Cars" },
  { href: "/admin/test-drives", label: "Test Drives" },
  { href: "/admin/messages", label: "Messages" },
];

export const signedInLinks = [
  {
    href: "/wishlist",
    label: "Wishlist",
    icon: "Heart",
    iconClass: "hover:text-red-500",
    size: 24,
  },
  {
    href: "/test-drive",
    label: "Test Drive",
    icon: "CarFront",
    iconClass: "hover:text-primary",
    size: 24,
  },
  {
    href: "/messages",
    label: "Messages",
    icon: "MessageSquare",
    iconClass: "hover:text-primary",
    size: 24,
    showUnreadBadge: true,
  },
];
