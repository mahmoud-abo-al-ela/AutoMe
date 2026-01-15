"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft, Mail, Shield, UserCog, User, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { format } from "date-fns";

const roleConfig = {
  SUPER_ADMIN: {
    label: "Super Admin",
    icon: Shield,
    variant: "destructive",
  },
  ADMIN: {
    label: "Admin",
    icon: UserCog,
    variant: "default",
  },
  USER: {
    label: "User",
    icon: User,
    variant: "secondary",
  },
};

export default function UserDetailsHeader({ user }) {
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
            <AvatarImage src={user.imageUrl} alt={user.name} />
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
