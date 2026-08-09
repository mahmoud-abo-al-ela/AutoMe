import { logError } from "@/lib/utils/errors";
// Email sending functions
import { sendEmail } from "@/lib/resend";
import {
  generateNewMessageEmailHtml,
  buildMessagesUrl,
  generateTestDriveConfirmationHtml,
  generateTestDriveNotificationHtml,
  generateWelcomeEmailHtml,
  generateTestDriveStatusUpdateHtml,
} from "./email-templates";
import type {
  NewMessageEmailParams,
  TestDriveConfirmationParams,
  TestDriveNotificationParams,
  TestDriveStatusUpdateParams,
  WelcomeEmailParams,
} from "./email-templates";

/** Every sender returns the EmailJS response body, or null when unsent. */
type SendResult = Promise<string | null>;

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
}: Omit<NewMessageEmailParams, "messagesUrl"> & { to: string; conversationId: string }): SendResult {
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
      logError("Error sending email:", error);
      return null;
    }

    return data;
  } catch (error) {
    logError("Failed to send new message email:", error);
    return null;
  }
}

/**
 * Send test drive confirmation email to customer
 */
export async function sendTestDriveConfirmationEmail({
  to,
  customerName,
  carTitle,
  date,
  startTime,
  endTime,
  dealershipName,
  dealershipAddress,
}: TestDriveConfirmationParams & { to: string }): SendResult {
  if (!process.env.EMAILJS_PUBLIC_KEY || !process.env.EMAILJS_PRIVATE_KEY || !process.env.EMAILJS_SERVICE_ID) return null;

  try {
    const { data, error } = await sendEmail({
      to,
      subject: `Test Drive Requested: ${carTitle} - AutoMe`,
      html: generateTestDriveConfirmationHtml({
        customerName,
        carTitle,
        date,
        startTime,
        endTime,
        dealershipName,
        dealershipAddress,
      }),
    });
    if (error) logError("Error sending test drive confirmation:", error);
    return error ? null : data;
  } catch (error) {
    logError("Failed to send test drive confirmation email:", error);
    return null;
  }
}

/**
 * Send test drive notification email to dealership admin
 */
export async function sendTestDriveAdminNotificationEmail({
  to,
  dealerName,
  customerName,
  carTitle,
  date,
  startTime,
  endTime,
  orgSlug,
}: TestDriveNotificationParams & { to: string }): SendResult {
  if (!process.env.EMAILJS_PUBLIC_KEY || !process.env.EMAILJS_PRIVATE_KEY || !process.env.EMAILJS_SERVICE_ID) return null;

  try {
    const { data, error } = await sendEmail({
      to,
      subject: `New Test Drive Request: ${carTitle}`,
      html: generateTestDriveNotificationHtml({
        dealerName,
        customerName,
        carTitle,
        date,
        startTime,
        endTime,
        orgSlug,
      }),
    });
    if (error) logError("Error sending test drive admin notification:", error);
    return error ? null : data;
  } catch (error) {
    logError("Failed to send test drive admin notification email:", error);
    return null;
  }
}

/**
 * Send welcome email to new organization owner
 */
export async function sendWelcomeEmail({
  to,
  userName,
  dealershipName,
  dashboardUrl,
}: WelcomeEmailParams & { to: string }): SendResult {
  if (!process.env.EMAILJS_PUBLIC_KEY || !process.env.EMAILJS_PRIVATE_KEY || !process.env.EMAILJS_SERVICE_ID) return null;

  try {
    const { data, error } = await sendEmail({
      to,
      subject: `Welcome to AutoMe, ${userName}!`,
      html: generateWelcomeEmailHtml({
        userName,
        dealershipName,
        dashboardUrl,
      }),
    });
    if (error) logError("Error sending welcome email:", error);
    return error ? null : data;
  } catch (error) {
    logError("Failed to send welcome email:", error);
    return null;
  }
}

/**
 * Send test drive status update email to customer
 */
export async function sendTestDriveStatusUpdateEmail({
  to,
  customerName,
  carTitle,
  status,
  dealershipName,
}: TestDriveStatusUpdateParams & { to: string }): SendResult {
  if (!process.env.EMAILJS_PUBLIC_KEY || !process.env.EMAILJS_PRIVATE_KEY || !process.env.EMAILJS_SERVICE_ID) return null;

  try {
    const { data, error } = await sendEmail({
      to,
      subject: `Test Drive Update: ${status} - ${carTitle}`,
      html: generateTestDriveStatusUpdateHtml({
        customerName,
        carTitle,
        status,
        dealershipName,
      }),
    });
    if (error) logError("Error sending test drive status update:", error);
    return error ? null : data;
  } catch (error) {
    logError("Failed to send test drive status update email:", error);
    return null;
  }
}

