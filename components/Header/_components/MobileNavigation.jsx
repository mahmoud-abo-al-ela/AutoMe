import Link from "next/link";
import { Button } from "@/components/ui/button";
import { SignedIn, SignedOut } from "@clerk/nextjs";
import { motion } from "framer-motion";
import {
    Heart,
    CarFront,
    LayoutDashboard,
    MessageSquare,
    Home,
    Search,
    Scale,
    HelpCircle,
    Calendar,
} from "lucide-react";
import { navItems, adminNavItems, signedInLinks } from "@/lib/HeaderConfig";
import { MobileNavLink } from "./MobileNavLink";

// Icon map for nav items
const iconMap = {
    "Browse Cars": Search,
    Compare: Scale,
    FAQ: HelpCircle,
    Dashboard: LayoutDashboard,
    Cars: CarFront,
    "Test Drives": Calendar,
    Messages: MessageSquare,
};

function getNavIcon(label) {
    return iconMap[label] || Home;
}

export function MobileNavigation({
    hasOrgMembership,
    isOwner,
    pathname,
    navToShow,
    setIsMenuOpen,
    userOrgSlug,
}) {
    return (
        <div className="p-3 overflow-y-auto" style={{ maxHeight: "calc(100vh - 14rem)" }}>
            {/* Admin button for org members */}
            {hasOrgMembership && userOrgSlug && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                    className="mb-3"
                >
                    <Link href={`/org/${userOrgSlug}/admin`} onClick={() => setIsMenuOpen(false)}>
                        <Button className="w-full py-6 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold shadow-lg shadow-blue-500/25">
                            Go to Admin
                        </Button>
                    </Link>
                </motion.div>
            )}

            {/* Main nav */}
            <div className="space-y-1">
                {navToShow.map((item, index) => {
                    const NavIcon = getNavIcon(item.label);
                    return (
                        <MobileNavLink
                            key={item.href}
                            href={item.href}
                            label={item.label}
                            IconComponent={NavIcon}
                            onClick={() => setIsMenuOpen(false)}
                            isActive={pathname === item.href}
                            animationDelay={index * 40}
                        />
                    );
                })}
            </div>

            {/* Signed in links - only show if NOT an org member */}
            {!hasOrgMembership && (
                <SignedIn>
                    <div className="my-3 mx-2 h-px bg-border" />
                    <div className="space-y-1">
                        {signedInLinks.map((link, index) => (
                            <MobileNavLink
                                key={link.href}
                                href={link.href}
                                label={link.label}
                                icon={link.icon}
                                iconClass={link.iconClass}
                                size={18}
                                onClick={() => setIsMenuOpen(false)}
                                isActive={pathname === link.href}
                                animationDelay={(navItems.length + index) * 40}
                                showUnreadBadge={link.showUnreadBadge}
                            />
                        ))}
                    </div>
                </SignedIn>
            )}

            {/* Sign in button */}
            <SignedOut>
                {pathname !== "/sign-in" && pathname !== "/sign-up" && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2, delay: 0.15 }}
                        className="mt-4"
                    >
                        <Link href="/sign-in" onClick={() => setIsMenuOpen(false)}>
                            <Button className="w-full py-6 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold shadow-lg shadow-blue-500/25">
                                Sign In
                            </Button>
                        </Link>
                    </motion.div>
                )}
            </SignedOut>
        </div>
    );
}
