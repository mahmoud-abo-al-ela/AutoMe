// Navigation for the main platform domain
export const navItems = [
  { href: "/cars", label: "Browse Cars" },
  { href: "/dealerships", label: "Dealerships" },
  { href: "/compare", label: "Compare" },
  { href: "/faq", label: "FAQ" },
];

// Navigation for subdomain (single dealership context)
// Hides "Dealerships" since user is already on a specific dealership
export const subdomainNavItems = [
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
    href: "/messages",
    label: "Messages",
    icon: "MessageSquare",
    iconClass: "hover:text-primary",
    size: 24,
    notAdmin: true,
    showUnreadBadge: true,
  },
  {
    href: "/wishlist",
    label: "Wishlist",
    icon: "Heart",
    iconClass: "hover:text-red-500",
    size: 24,
    notAdmin: true,
  },
  {
    href: "/test-drive",
    label: "Test Drive",
    icon: "CarFront",
    iconClass: "hover:text-primary",
    size: 24,
    notAdmin: true,
  },
];
