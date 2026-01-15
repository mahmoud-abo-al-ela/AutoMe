import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";

export function useHeaderLogic(user, organization) {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const pathname = usePathname();

    // Check if user has any organization membership
    const hasOrgMembership = user?.memberships?.length > 0;

    // Check if user can manage the organization (OWNER role in any org)
    const isOwner = hasOrgMembership && user.memberships.some(
        m => m.role === 'OWNER'
    );

    const isOnAdminPath = pathname?.startsWith('/org/') && pathname?.includes('/admin');

    // Don't show admin nav - we'll just show a button instead
    const showAdminNav = false;

    // Close menu on route change
    useEffect(() => {
        setIsMenuOpen(false);
    }, [pathname]);

    return {
        isMenuOpen,
        setIsMenuOpen,
        pathname,
        hasOrgMembership,
        isOwner,
        isOnAdminPath,
        showAdminNav,
    };
}
