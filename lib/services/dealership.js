// Dealership service - Business logic layer (Functional approach)
import * as dealershipRepository from "@/lib/repositories/dealership";
import * as userRepository from "@/lib/repositories/user";
import { AuthenticationError, NotFoundError, AuthorizationError } from "@/lib/utils/errors";

/**
 * Get dealership info
 */
export async function getDealershipInfo(userId) {
    const user = await userRepository.findUserByClerkId(userId);
    if (!user) {
        throw new AuthenticationError("User not found");
    }

    let dealership = await dealershipRepository.findDealership();

    if (!dealership) {
        dealership = await dealershipRepository.createDealership();
    }

    return dealership;
}

/**
 * Update working hours
 */
export async function updateWorkingHours(workingHours, userId) {
    const user = await userRepository.findUserByClerkId(userId);
    if (!user) {
        throw new AuthenticationError("User not found");
    }

    const dealership = await dealershipRepository.findDealership();
    if (!dealership) {
        throw new NotFoundError("Dealership");
    }

    await dealershipRepository.updateWorkingHours(dealership.id, workingHours);
}

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

    // Don't allow admins to delete themselves
    if (userToDelete.clerkId === userId) {
        throw new AuthorizationError("You cannot delete your own account");
    }

    await dealershipRepository.deleteUserById(targetUserId);
}
