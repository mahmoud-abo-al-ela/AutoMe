"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AlertCircle, UserCog, Loader2 } from "lucide-react";
import { startImpersonationAction } from "@/actions/impersonation";
import { toast } from "sonner";

export default function ImpersonateModal({ organization, onClose }) {
  const router = useRouter();
  const [members, setMembers] = useState([]);
  const [selectedMember, setSelectedMember] = useState("");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingMembers, setLoadingMembers] = useState(true);

  // Fetch organization members
  useEffect(() => {
    async function fetchMembers() {
      try {
        const response = await fetch(
          `/api/super-admin/organizations/${organization.id}/members`
        );
        if (response.ok) {
          const data = await response.json();
          setMembers(data.members || []);
          // Auto-select owner/admin if available
          const owner = data.members?.find((m) => m.role === "OWNER");
          if (owner) {
            setSelectedMember(owner.userId);
          }
        }
      } catch (error) {
        console.error("Failed to fetch members:", error);
      } finally {
        setLoadingMembers(false);
      }
    }

    fetchMembers();
  }, [organization.id]);

  const handleImpersonate = async () => {
    if (!selectedMember || !reason.trim()) {
      toast.error("Please select a user and provide a reason");
      return;
    }

    setLoading(true);
    try {
      const result = await startImpersonationAction({
        targetUserId: selectedMember,
        targetOrganizationId: organization.id,
        reason: reason.trim(),
      });

      if (result.success) {
        toast.success("Impersonation started");
        // Redirect to the organization's dashboard page
        window.location.href = `/org/${organization.slug}/dashboard`;
      } else {
        toast.error(result.error?.message || "Failed to start impersonation");
      }
    } catch (error) {
      toast.error("An error occurred");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserCog className="h-5 w-5 text-purple-600" />
            Impersonate User
          </DialogTitle>
          <DialogDescription>
            Access <strong>{organization.name}</strong> as a specific user. All
            actions will be logged.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Warning */}
          <div className="flex items-start gap-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
            <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-yellow-700 dark:text-yellow-300">
              <p className="font-medium">Audit Trail Warning</p>
              <p className="mt-1">
                All actions performed during impersonation will be logged with
                your identity.
              </p>
            </div>
          </div>

          {/* User Selection */}
          <div className="space-y-2">
            <Label htmlFor="user">Impersonate As</Label>
            {loadingMembers ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading members...
              </div>
            ) : (
              <Select value={selectedMember} onValueChange={setSelectedMember}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a user" />
                </SelectTrigger>
                <SelectContent>
                  {members.map((member) => (
                    <SelectItem key={member.userId} value={member.userId}>
                      <div className="flex items-center gap-2">
                        <span>{member.user?.name || member.user?.email}</span>
                        <span className="text-xs text-muted-foreground">
                          ({member.role})
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Reason */}
          <div className="space-y-2">
            <Label htmlFor="reason">Reason for Impersonation *</Label>
            <Textarea
              id="reason"
              placeholder="e.g., Investigating reported issue #123, Customer support request..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
            />
            <p className="text-xs text-muted-foreground">
              This reason will be recorded in the audit log.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            onClick={handleImpersonate}
            disabled={!selectedMember || !reason.trim() || loading}
            className="bg-purple-600 hover:bg-purple-700"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Starting...
              </>
            ) : (
              <>
                <UserCog className="h-4 w-4 mr-2" />
                Start Impersonation
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
