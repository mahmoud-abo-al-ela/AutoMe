// Dealership service functions
import * as dealershipRepository from "@/lib/repositories/dealership";
import * as userRepository from "@/lib/repositories/user";
import { AuthenticationError, NotFoundError } from "@/lib/utils/errors";

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
