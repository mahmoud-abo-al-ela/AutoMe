"use client";

import { formatDistanceToNow } from "date-fns";
import { Mail, Building2 } from "lucide-react";
import { TableCell, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import UserActions from "./UserActions";

const roleConfig = {
  SUPER_ADMIN: {
    label: "Super Admin",
    variant: "destructive",
  },
  ADMIN: {
    label: "Admin",
    variant: "default",
  },
  USER: {
    label: "User",
    variant: "secondary",
  },
};

export default function UserRow({ user, onChangeRole }) {
  const role = roleConfig[user.role];

  return (
    <TableRow>
      <TableCell>
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={user.imageUrl} alt={user.name} />
            <AvatarFallback>
              {user.name?.charAt(0)?.toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="font-medium">{user.name}</div>
            <div className="text-sm text-muted-foreground flex items-center gap-1">
              <Mail className="h-3 w-3" />
              {user.email}
            </div>
          </div>
        </div>
      </TableCell>
      <TableCell>
        <Badge variant={role.variant} className="flex items-center gap-1 w-fit">
          {role.label}
        </Badge>
      </TableCell>
      <TableCell>
        {user.memberships.length > 0 ? (
          <div className="flex flex-col gap-1">
            {user.memberships.slice(0, 2).map((m) => (
              <div
                key={m.id}
                className="text-sm flex items-center gap-1"
              >
                <Building2 className="h-3 w-3 text-muted-foreground" />
                <span>{m.organization.name}</span>
                <Badge variant="outline" className="text-xs ml-1">
                  {m.role}
                </Badge>
              </div>
            ))}
            {user.memberships.length > 2 && (
              <span className="text-xs text-muted-foreground">
                +{user.memberships.length - 2} more
              </span>
            )}
          </div>
        ) : (
          <span className="text-muted-foreground text-sm">
            No organizations
          </span>
        )}
      </TableCell>
      <TableCell>
        <div className="text-sm">
          <div>{user._count.testDrives} test drives</div>
          <div className="text-muted-foreground">
            {user._count.savedCars} saved
          </div>
        </div>
      </TableCell>
      <TableCell>
        <span className="text-sm text-muted-foreground">
          {formatDistanceToNow(new Date(user.createdAt), {
            addSuffix: true,
          })}
        </span>
      </TableCell>
      <TableCell>
        <UserActions user={user} onChangeRole={onChangeRole} />
      </TableCell>
    </TableRow>
  );
}
