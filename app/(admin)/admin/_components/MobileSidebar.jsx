"use client";

import { useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  CarFront,
  Star,
  Settings,
  MessageSquare,
  FileText,
  LogOut,
  Menu,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { sidebarItems } from "@/lib/SidebarConfig";

const iconMap = {
  LayoutDashboard,
  Users,
  CarFront,
  Star,
  Settings,
  MessageSquare,
  FileText,
};

export default function MobileSidebar({ pathname }) {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="md:hidden h-10 w-10 p-0 hover:bg-sidebar-accent"
          aria-label="Open sidebar menu"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent
        side="left"
        className="w-72 p-0 bg-sidebar border-sidebar-border"
      >
        <div className="flex flex-col h-full">
          <div className="p-6 border-b border-sidebar-border">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-sidebar-foreground">
                AutoMe Admin
              </h2>
            </div>
          </div>

          <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
            {sidebarItems.map((item) => {
              const ItemIcon = iconMap[item.icon];
              const isActive = pathname === item.path;

              return (
                <Link
                  key={item.name}
                  href={item.path}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "flex items-center px-4 py-3 text-sm rounded-lg transition-all duration-200 group",
                    isActive
                      ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium shadow-sm"
                      : "text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground hover:translate-x-1"
                  )}
                >
                  {ItemIcon && (
                    <ItemIcon
                      className={cn(
                        "h-5 w-5 mr-3 transition-colors",
                        isActive
                          ? "text-sidebar-accent-foreground"
                          : "text-sidebar-foreground/70 group-hover:text-sidebar-accent-foreground"
                      )}
                    />
                  )}
                  <span className="font-medium">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="p-4 border-t border-sidebar-border">
            <Link
              href="/"
              onClick={() => setOpen(false)}
              className="flex items-center px-4 py-3 text-sm text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground rounded-lg transition-all duration-200 group"
              title="Back to Site"
            >
              <LogOut className="h-5 w-5 mr-3 rotate-180 transition-colors group-hover:text-sidebar-accent-foreground" />
              <span className="font-medium">Back to Site</span>
            </Link>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
