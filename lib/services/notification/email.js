// Email sending functions
import { resend, FROM_EMAIL } from "@/lib/resend";
import { generateNewMessageEmailHtml, buildMessagesUrl } from "./email-templates";

/**
 * Send email notification for new message
 */
export async function sendNewMessageEmail({ to, recipientName, senderName, messagePreview, conversationId, carTitle }) {
    // Skip if no API key configured
    if (!process.env.RESEND_API_KEY) {
        console.log("Skipping email notification - RESEND_API_KEY not configured");
        return null;
    }

    const subject = carTitle
        ? `New message about ${carTitle} - AutoMe`
        : `New message from ${senderName} - AutoMe`;

    const messagesUrl = buildMessagesUrl(conversationId);

    try {
        const { data, error } = await resend.emails.send({
            from: FROM_EMAIL,
            to,
            subject,
            html: generateNewMessageEmailHtml({
                recipientName,
                senderName,
                messagePreview,
                carTitle,
                messagesUrl,
            }),
        });

        if (error) {
            console.error("Error sending email:", error);
            return null;
        }

        return data;
    } catch (error) {
        console.error("Failed to send new message email:", error);
        return null;
    }
}
