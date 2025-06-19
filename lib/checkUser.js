import { auth, currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/prisma";

export async function checkUser() {
  try {
    const { userId } = await auth();
    if (!userId) {
      throw new Error("User not authenticated");
    }
    try {
      const userData = await db.user.findUnique({
        where: {
          clerkId: userId,
        },
      });

      if (userData) {
        return userData;
      }

      // Get user data from Clerk since it's not in our database yet
      const clerkUser = await currentUser();

      if (!clerkUser) {
        throw new Error("Could not retrieve user data from Clerk");
      }

      const name = `${clerkUser.firstName || ""} ${
        clerkUser.lastName || ""
      }`.trim();

      const newUser = await db.user.create({
        data: {
          clerkId: userId,
          name,
          imageUrl: clerkUser.imageUrl,
          email: clerkUser.emailAddresses[0]?.emailAddress,
        },
      });

      return newUser;
    } catch (error) {
      console.error("Error fetching user data:", error);
      return null;
    }
  } catch (error) {
    console.error("Error getting current user:", error);
    return null;
  }
}
