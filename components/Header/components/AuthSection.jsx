"use client";

import { Button } from "@/components/ui/button";
import { UserButton, SignedIn, SignedOut, SignInButton } from "@clerk/nextjs";
import { signedInLinks } from "@/lib/HeaderConfig";
import HeaderNavLink from "./HeaderNavLink";

export default function AuthSection({
  pathname,
  hasOrgMembership,
  isAdmin,
}) {
  return (
    <div className="space-x-6">
      <SignedOut>
        <SignInButton mode="modal" forceRedirectUrl="/auth-redirect">
          <Button
            variant="default"
            className="cursor-pointer transition-all duration-300 hover:shadow-md"
          >
            Sign In
          </Button>
        </SignInButton>
      </SignedOut>
      <SignedIn>
        <div className="flex items-center space-x-6">
          {signedInLinks
            .filter((link) => !hasOrgMembership && !isAdmin)
            .map((link) => (
              <HeaderNavLink
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
            afterSignOutUrl="/"
            appearance={{
              elements: {
                avatarBox: "hover:scale-110 transition-transform duration-300",
              },
            }}
          />
        </div>
      </SignedIn>
    </div>
  );
}
