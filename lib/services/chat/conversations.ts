import * as userRepository from "@/lib/repositories/user";
import * as chatRepository from "@/lib/repositories/chat";
import { findMemberUserIds } from "@/lib/repositories/team";
import {
  generateStreamToken,
  upsertStreamUser,
  createCarInquiryChannel,
  addMembersToChannel,
  ensureOrgMembersInStream,
} from "@/lib/stream-chat";
import { assertBuyerAllowed } from "@/lib/auth/assert-buyer";
import type { BuyerViewerSource } from "@/lib/auth/buyer-policy";
import { AuthenticationError, NotFoundError } from "@/lib/utils/errors";

type ChannelOrganization = { id: string; name: string; slug: string; logo: string | null };
type OrgMember = Parameters<typeof ensureOrgMembersInStream>[0][number];

async function signedInUser(clerkId: string) {
  const user = await userRepository.findUserByClerkId(clerkId);
  if (!user) {
    throw new AuthenticationError("User not found");
  }
  return user;
}

/** Create the channel and put every dealership member in it. */
async function openChannel({
  userId,
  organization,
  members,
  car,
}: {
  userId: string;
  organization: ChannelOrganization;
  members: OrgMember[];
  car?: Parameters<typeof createCarInquiryChannel>[0]["carData"];
}) {
  await ensureOrgMembersInStream(members, organization.name);

  const { channelId } = await createCarInquiryChannel({
    organizationId: organization.id,
    userId,
    ...(car && { carId: car.id, carData: car }),
    organizationData: {
      id: organization.id,
      name: organization.name,
      slug: organization.slug,
      logo: organization.logo,
    },
  });

  const memberIds = members.map((m) => m.id);
  if (memberIds.length > 0) {
    await addMembersToChannel(channelId, memberIds);
  }

  return { channelId, channelType: "messaging" as const };
}

/** The signed-in person's Stream identity and token, kept in step with their profile. */
export async function getChatSession(clerkId: string) {
  const user = await signedInUser(clerkId);

  // How they appear to whoever they chat with: name and picture only. A
  // buyer without a name shows as "Buyer" in the dealer's inbox, not as an
  // email address.
  await upsertStreamUser({
    id: user.id,
    name: user.name || null,
    image: user.imageUrl,
  });

  return {
    token: generateStreamToken(user.id),
    userId: user.id,
    apiKey: process.env.NEXT_PUBLIC_STREAM_API_KEY,
  };
}

/** A buyer's conversation about one car, with its dealership's team. */
export async function startCarConversation(clerkId: string, viewer: BuyerViewerSource, carId: string) {
  const user = await signedInUser(clerkId);

  const car = await chatRepository.findCarWithOrganizationMembers(carId);
  if (!car) {
    throw new NotFoundError("Car");
  }

  // Before any Stream call: a blocked caller must not leave a channel behind.
  assertBuyerAllowed(viewer, car.organizationId, "message");

  return openChannel({
    userId: user.id,
    organization: car.organization,
    members: car.organization.memberships.map((m) => m.user),
    car: {
      id: car.id,
      title: car.title,
      make: car.make,
      model: car.model,
      year: car.year,
      price: car.price,
      images: car.images,
    },
  });
}

/** A buyer's general conversation with a dealership. */
export async function startOrganizationConversation(clerkId: string, viewer: BuyerViewerSource, organizationId: string) {
  const user = await signedInUser(clerkId);

  const organization = await chatRepository.findOrganizationWithMembers(organizationId);
  if (!organization) {
    throw new NotFoundError("Organization");
  }

  assertBuyerAllowed(viewer, organization.id, "message");

  return openChannel({
    userId: user.id,
    organization,
    members: organization.memberships.map((m) => m.user),
  });
}

/** The user ids of a dealership's team, for filtering its inbox's channels. */
export async function getOrganizationMemberIds(organizationId: string) {
  return findMemberUserIds(organizationId);
}
