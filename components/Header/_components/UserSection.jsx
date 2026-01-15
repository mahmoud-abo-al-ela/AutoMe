import Link from "next/link";
import { Button } from "@/components/ui/button";
import { UserButton, SignedIn, SignedOut } from "@clerk/nextjs";
import { signedInLinks } from "@/lib/HeaderConfig";
import { NavLink } from "./NavLink";

export function UserSection({ pathname, isOwner, hasOrgMembership }) {
    return (
        <div className="space-x-6">
            <SignedOut>
                {pathname !== "/sign-in" && pathname !== "/sign-up" && (
                    <Button
                        variant="default"
                        className="cursor-pointer bg-[#0532a3] text-white hover:bg-[#0532a3]/90 hover:text-white transition-all duration-300 hover:shadow-md"
                    >
                        <Link
                            href="/sign-in"
                            className="w-full flex items-center justify-center"
                        >
                            Sign In
                        </Link>
                    </Button>
                )}
            </SignedOut>
            <SignedIn>
                <div className="flex items-center space-x-6">
                    {/* Only show wishlist/test-drive/messages if user is NOT an org member */}
                    {!hasOrgMembership && signedInLinks.map((link) => (
                        <NavLink
                            key={link.href}
                            href={link.href}
                            label={link.label}
                            icon={link.icon}
                            iconClass={link.iconClass}
                            size={link.size}
                            isActive={pathname === link.href}
                            showUnreadBadge={link.showUnreadBadge}
                        />
                    ))}
                    <UserButton
                        appearance={{
                            elements: {
                                avatarBox:
                                    "hover:scale-110 transition-transform duration-300",
                            },
                        }}
                    />
                </div>
            </SignedIn>
        </div>
    );
}
