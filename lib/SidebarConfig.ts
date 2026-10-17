export const sidebarItems = [
  {
    name: "dashboard",
    labelKey: "dashboard",
    icon: "LayoutDashboard",
    path: "/dashboard",
  },
  {
    name: "requests",
    labelKey: "requests",
    icon: "Inbox",
    path: "/requests",
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
    name: "insights",
    labelKey: "insights",
    icon: "BarChart3",
    path: "/insights",
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
