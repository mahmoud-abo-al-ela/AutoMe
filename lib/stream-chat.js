import { StreamChat } from "stream-chat";

let serverClient = null;

/**
 * Get or create a singleton Stream Chat server client
 */
export function getStreamServerClient() {
    if (!serverClient) {
        const apiKey = process.env.NEXT_PUBLIC_STREAM_API_KEY;
        const apiSecret = process.env.STREAM_API_SECRET;

        if (!apiKey || !apiSecret) {
            throw new Error("Stream Chat credentials are not configured");
        }

        serverClient = StreamChat.getInstance(apiKey, apiSecret);
    }

    return serverClient;
}

/**
 * Generate a Stream Chat token for a user
 */
export function generateStreamToken(userId) {
    const client = getStreamServerClient();
    return client.createToken(userId);
}

/**
 * Create or update a Stream Chat user
 */
export async function upsertStreamUser(userData) {
    const client = getStreamServerClient();

    const streamUser = {
        id: userData.id,
        name: userData.name,
        image: userData.image,
        ...(userData.email && { email: userData.email }),
        ...(userData.custom && userData.custom),
    };

    await client.upsertUser(streamUser);
    return streamUser;
}

/**
 * Delete a Stream Chat user
 */
export async function deleteStreamUser(userId) {
    const client = getStreamServerClient();
    await client.deleteUser(userId, { mark_messages_deleted: true, hard_delete: true });
}

/**
 * Create a short hash from a string (for channel IDs)
 */
function createShortHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(36);
}

export async function ensureOrgMembersInStream(orgMembers) {
    for (const member of orgMembers) {
        await upsertStreamUser({
            id: member.id,
            name: member.name || member.email,
            image: member.imageUrl,
            email: member.email,
            custom: {
                clerk_id: member.clerkId,
                user_role: member.role,
            },
        });
    }
}

/**
 * Create a channel for car inquiries
 */
export async function createCarInquiryChannel({
    organizationId,
    userId,
    carId,
    carData,
    organizationData,
}) {
    const client = getStreamServerClient();

    // Create a unique but short channel ID (max 64 chars)
    // Use hashes to keep it short
    const orgHash = createShortHash(organizationId);
    const userHash = createShortHash(userId);
    const carHash = carId ? createShortHash(carId) : null;

    const channelId = carHash
        ? `car-${carHash}-${userHash}`
        : `org-${orgHash}-${userHash}`;

    const channel = client.channel("messaging", channelId, {
        name: carData?.title || organizationData?.name || "Inquiry",
        members: [userId],
        created_by_id: userId,
        // Custom metadata
        car_id: carId,
        organization_id: organizationId,
        car_data: carData ? {
            id: carData.id,
            title: carData.title,
            make: carData.make,
            model: carData.model,
            year: carData.year,
            price: carData.price?.toString(),
            images: carData.images,
        } : undefined,
        organization_data: organizationData ? {
            id: organizationData.id,
            name: organizationData.name,
            slug: organizationData.slug,
        } : undefined,
    });

    await channel.create();
    return channel;
}

/**
 * Add organization members to a channel
 */
export async function addMembersToChannel(channelId, memberIds) {
    const client = getStreamServerClient();
    const channel = client.channel("messaging", channelId);
    await channel.addMembers(memberIds);
}

/**
 * Get or create a channel
 */
export async function getOrCreateChannel({ channelId, members, data = {} }) {
    const client = getStreamServerClient();
    const channel = client.channel("messaging", channelId, {
        members,
        ...data,
    });
    await channel.watch();
    return channel;
}
