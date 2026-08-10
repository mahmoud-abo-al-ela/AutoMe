import { StreamChat, type ChannelData } from "stream-chat";

/** The Stream user payload assembled from a local User row. */
export interface StreamUserInput {
    id: string;
    name?: string | null;
    image?: string | null;
    email?: string | null;
    custom?: Record<string, unknown>;
}

/** A local User row, as far as ensureOrgMembersInStream reads it. */
export interface OrgMemberInput {
    id: string;
    name?: string | null;
    email?: string | null;
    imageUrl?: string | null;
    clerkId?: string | null;
    role?: string | null;
}

/** The car summary mirrored onto the channel. `price` may be a Decimal. */
export interface ChannelCarData {
    id: string;
    title?: string | null;
    make?: string;
    model?: string;
    year?: number;
    price?: { toString(): string } | null;
    images?: string[];
}

export interface ChannelOrganizationData {
    id: string;
    name: string;
    slug: string;
}

let serverClient: StreamChat | null = null;

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
export function generateStreamToken(userId: string): string {
    const client = getStreamServerClient();
    return client.createToken(userId);
}

/**
 * Create or update a Stream Chat user
 */
export async function upsertStreamUser(userData: StreamUserInput) {
    const client = getStreamServerClient();

    const streamUser = {
        id: userData.id,
        name: userData.name,
        image: userData.image,
        ...(userData.email && { email: userData.email }),
        ...(userData.custom && userData.custom),
    };

    // The SDK's UserResponse rejects nullable name/image and the spread-in
    // custom keys, both of which the API accepts. Cast at the boundary.
    await client.upsertUser(streamUser as Parameters<typeof client.upsertUser>[0]);
    return streamUser;
}

/**
 * Delete a Stream Chat user
 */
export async function deleteStreamUser(userId: string): Promise<void> {
    const client = getStreamServerClient();
    await client.deleteUser(userId, { mark_messages_deleted: true, hard_delete: true });
}

/**
 * Create a short hash from a string (for channel IDs)
 */
function createShortHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(36);
}

export async function ensureOrgMembersInStream(orgMembers: OrgMemberInput[]) {
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
}: {
    organizationId: string;
    userId: string;
    // Absent for a general organization inquiry, which falls back to an
    // org-scoped channel ID below.
    carId?: string;
    carData?: ChannelCarData;
    organizationData?: ChannelOrganizationData;
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

    // ChannelData in stream-chat@9 declares only the built-in fields; `name`
    // and the car_*/organization_* metadata below are custom keys the API
    // stores fine. Cast at the boundary rather than dropping them.
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
    } as ChannelData);

    await channel.create();
    return { channel, channelId };
}

/**
 * Add organization members to a channel
 */
export async function addMembersToChannel(channelId: string, memberIds: string[]) {
    const client = getStreamServerClient();
    const channel = client.channel("messaging", channelId);
    await channel.addMembers(memberIds);
}

/**
 * Get or create a channel
 */
export async function getOrCreateChannel({
    channelId,
    members,
    data = {},
}: {
    channelId: string;
    members: string[];
    data?: Record<string, unknown>;
}) {
    const client = getStreamServerClient();
    const channel = client.channel("messaging", channelId, {
        members,
        ...data,
    });
    await channel.watch();
    return channel;
}
