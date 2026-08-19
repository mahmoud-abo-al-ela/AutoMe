"use client";

import { useRouter } from "@/i18n/navigation";
import { ArrowLeft, Mail, Shield, UserCog, User, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { format } from "date-fns";
import { Prisma, type UserRole } from "@/lib/generated/prisma";
import type { LucideIcon } from "lucide-react";

/**
 * The full user record page.tsx loads for this detail view: memberships down
 * to the plan, plus the recent test drives and saved cars.
 */
export type SuperAdminUserDetail = Prisma.UserGetPayload<{
  include: {
    memberships: {
      include: {
        organization: {
          include: { subscription: { include: { plan: true } } };
        };
      };
    };
    testDrives: {
      include: {
        car: { select: { id: true; make: true; model: true; year: true } };
      };
    };
    savedCars: {
      include: {
        car: {
          select: {
            id: true;
            make: true;
            model: true;
            year: true;
            images: true;
          };
        };
      };
    };
  };
}>;

const roleConfig: Record<
  UserRole,
  {
    label: string;
    icon: LucideIcon;
    variant: React.ComponentProps<typeof Badge>["variant"];
  }
> = {
  ADMIN: {
    label: "Admin",
    icon: Shield,
    variant: "destructive",
  },
  USER: {
    label: "User",
    icon: User,
    variant: "secondary",
  },
};

export default function UserDetailsHeader({
  user,
}: {
  user: SuperAdminUserDetail;
}) {
  const router = useRouter();
  const role = roleConfig[user.role];
  const RoleIcon = role.icon;

  return (
    <div className="space-y-4">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => router.back()}
        className="gap-2"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Users
      </Button>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16">
            <AvatarImage src={user.imageUrl ?? undefined} alt={user.name ?? ""} />
            <AvatarFallback className="text-xl">
              {user.name?.charAt(0)?.toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{user.name}</h1>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Mail className="h-4 w-4" />
              {user.email}
            </div>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant={role.variant} className="flex items-center gap-1">
                <RoleIcon className="h-3 w-3" />
                {role.label}
              </Badge>
              <span className="text-sm text-muted-foreground flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Joined {format(new Date(user.createdAt), "MMM d, yyyy")}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
