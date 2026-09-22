"use client";

import { Button } from "@/components/ui/button";
import { UserButton, SignedIn, SignedOut, SignInButton } from "@clerk/nextjs";
import { useTranslations } from "next-intl";
import { signedInLinks } from "@/lib/HeaderConfig";
import { useAuthRedirects } from "@/hooks/use-auth-redirects";
import HeaderNavLink from "./HeaderNavLink";

export default function AuthSection({
  pathname,
  hasOrgMembership,
  isAdmin,
}: {
  pathname: string;
  hasOrgMembership?: boolean;
  isAdmin?: boolean;
}) {
  const t = useTranslations("nav");
  const { afterSignIn, afterSignOut } = useAuthRedirects();

  return (
    <div className="flex items-center gap-6">
      <SignedOut>
        <SignInButton mode="modal" forceRedirectUrl={afterSignIn}>
          <Button
            variant="default"
            className="cursor-pointer transition-all duration-300 hover:shadow-md"
          >
            {t("signIn")}
          </Button>
        </SignInButton>
      </SignedOut>
      <SignedIn>
        <div className="flex items-center gap-6">
          {signedInLinks
            .filter((link) => !hasOrgMembership && !isAdmin)
            .map((link) => (
              <HeaderNavLink
                key={link.href}
                href={link.href}
                label={t(link.labelKey)}
                icon={link.icon}
                iconClass={link.iconClass}
                size={link.size}
                isActive={pathname === link.href}
                showUnreadBadge={link.showUnreadBadge}
              />
            ))}
          <UserButton
            afterSignOutUrl={afterSignOut}
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
