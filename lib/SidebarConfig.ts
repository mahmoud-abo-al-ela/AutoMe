// `as const` so `icon` narrows to a literal union rather than string. (The
// dashboard is a top bar now and shows labels only; `icon` is kept for a
// compact view.)
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
    name: "questions",
    labelKey: "buyerQuestions",
    icon: "MessageCircleQuestion",
    path: "/questions",
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
