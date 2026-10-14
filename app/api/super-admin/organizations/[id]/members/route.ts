import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { orgService } from "@/lib/services/super-admin";
import { requireSuperAdmin } from "@/lib/services/super-admin/auth";
import { AppError, logError } from "@/lib/utils/errors";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // The signed-in account itself, by its Clerk id — not checkUser(), which
    // during a support session returns the dealer the admin is signed in as
    // and would lock the admin out of their own pages.
    const { userId: clerkId } = await auth();
    await requireSuperAdmin(clerkId);

    const { id } = await params;

    const members = await orgService.listOrganizationMembers(id);

    return NextResponse.json({ members });
  } catch (error) {
    // Not signed in (401) or not an admin (403): expected, no log needed.
    if (error instanceof AppError && (error.statusCode === 401 || error.statusCode === 403)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: error.statusCode });
    }
    logError("Error fetching organization members:", error);
    return NextResponse.json(
      { error: "Failed to fetch members" },
      { status: 500 }
    );
  }
}
