import { NextResponse } from "next/server";
import { checkUser } from "@/lib/checkUser";
import { orgService } from "@/lib/services/super-admin";
import { logError } from "@/lib/utils/errors";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await checkUser();

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const members = await orgService.listOrganizationMembers(id);

    return NextResponse.json({ members });
  } catch (error) {
    logError("Error fetching organization members:", error);
    return NextResponse.json(
      { error: "Failed to fetch members" },
      { status: 500 }
    );
  }
}
