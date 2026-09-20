// `as const` so `icon` narrows to a literal union rather than string. The two
// org sidebars index their icon maps with it, so a config entry naming an icon
// they do not provide becomes a compile error instead of undefined at runtime.
//
// `labelKey` resolves against the `org.nav` namespace. It is a key rather than
// a label because this config is imported by client components that render in
// whichever locale the reader chose; a literal here would be English on /ar.
export const sidebarItems = [
  {
    name: "dashboard",
    labelKey: "dashboard",
    icon: "LayoutDashboard",
    path: "/dashboard",
  },
  {
    name: "cars",
    labelKey: "cars",
    icon: "CarFront",
    path: "/cars",
  },
  {
    name: "test-drives",
    labelKey: "testDrives",
    icon: "Calendar",
    path: "/test-drives",
  },
  {
    name: "messages",
    labelKey: "messages",
    icon: "MessageSquare",
    path: "/messages",
    showUnreadBadge: true,
  },
  {
    name: "billing",
    labelKey: "billing",
    icon: "CreditCard",
    path: "/billing",
  },
  {
    name: "audit-logs",
    labelKey: "auditLogs",
    icon: "ScrollText",
    path: "/audit-logs",
  },
  {
    name: "settings",
    labelKey: "settings",
    icon: "Settings",
    path: "/settings",
  },
] as const;
