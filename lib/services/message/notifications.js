// Message notification functions
import * as messageRepository from "@/lib/repositories/message";
import { sendNewMessageEmail } from "@/lib/services/notification";

/**
 * Send email notifications to conversation participants
 */
export async function sendEmailNotifications(conversationId, sender, messageContent, car) {
    try {
        const recipients = await messageRepository.getConversationParticipants(conversationId, sender.id);

        for (const recipient of recipients) {
            await sendNewMessageEmail({
                to: recipient.email,
                recipientName: recipient.name || "User",
                senderName: sender.name || "User",
                messagePreview: messageContent.substring(0, 100) + (messageContent.length > 100 ? "..." : ""),
                conversationId,
                carTitle: car?.title || (car ? `${car.make} ${car.model} ${car.year}` : null),
            });
        }
    } catch (error) {
        console.error("Failed to send email notifications:", error);
    }
}
