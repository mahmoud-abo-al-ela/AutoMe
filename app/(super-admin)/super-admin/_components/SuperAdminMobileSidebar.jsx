"use client";

import { useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Menu, X, Shield, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { superAdminSidebarItems } from "@/lib/SuperAdminSidebarConfig";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function SuperAdminMobileSidebar({ pathname, user }) {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-10 w-10 p-0 hover:bg-sidebar-accent"
        >
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-72 p-0 bg-sidebar">
        {/* Header */}
        <div className="p-4 flex items-center justify-between border-b border-sidebar-border">
          <div className="flex items-center space-x-2">
            <div className="h-8 w-8 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <span className="font-bold text-lg bg-gradient-to-r from-purple-600 to-purple-700 bg-clip-text text-transparent">
              Super Admin
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => setOpen(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 px-3 space-y-1">
          {superAdminSidebarItems.map((item) => {
            const ItemIcon = item.icon;
            const isActive = pathname === item.path ||
              (item.path !== "/super-admin" && pathname.startsWith(item.path));

            return (
              <Link
                key={item.name}
                href={item.path}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center px-4 py-3 text-sm rounded-lg transition-all duration-200",
                  isActive
                    ? "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 font-medium"
                    : "text-sidebar-foreground hover:bg-sidebar-accent/60"
                )}
              >
                {ItemIcon && (
                  <ItemIcon
                    className={cn(
                      "h-5 w-5 mr-3",
                      isActive
                        ? "text-purple-600 dark:text-purple-400"
                        : "text-sidebar-foreground/70"
                    )}
                  />
                )}
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* User info & Footer */}
        <div className="p-3 border-t border-sidebar-border space-y-2 mt-auto">
          {user && (
            <div className="px-2 py-2 flex items-center space-x-3">
              <Avatar className="h-8 w-8">
                <AvatarImage src={user.imageUrl} alt={user.name} />
                <AvatarFallback className="bg-purple-100 text-purple-700 text-xs">
                  {user.name?.charAt(0) || "SA"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user.name}</p>
                <p className="text-xs text-muted-foreground truncate">{user.email}</p>
              </div>
            </div>
          )}

          <Link
            href="/"
            onClick={() => setOpen(false)}
            className="flex items-center px-4 py-3 text-sm text-sidebar-foreground hover:bg-sidebar-accent/60 rounded-lg transition-all duration-200"
          >
            <LogOut className="h-5 w-5 mr-3 rotate-180" />
            <span>Back to Site</span>
          </Link>
        </div>
      </SheetContent>
    </Sheet>
  );
}
