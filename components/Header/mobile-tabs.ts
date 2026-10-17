import { Building2, Car, Heart, Home, LayoutDashboard, MessageSquare, Scale, type LucideIcon } from "lucide-react";

export type Viewer = "guest" | "buyer" | "dealer";

export type MobileTab = {
  href: string;
  /** A key in messages/{locale}/nav.json. */
  labelKey: "home" | "cars" | "dealerships" | "compare" | "saved" | "messages" | "dashboard";
  icon: LucideIcon;
  /** Shows the unread-messages count. */
  unread?: boolean;
};

export function mobileTabs(
  viewer: Viewer,
  { onSubdomain, dashboardHref }: { onSubdomain: boolean; dashboardHref: string }
): MobileTab[] {
  const home: MobileTab = { href: "/", labelKey: "home", icon: Home };
  const cars: MobileTab = { href: "/cars", labelKey: "cars", icon: Car };

  switch (viewer) {
    case "guest":
      return [
        home,
        cars,
        // A dealership's own storefront has no directory of dealerships.
        ...(onSubdomain ? [] : [{ href: "/dealerships", labelKey: "dealerships", icon: Building2 } satisfies MobileTab]),
        { href: "/compare", labelKey: "compare", icon: Scale },
      ];
    case "buyer":
      return [
        home,
        cars,
        { href: "/wishlist", labelKey: "saved", icon: Heart },
        { href: "/messages", labelKey: "messages", icon: MessageSquare, unread: true },
      ];
    case "dealer":
      return [home, cars, { href: dashboardHref, labelKey: "dashboard", icon: LayoutDashboard }];
  }
}
