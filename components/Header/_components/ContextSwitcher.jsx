import Link from "next/link";
import { Button } from "@/components/ui/button";

export function ContextSwitcher({ hasOrgMembership, orgSlug }) {
    if (!hasOrgMembership || !orgSlug) return null;

    return (
        <div className="mr-4">
            <Button variant="default" size="sm" asChild>
                <Link href={`/org/${orgSlug}/admin`}>Go to Admin</Link>
            </Button>
        </div>
    );
}
