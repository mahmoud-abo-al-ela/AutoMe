// `as const` so `icon` narrows to a literal union rather than string. The two
// org sidebars index their icon maps with it, so a config entry naming an icon
// they do not provide becomes a compile error instead of undefined at runtime.
export const sidebarItems = [
  {
    name: "dashboard",
    label: "Dashboard",
    icon: "LayoutDashboard",
    path: "/dashboard",
  },
  {
    name: "cars",
    label: "Cars",
    icon: "CarFront",
    path: "/cars",
  },
  {
    name: "test-drives",
    label: "Test Drives",
    icon: "Calendar",
    path: "/test-drives",
  },
  {
    name: "messages",
    label: "Messages",
    icon: "MessageSquare",
    path: "/messages",
    showUnreadBadge: true,
  },
  {
    name: "billing",
    label: "Billing",
    icon: "CreditCard",
    path: "/billing",
  },
  {
    name: "audit-logs",
    label: "Audit Logs",
    icon: "ScrollText",
    path: "/audit-logs",
  },
  {
    name: "settings",
    label: "Settings",
    icon: "Settings",
    path: "/settings",
  },
] as const;

