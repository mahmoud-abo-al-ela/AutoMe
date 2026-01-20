import { StreamChat } from "stream-chat";

let serverClient = null;

/**
 * Get or create a singleton Stream Chat server client
 * This should only be used on the server side
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
 * @param {string} userId - The user ID
 * @returns {string} - The generated token
 */
export function generateStreamToken(userId) {
    const client = getStreamServerClient();
    return client.createToken(userId);
}

/**
 * Create or update a Stream Chat user
 * @param {Object} userData - User data
 * @param {string} userData.id - User ID
 * @param {string} userData.name - User name
 * @param {string} [userData.image] - User image URL
 * @param {string} [userData.email] - User email
 * @param {Object} [userData.custom] - Custom user data
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
 * @param {string} userId - User ID to delete
 */
export async function deleteStreamUser(userId) {
    const client = getStreamServerClient();
    await client.deleteUser(userId, { mark_messages_deleted: true, hard_delete: true });
}

/**
 * Create a short hash from a string (for channel IDs)
 * @param {string} str - String to hash
 * @returns {string} - Short hash
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

/**
 * Create a channel for car inquiries
 * @param {Object} params
 * @param {string} params.organizationId - Organization ID
 * @param {string} params.userId - User ID
 * @param {string} [params.carId] - Car ID (optional)
 * @param {Object} [params.carData] - Car data for channel metadata
 * @param {Object} [params.organizationData] - Organization data
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
 * @param {string} channelId - Channel ID
 * @param {string[]} memberIds - Array of member user IDs
 */
export async function addMembersToChannel(channelId, memberIds) {
    const client = getStreamServerClient();
    const channel = client.channel("messaging", channelId);
    await channel.addMembers(memberIds);
}

/**
 * Get or create a channel
 * @param {Object} params
 * @param {string} params.channelId - Channel ID
 * @param {string[]} params.members - Array of member user IDs
 * @param {Object} [params.data] - Channel data
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
