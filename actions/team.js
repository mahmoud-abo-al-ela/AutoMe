"use server";

import { checkUser } from "@/lib/checkUser";
import { getCurrentOrganization, getOrganizationById } from "@/lib/getOrganization";
import { revalidatePath } from "next/cache";
import {
  inviteMemberService,
  updateMemberRoleService,
  removeMemberService,
  getTeamMembersService,
  getSubscriptionDetailsService,
} from "@/lib/services/team";

export async function inviteTeamMember({ organizationId, email, role }) {
  try {
    const user = await checkUser();
    if (!user) {
      return { success: false, error: "Unauthorized" };
    }

    const organization = await getOrganizationById(organizationId);
    if (!organization) {
      return { success: false, error: "Organization not found" };
    }

    await inviteMemberService({
      organizationId,
      email,
      role,
      inviterId: user.id,
      inviterEmail: user.email,
    });

    revalidatePath("/admin/team");

    return { success: true };
  } catch (error) {
    console.error("Error inviting team member:", error);
    return { success: false, error: error.message || "Failed to invite team member" };
  }
}

export async function updateMemberRole({ organizationId, memberId, newRole }) {
  try {
    const user = await checkUser();
    if (!user) {
      return { success: false, error: "Unauthorized" };
    }

    const organization = await getOrganizationById(organizationId);
    if (!organization) {
      return { success: false, error: "Organization not found" };
    }

    await updateMemberRoleService({
      organizationId,
      memberId,
      newRole,
      updaterId: user.id,
      updaterEmail: user.email,
    });

    revalidatePath("/admin/team");

    return { success: true };
  } catch (error) {
    console.error("Error updating member role:", error);
    return { success: false, error: error.message || "Failed to update role" };
  }
}

export async function removeMember({ organizationId, memberId }) {
  try {
    const user = await checkUser();
    if (!user) {
      return { success: false, error: "Unauthorized" };
    }

    const organization = await getOrganizationById(organizationId);
    if (!organization) {
      return { success: false, error: "Organization not found" };
    }

    await removeMemberService({
      organizationId,
      memberId,
      removerId: user.id,
      removerEmail: user.email,
    });

    revalidatePath("/admin/team");

    return { success: true };
  } catch (error) {
    console.error("Error removing member:", error);
    return { success: false, error: error.message || "Failed to remove member" };
  }
}

export async function getTeamMembers(organizationId) {
  try {
    return await getTeamMembersService(organizationId);
  } catch (error) {
    console.error("Error fetching team members:", error);
    return [];
  }
}

export async function getSubscriptionDetails(organizationId) {
  try {
    return await getSubscriptionDetailsService(organizationId);
  } catch (error) {
    console.error("Error fetching subscription:", error);
    return null;
  }
}
