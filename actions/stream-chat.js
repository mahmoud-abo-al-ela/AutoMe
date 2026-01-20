"use server";

import { auth } from "@clerk/nextjs/server";
import { db as prisma } from "@/lib/prisma";
import {
    generateStreamToken,
    upsertStreamUser,
    createCarInquiryChannel,
    addMembersToChannel,
} from "@/lib/stream-chat";
import { getOrganization } from "@/lib/getOrganization";

/**
 * Get Stream Chat token for the current user
 */
export async function getStreamToken() {
    try {
        const { userId: clerkId } = await auth();
        if (!clerkId) {
            return { success: false, error: "Unauthorized" };
        }

        const user = await prisma.user.findUnique({
            where: { clerkId },
        });

        if (!user) {
            return { success: false, error: "User not found" };
        }

        // Upsert user in Stream Chat
        await upsertStreamUser({
            id: user.id,
            name: user.name || user.email,
            image: user.imageUrl,
            email: user.email,
            custom: {
                clerk_id: user.clerkId,
                user_role: user.role, // Renamed to avoid conflict with Stream's role system
            },
        });

        // Generate token
        const token = generateStreamToken(user.id);

        return {
            success: true,
            data: {
                token,
                userId: user.id,
                apiKey: process.env.NEXT_PUBLIC_STREAM_API_KEY,
            }
        };
    } catch (error) {
        console.error("Error getting Stream token:", error);
        return { success: false, error: error.message };
    }
}

/**
 * Start a conversation about a car
 */
export async function startCarConversation(carId) {
    try {
        const { userId: clerkId } = await auth();
        if (!clerkId) {
            return { success: false, error: "Unauthorized" };
        }

        const user = await prisma.user.findUnique({
            where: { clerkId },
        });

        if (!user) {
            return { success: false, error: "User not found" };
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
            return { success: false, error: "Car not found" };
        }

        // Ensure all organization members exist in Stream Chat
        const orgMembers = car.organization.memberships.map(m => m.user);
        for (const member of orgMembers) {
            await upsertStreamUser({
                id: member.id,
                name: member.name || member.email,
                image: member.imageUrl,
                email: member.email,
                custom: {
                    clerk_id: member.clerkId,
                    user_role: member.role, // Renamed to avoid conflict
                },
            });
        }

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

        return {
            success: true,
            data: {
                channelId: channel.id,
                channelType: "messaging",
            }
        };
    } catch (error) {
        console.error("Error starting car conversation:", error);
        return { success: false, error: error.message };
    }
}

/**
 * Start a general conversation with an organization
 */
export async function startOrganizationConversation(organizationId) {
    try {
        const { userId: clerkId } = await auth();
        if (!clerkId) {
            return { success: false, error: "Unauthorized" };
        }

        const user = await prisma.user.findUnique({
            where: { clerkId },
        });

        if (!user) {
            return { success: false, error: "User not found" };
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
            return { success: false, error: "Organization not found" };
        }

        // Ensure all organization members exist in Stream Chat
        const orgMembers = organization.memberships.map(m => m.user);
        for (const member of orgMembers) {
            await upsertStreamUser({
                id: member.id,
                name: member.name || member.email,
                image: member.imageUrl,
                email: member.email,
                custom: {
                    clerk_id: member.clerkId,
                    user_role: member.role, // Renamed to avoid conflict
                },
            });
        }

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

        return {
            success: true,
            data: {
                channelId: channel.id,
                channelType: "messaging",
            }
        };
    } catch (error) {
        console.error("Error starting organization conversation:", error);
        return { success: false, error: error.message };
    }
}

/**
 * Get organization member IDs for filtering channels
 */
export async function getOrganizationMemberIds(slug) {
    try {
        const { userId: clerkId } = await auth();
        if (!clerkId) {
            return { success: false, error: "Unauthorized" };
        }

        const { organization, membership } = await getOrganization(slug);
        if (!organization || !membership) {
            return { success: false, error: "Organization not found or access denied" };
        }

        const memberships = await prisma.membership.findMany({
            where: { organizationId: organization.id },
            select: { userId: true },
        });

        const memberIds = memberships.map(m => m.userId);

        return {
            success: true,
            data: {
                memberIds,
                organizationId: organization.id,
            }
        };
    } catch (error) {
        console.error("Error getting organization members:", error);
        return { success: false, error: error.message };
    }
}
