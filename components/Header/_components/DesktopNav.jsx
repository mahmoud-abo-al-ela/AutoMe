import { navItems, adminNavItems } from "@/lib/HeaderConfig";
import { NavLink } from "./NavLink";

export function DesktopNav({ showAdminNav, pathname }) {
    const navToShow = showAdminNav ? adminNavItems : navItems;

    return (
        <nav className="flex justify-center space-x-1 lg:space-x-2 mx-6 flex-1">
            {navToShow.map((item) => (
                <NavLink
                    key={item.href}
                    href={item.href}
                    label={item.label}
                    isActive={pathname === item.href}
                />
            ))}
        </nav>
    );
}
