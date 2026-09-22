/**
 * Navigation config.
 *
 * Items carry a `labelKey` into the `nav` message namespace rather than an
 * English string. `navIcon` is an explicit key too: the mobile menu used to
 * look its icon up by the English label, which meant every translated item
 * silently fell back to the generic Home icon.
 */

/** A key in messages/{locale}/nav.json. */
export type NavLabelKey =
  | "browseCars"
  | "dealerships"
  | "compare"
  | "faq"
  | "dashboard"
  | "cars"
  | "testDrives"
  | "testDrive"
  | "messages"
  | "wishlist";

export type NavItem = {
  href: string;
  labelKey: NavLabelKey;
};

// Navigation for the main platform domain
export const navItems: NavItem[] = [
  { href: "/cars", labelKey: "browseCars" },
  { href: "/dealerships", labelKey: "dealerships" },
  { href: "/compare", labelKey: "compare" },
  { href: "/faq", labelKey: "faq" },
];

// Navigation for subdomain (single dealership context)
// Hides "Dealerships" since user is already on a specific dealership
export const subdomainNavItems: NavItem[] = [
  { href: "/cars", labelKey: "browseCars" },
  { href: "/compare", labelKey: "compare" },
  { href: "/faq", labelKey: "faq" },
];

// Admin navigation for organization members (OWNER, ADMIN, MEMBER)
export const adminNavItems: NavItem[] = [
  { href: "/admin", labelKey: "dashboard" },
  { href: "/admin/cars", labelKey: "cars" },
  { href: "/admin/test-drives", labelKey: "testDrives" },
  { href: "/admin/messages", labelKey: "messages" },
];

export const signedInLinks = [
  {
    href: "/messages",
    labelKey: "messages",
    icon: "MessageSquare",
    iconClass: "hover:text-primary",
    size: 24,
    notAdmin: true,
    showUnreadBadge: true,
  },
  {
    href: "/wishlist",
    labelKey: "wishlist",
    icon: "Heart",
    iconClass: "hover:text-red-500",
    size: 24,
    notAdmin: true,
  },
  {
    href: "/test-drive",
    labelKey: "testDrive",
    icon: "CarFront",
    iconClass: "hover:text-primary",
    size: 24,
    notAdmin: true,
  },
] satisfies Array<{
  href: string;
  labelKey: NavLabelKey;
  icon: string;
  iconClass: string;
  size: number;
  notAdmin: boolean;
  showUnreadBadge?: boolean;
}>;
