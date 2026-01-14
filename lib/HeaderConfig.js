// Shared navigation configuration
export const navItems = [
  { href: "/cars", label: "Browse Cars" },
  { href: "/compare", label: "Compare" },
  { href: "/faq", label: "FAQ" },
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
  {
    href: "/admin",
    label: "Admin Dashboard",
    icon: "LayoutDashboard",
    iconClass: "hover:text-primary",
    size: 24,
    adminOnly: true,
  },
  {
    href: "/",
    label: "Back to App",
    icon: "ArrowLeft",
    iconClass: "hover:text-primary",
    size: 24,
    adminPath: "/admin",
  },
];
