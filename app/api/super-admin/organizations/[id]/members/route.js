import { NextResponse } from "next/server";
import { checkUser } from "@/lib/checkUser";
import { db } from "@/lib/prisma";
import { logError } from "@/lib/utils/errors";

export async function GET(request, { params }) {
  try {
    const user = await checkUser();

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const members = await db.membership.findMany({
      where: { organizationId: id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            imageUrl: true,
          },
        },
      },
      orderBy: [
        { role: "asc" }, // OWNER first, then ADMIN, then MEMBER
        { createdAt: "asc" },
      ],
    });

    return NextResponse.json({ members });
  } catch (error) {
    logError("Error fetching organization members:", error);
    return NextResponse.json(
      { error: "Failed to fetch members" },
      { status: 500 }
    );
  }
}
