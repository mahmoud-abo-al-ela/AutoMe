"use client";

import { UserButton, SignedIn, useClerk } from "@clerk/nextjs";
import { LogOut } from "lucide-react";

export default function MobileUserSection({ user, setIsMenuOpen }) {
  const { signOut } = useClerk();

  return (
    <SignedIn>
      <div className="px-5 py-4 bg-gradient-to-r from-slate-50 to-blue-50 border-b">
        <div className="flex items-center gap-3">
          <UserButton
            afterSignOutUrl="/"
            appearance={{
              elements: {
                avatarBox: "w-11 h-11 rounded-full shadow-md",
              },
            }}
          />
          <div className="flex-1">
            <p className="font-semibold text-sm">
              {user?.name || "Welcome back"}
            </p>
            <p className="text-xs text-muted-foreground">
              {user?.email}
            </p>
          </div>
          <button
            onClick={() => {
              setIsMenuOpen(false);
              signOut({ redirectUrl: "/" });
            }}
            className="p-2 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-50 transition-colors"
            aria-label="Sign out"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </SignedIn>
  );
}
