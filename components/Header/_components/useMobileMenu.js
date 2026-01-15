import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { navItems, adminNavItems } from "@/lib/HeaderConfig";

export function useMobileMenu(user, organization, isMenuOpen, setIsMenuOpen, menuRef) {
    const pathname = usePathname();

    // Check if user has any organization membership
    const hasOrgMembership = user?.memberships?.length > 0;

    // Check if user can manage the organization (OWNER role in any org)
    const isOwner = hasOrgMembership && user.memberships.some(
        m => m.role === 'OWNER'
    );

    const isOnAdminPath = pathname?.startsWith('/org/') && pathname?.includes('/admin');

    // Always show regular nav items
    const navToShow = navItems;

    // Prevent body scroll when menu is open
    useEffect(() => {
        if (isMenuOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "";
        }
        return () => {
            document.body.style.overflow = "";
        };
    }, [isMenuOpen]);

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (
                menuRef.current &&
                !menuRef.current.contains(event.target) &&
                isMenuOpen
            ) {
                setIsMenuOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [isMenuOpen, setIsMenuOpen, menuRef]);

    return {
        pathname,
        hasOrgMembership,
        isOwner,
        isOnAdminPath,
        navToShow,
    };
}
