// Email sending functions
import { sendEmail, FROM_EMAIL } from "@/lib/resend";
import {
  generateNewMessageEmailHtml,
  buildMessagesUrl,
} from "./email-templates";

/**
 * Send email notification for new message
 */
export async function sendNewMessageEmail({
  to,
  recipientName,
  senderName,
  messagePreview,
  conversationId,
  carTitle,
}) {
  // Skip if EmailJS not configured
  if (!process.env.EMAILJS_PUBLIC_KEY || !process.env.EMAILJS_PRIVATE_KEY || !process.env.EMAILJS_SERVICE_ID) {
    return null;
  }

  const subject = carTitle
    ? `New message about ${carTitle} - AutoMe`
    : `New message from ${senderName} - AutoMe`;

  const messagesUrl = buildMessagesUrl(conversationId);

  try {
    const { data, error } = await sendEmail({
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
