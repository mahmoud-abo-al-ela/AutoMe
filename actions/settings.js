"use server";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import * as dealershipService from "@/lib/services/dealership";
import { createSuccessResponse, createErrorResponse } from "@/lib/utils/response";
import { AuthenticationError } from "@/lib/utils/errors";
import { getCurrentOrganization } from "@/lib/getOrganization";
import { checkUser } from "@/lib/checkUser";

export async function getDealershipInfo() {
  try {
    const { userId } = await auth();
    if (!userId) {
      throw new AuthenticationError();
    }

    const user = await checkUser();
    if (!user) {
      throw new AuthenticationError("User not found");
    }

    let organization = await getCurrentOrganization();
    if (!organization && user.memberships?.length > 0) {
      organization = user.memberships[0].organization;
    }

    if (!organization) {
      throw new AuthenticationError("No organization found");
    }

    const workingHoursData = await dealershipService.getWorkingHours(userId, organization.id);

    return createSuccessResponse(workingHoursData);
  } catch (error) {
    console.error("Error fetching working hours:", error);
    return createErrorResponse(error);
  }
}

export async function updateWorkingHours(workingHours) {
  try {
    const { userId } = await auth();
    if (!userId) {
      throw new AuthenticationError();
    }

    const user = await checkUser();
    if (!user) {
      throw new AuthenticationError("User not found");
    }

    let organization = await getCurrentOrganization();
    if (!organization && user.memberships?.length > 0) {
      organization = user.memberships[0].organization;
    }

    if (!organization) {
      throw new AuthenticationError("No organization found");
    }

    await dealershipService.updateWorkingHours(workingHours, userId, organization.id);

    revalidatePath(`/org/${organization.slug}/settings/working-hours`);
    revalidatePath("/");

    return createSuccessResponse(null, "Working hours updated successfully");
  } catch (error) {
    console.error("Error updating working hours:", error);
    return createErrorResponse(error);
  }
}

export async function getUsers(search = "", page = 1, limit = 10) {
  try {
    const { userId } = await auth();
    if (!userId) {
      throw new AuthenticationError();
    }

    const user = await checkUser();
    if (!user) {
      throw new AuthenticationError("User not found");
    }

    let organization = await getCurrentOrganization();
    if (!organization && user.memberships?.length > 0) {
      organization = user.memberships[0].organization;
    }

    if (!organization) {
      throw new AuthenticationError("No organization found");
    }

    const result = await dealershipService.getUsers(search, { page, limit }, userId, organization.id);

    return createSuccessResponse(result);
  } catch (error) {
    console.error("Error fetching users:", error);
    return createErrorResponse(error);
  }
}

export async function updateUserRole(targetUserId, role) {
  try {
    const { userId } = await auth();
    if (!userId) {
      throw new AuthenticationError();
    }

    const user = await checkUser();
    if (!user) {
      throw new AuthenticationError("User not found");
    }

    let organization = await getCurrentOrganization();
    if (!organization && user.memberships?.length > 0) {
      organization = user.memberships[0].organization;
    }

    if (!organization) {
      throw new AuthenticationError("No organization found");
    }

    await dealershipService.updateUserRole(targetUserId, role, userId, organization.id);

    revalidatePath("/admin/settings/users");
    revalidatePath("/");

    return createSuccessResponse(null, "User role updated successfully");
  } catch (error) {
    console.error("Error updating user role:", error);
    return createErrorResponse(error);
  }
}

export async function deleteUser(targetUserId) {
  try {
    const { userId } = await auth();
    if (!userId) {
      throw new AuthenticationError();
    }

    const user = await checkUser();
    if (!user) {
      throw new AuthenticationError("User not found");
    }

    let organization = await getCurrentOrganization();
    if (!organization && user.memberships?.length > 0) {
      organization = user.memberships[0].organization;
    }

    if (!organization) {
      throw new AuthenticationError("No organization found");
    }

    await dealershipService.deleteUser(targetUserId, userId, organization.id);

    revalidatePath("/admin/settings/users");

    return createSuccessResponse(null, "User deleted successfully");
  } catch (error) {
    console.error("Error deleting user:", error);
    return createErrorResponse(error);
  }
}
