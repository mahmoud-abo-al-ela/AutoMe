"use server";

import * as conversations from "@/lib/services/chat/conversations";
import { getOrganization } from "@/lib/getOrganization";
import { withAuth } from "@/lib/middleware/with-auth";
import { createSuccessResponse } from "@/lib/utils/response";
import { NotFoundError } from "@/lib/utils/errors";

/**
 * Get Stream Chat token for the current user
 */
export const getStreamToken = withAuth(async (ctx) => {
    return createSuccessResponse(await conversations.getChatSession(ctx.userId));
});

/**
 * Start a conversation about a car
 */
export const startCarConversation = withAuth(async (ctx, carId: string) => {
    return createSuccessResponse(await conversations.startCarConversation(ctx.userId, ctx.user, carId));
});

/**
 * Start a general conversation with an organization
 */
export const startOrganizationConversation = withAuth(async (ctx, organizationId: string) => {
    return createSuccessResponse(
        await conversations.startOrganizationConversation(ctx.userId, ctx.user, organizationId)
    );
});

/**
 * Get organization member IDs for filtering channels
 */
export const getOrganizationMemberIds = withAuth(async (_ctx, slug: string) => {
    const { organization, membership } = await getOrganization(slug);
    if (!organization || !membership) {
        throw new NotFoundError("Organization not found or access denied");
    }

    return createSuccessResponse({
        memberIds: await conversations.getOrganizationMemberIds(organization.id),
        organizationId: organization.id,
    });
});
