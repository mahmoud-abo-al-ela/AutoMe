"use client";
import { useFormatters } from "@/hooks/use-formatters";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Trash2, Crown, User } from "lucide-react";
import type { TeamMember, TeamMemberRole } from "../_lib/team-types";

interface TeamMemberRowProps {
    member: TeamMember;
    currentUserId: string;
    /** Whether the *viewer* owns the organization, not this row's member. */
    isOwner: boolean;
    onRemove: (member: TeamMember) => void;
    onRoleChange: (memberId: string, newRole: TeamMemberRole) => void;
    loadingRoleUpdate: boolean;
}

export default function TeamMemberRow({
    member,
    currentUserId,
    isOwner,
    onRemove,
    onRoleChange,
    loadingRoleUpdate,
}: TeamMemberRowProps) {
  const { relativeToNow } = useFormatters();
    const isCurrentUser = member.userId === currentUserId;
    const isOwnerRole = member.role === "OWNER";

    return (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg gap-4">
            <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                    <AvatarImage
                        src={member.user.imageUrl ?? undefined}
                        alt={member.user.name ?? undefined}
                    />
                    <AvatarFallback>
                        {member.user.name?.charAt(0) || member.user.email?.charAt(0)}
                    </AvatarFallback>
                </Avatar>
                <div>
                    <div className="flex items-center gap-2">
                        <p className="font-medium text-sm sm:text-base">
                            {member.user.name || "No name"}
                        </p>
                        {isCurrentUser && (
                            <Badge variant="secondary" className="text-xs">
                                You
                            </Badge>
                        )}
                    </div>
                    <p className="text-xs sm:text-sm text-gray-500">
                        {member.user.email}
                    </p>
                    <p className="text-xs text-gray-400">
                        Joined {relativeToNow(new Date(member.user.createdAt))}
                    </p>
                </div>
            </div>

            <div className="flex items-center gap-2">
                {isOwnerRole ? (
                    <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
                        <Crown className="h-3 w-3 me-1" />
                        Owner
                    </Badge>
                ) : isOwner ? (
                    <Select
                        value={member.role}
                        // Radix hands back a plain string; only the two roles
                        // below are rendered as items.
                        onValueChange={(value) =>
                            onRoleChange(member.id, value as TeamMemberRole)
                        }
                        disabled={loadingRoleUpdate}
                    >
                        <SelectTrigger className="w-32">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="MEMBER">
                                <div className="flex items-center gap-2">
                                    <User className="h-4 w-4" />
                                    Member
                                </div>
                            </SelectItem>
                            <SelectItem value="OWNER">
                                <div className="flex items-center gap-2">
                                    <Crown className="h-4 w-4" />
                                    Owner
                                </div>
                            </SelectItem>
                        </SelectContent>
                    </Select>
                ) : (
                    <Badge variant="secondary">
                        <User className="h-3 w-3 me-1" />
                        Member
                    </Badge>
                )}

                {isOwner && !isOwnerRole && !isCurrentUser && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onRemove(member)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                        <Trash2 className="h-4 w-4" />
                    </Button>
                )}
            </div>
        </div>
    );
}
