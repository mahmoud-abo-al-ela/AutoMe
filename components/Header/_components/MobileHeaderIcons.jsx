import Link from "next/link";
import { MessageSquare, Menu, X } from "lucide-react";
import { SignedIn } from "@clerk/nextjs";
import { UnreadBadge } from "@/components/Chat";

export function MobileHeaderIcons({ hasOrgMembership, isMenuOpen, setIsMenuOpen }) {
    return (
        <div className="md:hidden ml-auto flex items-center gap-1">
            {/* Messages icon - only show when signed in and not org member */}
            <SignedIn>
                {!hasOrgMembership && (
                    <Link
                        href="/messages"
                        className="relative flex items-center justify-center rounded-full w-10 h-10 transition-colors hover:bg-muted active:bg-muted/80"
                        title="Messages"
                    >
                        <MessageSquare className="h-5 w-5" />
                        <UnreadBadge className="absolute -top-0.5 -right-0.5" />
                    </Link>
                )}
            </SignedIn>

            {/* Menu toggle */}
            <button
                className="flex items-center justify-center rounded-full w-10 h-10 transition-colors hover:bg-muted active:bg-muted/80"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                aria-label={isMenuOpen ? "Close menu" : "Open menu"}
                aria-expanded={isMenuOpen}
                aria-controls="mobile-menu"
            >
                <div className="relative w-6 h-6">
                    <X
                        className={`absolute inset-0 h-6 w-6 transition-all duration-300 ${isMenuOpen
                                ? "opacity-100 rotate-0 scale-100"
                                : "opacity-0 rotate-90 scale-75"
                            }`}
                    />
                    <Menu
                        className={`absolute inset-0 h-6 w-6 transition-all duration-300 ${isMenuOpen
                                ? "opacity-0 -rotate-90 scale-75"
                                : "opacity-100 rotate-0 scale-100"
                            }`}
                    />
                </div>
            </button>
        </div>
    );
}
