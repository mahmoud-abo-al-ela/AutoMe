// Email template functions

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

// Generic so a required string stays a string for callers that chain onto it,
// while a nullable field passes through unchanged, exactly as before.
const escapeHtml = <T extends string | null | undefined>(unsafe: T): T => {
  if (typeof unsafe !== 'string') return unsafe;
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;") as T;
};

const formatDate = (date: Date | string | number): string => {
  return new Date(date).toLocaleDateString('en-EG', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

const baseEmailHtml = (title: string, content: string): string => `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title} - AutoMe</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f5f5f5;">
        <tr>
            <td style="padding: 40px 20px;">
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                    <!-- Header -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%); padding: 30px 40px; text-align: center;">
                            <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">AutoMe</h1>
                        </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                        <td style="padding: 40px;">
                            ${content}
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #f9fafb; padding: 30px 40px; text-align: center; border-top: 1px solid #e5e7eb;">
                            <p style="margin: 0 0 10px; color: #6b7280; font-size: 14px;">
                                &copy; ${new Date().getFullYear()} AutoMe. All rights reserved.
                            </p>
                            <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                                You're receiving this email because you're a registered user on AutoMe.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
`;

export interface NewMessageEmailParams {
  recipientName: string;
  senderName: string;
  messagePreview: string;
  carTitle?: string | null;
  messagesUrl: string;
}

export interface TestDriveConfirmationParams {
  customerName: string;
  carTitle: string;
  date: Date | string;
  startTime: string;
  endTime: string;
  dealershipName: string;
  dealershipAddress?: string | null;
}

export interface TestDriveNotificationParams {
  dealerName: string;
  customerName: string;
  carTitle: string;
  date: Date | string;
  startTime: string;
  endTime: string;
  orgSlug: string;
}

export interface WelcomeEmailParams {
  userName: string;
  dealershipName: string;
  dashboardUrl: string;
}

export interface TestDriveStatusUpdateParams {
  customerName: string;
  carTitle: string;
  status: string;
  dealershipName: string;
}

/**
 * Generate HTML for new message email
 */
export function generateNewMessageEmailHtml({
  recipientName,
  senderName,
  messagePreview,
  carTitle,
  messagesUrl,
}: NewMessageEmailParams): string {
  const safeRecipient = escapeHtml(recipientName);
  const safeSender = escapeHtml(senderName);
  const safeMessage = escapeHtml(messagePreview);
  const safeCarTitle = escapeHtml(carTitle);

  const content = `
    <h2 style="margin: 0 0 20px; color: #1f2937; font-size: 24px; font-weight: 600;">
        New Message
    </h2>
    <p style="margin: 0 0 20px; color: #4b5563; font-size: 16px; line-height: 1.6;">
        Hi ${safeRecipient},
    </p>
    <p style="margin: 0 0 20px; color: #4b5563; font-size: 16px; line-height: 1.6;">
        You have received a new message from <strong>${safeSender}</strong>${
    safeCarTitle ? ` about <strong>${safeCarTitle}</strong>` : ""
  }.
    </p>
    
    <!-- Message Preview Box -->
    <div style="background-color: #f9fafb; border-left: 4px solid #3b82f6; padding: 20px; margin: 20px 0; border-radius: 0 8px 8px 0;">
        <p style="margin: 0; color: #374151; font-size: 15px; line-height: 1.6; font-style: italic;">
            "${safeMessage}"
        </p>
    </div>
    
    <!-- CTA Button -->
    <div style="text-align: center; margin: 30px 0;">
        <a href="${messagesUrl}" style="display: inline-block; background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-size: 16px; font-weight: 600;">
            View Conversation
        </a>
    </div>
    
    <p style="margin: 20px 0 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
        If you didn't expect this email, you can safely ignore it.
    </p>
  `;
  return baseEmailHtml('New Message', content);
}

/**
 * Build messages URL for email
 */
export function buildMessagesUrl(conversationId: string): string {
  return `${APP_URL}/messages?conversation=${conversationId}`;
}

export function generateTestDriveConfirmationHtml({ customerName, carTitle, date, startTime, endTime, dealershipName, dealershipAddress }: TestDriveConfirmationParams): string {
  const safeCustomer = escapeHtml(customerName);
  const safeCarTitle = escapeHtml(carTitle);
  const safeDealership = escapeHtml(dealershipName);
  const safeAddress = escapeHtml(dealershipAddress);
  
  const content = `
    <h2 style="margin: 0 0 20px; color: #1f2937; font-size: 24px; font-weight: 600;">Test Drive Requested</h2>
    <p style="margin: 0 0 20px; color: #4b5563; font-size: 16px; line-height: 1.6;">Hi ${safeCustomer},</p>
    <p style="margin: 0 0 20px; color: #4b5563; font-size: 16px; line-height: 1.6;">Your test drive for <strong>${safeCarTitle}</strong> has been requested successfully.</p>
    
    <div style="background-color: #f9fafb; border-left: 4px solid #3b82f6; padding: 20px; margin: 20px 0; border-radius: 0 8px 8px 0;">
        <p style="margin: 0 0 10px; color: #374151; font-size: 15px;"><strong>Date:</strong> ${formatDate(date)}</p>
        <p style="margin: 0 0 10px; color: #374151; font-size: 15px;"><strong>Time:</strong> ${escapeHtml(startTime)} - ${escapeHtml(endTime)}</p>
        <p style="margin: 0 0 10px; color: #374151; font-size: 15px;"><strong>Dealership:</strong> ${safeDealership}</p>
        ${safeAddress ? `<p style="margin: 0; color: #374151; font-size: 15px;"><strong>Address:</strong> ${safeAddress}</p>` : ''}
    </div>
    
    <p style="margin: 20px 0 0; color: #6b7280; font-size: 14px; line-height: 1.6;">We will notify you once the dealership confirms your request.</p>
  `;
  return baseEmailHtml('Test Drive Requested', content);
}

export function generateTestDriveNotificationHtml({ dealerName, customerName, carTitle, date, startTime, endTime, orgSlug }: TestDriveNotificationParams): string {
  const safeDealer = escapeHtml(dealerName);
  const safeCustomer = escapeHtml(customerName);
  const safeCarTitle = escapeHtml(carTitle);
  const safeOrgSlug = escapeHtml(orgSlug);

  const content = `
    <h2 style="margin: 0 0 20px; color: #1f2937; font-size: 24px; font-weight: 600;">New Test Drive Request</h2>
    <p style="margin: 0 0 20px; color: #4b5563; font-size: 16px; line-height: 1.6;">Hi ${safeDealer},</p>
    <p style="margin: 0 0 20px; color: #4b5563; font-size: 16px; line-height: 1.6;">You have a new test drive request for <strong>${safeCarTitle}</strong> from <strong>${safeCustomer}</strong>.</p>
    
    <div style="background-color: #f9fafb; border-left: 4px solid #8b5cf6; padding: 20px; margin: 20px 0; border-radius: 0 8px 8px 0;">
        <p style="margin: 0 0 10px; color: #374151; font-size: 15px;"><strong>Date:</strong> ${formatDate(date)}</p>
        <p style="margin: 0; color: #374151; font-size: 15px;"><strong>Time:</strong> ${escapeHtml(startTime)} - ${escapeHtml(endTime)}</p>
    </div>
    
    <div style="text-align: center; margin: 30px 0;">
        <a href="${APP_URL}/org/${safeOrgSlug}/test-drives" style="display: inline-block; background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-size: 16px; font-weight: 600;">
            View Requests
        </a>
    </div>
  `;
  return baseEmailHtml('New Test Drive Request', content);
}

export function generateWelcomeEmailHtml({ userName, dealershipName, dashboardUrl }: WelcomeEmailParams): string {
  const safeUser = escapeHtml(userName);
  const safeDealership = escapeHtml(dealershipName);

  const content = `
    <h2 style="margin: 0 0 20px; color: #1f2937; font-size: 24px; font-weight: 600;">Welcome to AutoMe!</h2>
    <p style="margin: 0 0 20px; color: #4b5563; font-size: 16px; line-height: 1.6;">Hi ${safeUser},</p>
    <p style="margin: 0 0 20px; color: #4b5563; font-size: 16px; line-height: 1.6;">Congratulations on setting up <strong>${safeDealership}</strong> on AutoMe! We're thrilled to have you on board.</p>
    
    <p style="margin: 0 0 20px; color: #4b5563; font-size: 16px; line-height: 1.6;">You can now start adding your cars, managing test drives, and tracking your performance from your dashboard.</p>
    
    <div style="text-align: center; margin: 30px 0;">
        <a href="${dashboardUrl}" style="display: inline-block; background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-size: 16px; font-weight: 600;">
            Go to Dashboard
        </a>
    </div>
  `;
  return baseEmailHtml('Welcome to AutoMe', content);
}

export function generateTestDriveStatusUpdateHtml({ customerName, carTitle, status, dealershipName }: TestDriveStatusUpdateParams): string {
  const safeCustomer = escapeHtml(customerName);
  const safeCarTitle = escapeHtml(carTitle);
  const safeStatus = escapeHtml(status).toUpperCase();
  const safeDealership = escapeHtml(dealershipName);

  const content = `
    <h2 style="margin: 0 0 20px; color: #1f2937; font-size: 24px; font-weight: 600;">Test Drive Update</h2>
    <p style="margin: 0 0 20px; color: #4b5563; font-size: 16px; line-height: 1.6;">Hi ${safeCustomer},</p>
    <p style="margin: 0 0 20px; color: #4b5563; font-size: 16px; line-height: 1.6;">Your test drive for <strong>${safeCarTitle}</strong> has been updated.</p>
    
    <div style="background-color: #f9fafb; border-left: 4px solid ${safeStatus === 'CONFIRMED' ? '#10b981' : '#ef4444'}; padding: 20px; margin: 20px 0; border-radius: 0 8px 8px 0;">
        <p style="margin: 0 0 10px; color: #374151; font-size: 15px;"><strong>Status:</strong> ${safeStatus}</p>
        <p style="margin: 0; color: #374151; font-size: 15px;"><strong>Dealership:</strong> ${safeDealership}</p>
    </div>
  `;
  return baseEmailHtml('Test Drive Update', content);
}

