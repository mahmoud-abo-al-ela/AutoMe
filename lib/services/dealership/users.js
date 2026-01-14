// Dealership user management service functions
import { clerkClient } from "@clerk/nextjs/server";
import * as dealershipRepository from "@/lib/repositories/dealership";
import * as userRepository from "@/lib/repositories/user";
import { AuthenticationError, NotFoundError, AuthorizationError } from "@/lib/utils/errors";

/**
 * Get users with search and pagination
 */
export async function getUsers(search, pagination, userId) {
    const user = await userRepository.findUserByClerkId(userId);
    if (!user) {
        throw new AuthenticationError("User not found");
    }

    return await dealershipRepository.findManyUsers(search, pagination);
}

/**
 * Update user role
 */
export async function updateUserRole(targetUserId, role, userId) {
    const user = await userRepository.findUserByClerkId(userId);
    if (!user) {
        throw new AuthenticationError("User not found");
    }

    await dealershipRepository.updateUserRole(targetUserId, role);
}

/**
 * Delete user
 */
export async function deleteUser(targetUserId, userId) {
    const adminUser = await userRepository.findUserByClerkId(userId);
    if (!adminUser) {
        throw new AuthenticationError("User not found");
    }

    if (adminUser.role !== "ADMIN") {
        throw new AuthorizationError("Only admins can delete users");
    }

    const userToDelete = await userRepository.findUserById(targetUserId);
    if (!userToDelete) {
        throw new NotFoundError("User");
    }

    if (userToDelete.clerkId === userId) {
        throw new AuthorizationError("You cannot delete your own account");
    }

    try {
        const clerk = await clerkClient();
        await clerk.users.deleteUser(userToDelete.clerkId);
    } catch (clerkError) {
        console.error("Error deleting user from Clerk:", clerkError);
    }

    await dealershipRepository.deleteUserById(targetUserId);
}
