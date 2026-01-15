"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, LogOut, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { endImpersonationAction } from "@/actions/impersonation";
import { toast } from "sonner";

export default function ImpersonationBanner({ session, organization }) {
  const router = useRouter();
  const [ending, setEnding] = useState(false);

  const handleEndImpersonation = async () => {
    setEnding(true);
    try {
      const result = await endImpersonationAction();

      if (result.success) {
        toast.success("Impersonation ended");
        // Redirect back to super admin
        window.location.href = "http://autome.localhost:3000/super-admin";
      } else {
        toast.error(result.error || "Failed to end impersonation");
        setEnding(false);
      }
    } catch (error) {
      toast.error("An error occurred");
      setEnding(false);
    }
  };

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-yellow-500 text-yellow-900">
      <div className="container mx-auto px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertCircle className="h-4 w-4" />
          <span className="text-sm font-medium">
            Viewing as <strong>{session?.targetUser?.name || "User"}</strong>
            {organization && (
              <>
                {" "}in <strong>{organization.name}</strong>
              </>
            )}
          </span>
          <span className="text-xs opacity-75">
            (Super Admin: {session?.superAdmin?.name})
          </span>
        </div>
        <Button
          size="sm"
          variant="secondary"
          onClick={handleEndImpersonation}
          disabled={ending}
          className="bg-yellow-100 hover:bg-yellow-200 text-yellow-900"
        >
          {ending ? (
            <>
              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
              Ending...
            </>
          ) : (
            <>
              <LogOut className="h-3 w-3 mr-1" />
              Exit Impersonation
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
