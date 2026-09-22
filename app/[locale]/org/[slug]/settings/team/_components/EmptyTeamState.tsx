import { Users } from "lucide-react";
import { EmptyState } from "@/components/common/EmptyState";

export default function EmptyTeamState() {
    return (
        <EmptyState 
            variant="inline" 
            icon={Users} 
            title="No team members yet" 
            description="Invite members to collaborate with your organization" 
        />
    );
}
