"use server";

import { db as prisma } from "@/lib/prisma";
import {
    generateStreamToken,
    upsertStreamUser,
    createCarInquiryChannel,
    addMembersToChannel,
    ensureOrgMembersInStream,
} from "@/lib/stream-chat";
import { getOrganization } from "@/lib/getOrganization";
import { withAuth } from "@/lib/middleware/with-auth";
import { createSuccessResponse } from "@/lib/utils/response";
import {
    AuthenticationError,
    NotFoundError,
} from "@/lib/utils/errors";

/**
 * Get Stream Chat token for the current user
 */
export const getStreamToken = withAuth(async (ctx) => {
    const user = await prisma.user.findUnique({
        where: { clerkId: ctx.userId },
    });

    if (!user) {
        throw new AuthenticationError("User not found");
    }

    // Upsert user in Stream Chat
    await upsertStreamUser({
        id: user.id,
        name: user.name || user.email,
        image: user.imageUrl,
        email: user.email,
        custom: {
            clerk_id: user.clerkId,
            user_role: user.role,
        },
    });

    // Generate token
    const token = generateStreamToken(user.id);

    return createSuccessResponse({
        token,
        userId: user.id,
        apiKey: process.env.NEXT_PUBLIC_STREAM_API_KEY,
    });
});

/**
 * Start a conversation about a car
 */
export const startCarConversation = withAuth(async (ctx, carId) => {
    const user = await prisma.user.findUnique({
        where: { clerkId: ctx.userId },
    });

    if (!user) {
        throw new AuthenticationError("User not found");
    }

    // Get car details
    const car = await prisma.car.findUnique({
        where: { id: carId },
        include: {
            organization: {
                include: {
                    memberships: {
                        include: {
                            user: true,
                        },
                    },
                },
            },
        },
    });

    if (!car) {
        throw new NotFoundError("Car");
    }

    // Ensure all organization members exist in Stream Chat
    const orgMembers = car.organization.memberships.map(m => m.user);
    await ensureOrgMembersInStream(orgMembers);

    // Create channel in Stream Chat
    const channel = await createCarInquiryChannel({
        organizationId: car.organizationId,
        userId: user.id,
        carId: car.id,
        carData: {
            id: car.id,
            title: car.title,
            make: car.make,
            model: car.model,
            year: car.year,
            price: car.price,
            images: car.images,
        },
        organizationData: {
            id: car.organization.id,
            name: car.organization.name,
            slug: car.organization.slug,
        },
    });

    // Add organization members to the channel
    const orgMemberIds = orgMembers.map(m => m.id);
    if (orgMemberIds.length > 0) {
        await addMembersToChannel(channel.id, orgMemberIds);
    }

    return createSuccessResponse({
        channelId: channel.id,
        channelType: "messaging",
    });
});

/**
 * Start a general conversation with an organization
 */
export const startOrganizationConversation = withAuth(async (ctx, organizationId) => {
    const user = await prisma.user.findUnique({
        where: { clerkId: ctx.userId },
    });

    if (!user) {
        throw new AuthenticationError("User not found");
    }

    // Get organization details
    const organization = await prisma.organization.findUnique({
        where: { id: organizationId },
        include: {
            memberships: {
                include: {
                    user: true,
                },
            },
        },
    });

    if (!organization) {
        throw new NotFoundError("Organization");
    }

    // Ensure all organization members exist in Stream Chat
    const orgMembers = organization.memberships.map(m => m.user);
    await ensureOrgMembersInStream(orgMembers);

    // Create channel in Stream Chat
    const channel = await createCarInquiryChannel({
        organizationId: organization.id,
        userId: user.id,
        organizationData: {
            id: organization.id,
            name: organization.name,
            slug: organization.slug,
        },
    });

    // Add organization members to the channel
    const orgMemberIds = orgMembers.map(m => m.id);
    if (orgMemberIds.length > 0) {
        await addMembersToChannel(channel.id, orgMemberIds);
    }

    return createSuccessResponse({
        channelId: channel.id,
        channelType: "messaging",
    });
});

/**
 * Get organization member IDs for filtering channels
 */
export const getOrganizationMemberIds = withAuth(async (ctx, slug) => {
    const { organization, membership } = await getOrganization(slug);
    if (!organization || !membership) {
        throw new NotFoundError("Organization not found or access denied");
    }

    const memberships = await prisma.membership.findMany({
        where: { organizationId: organization.id },
        select: { userId: true },
    });

    const memberIds = memberships.map(m => m.userId);

    return createSuccessResponse({
        memberIds,
        organizationId: organization.id,
    });
});
