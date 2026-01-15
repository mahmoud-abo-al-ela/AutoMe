/**
 * Email service for Super Admin operations
 */

export async function sendOrganizationInvitationEmail({
  ownerEmail,
  organizationName,
  organizationSlug,
  plan,
  existingUser,
}) {
  const { resend, FROM_EMAIL } = await import("@/lib/resend");
  
  const baseUrl = process.env.NEXT_PUBLIC_URL || 'http://localhost:3000';
  
  await resend.emails.send({
    from: FROM_EMAIL,
    to: ownerEmail,
    subject: `You've been made owner of ${organizationName} on AutoMe`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #333;">Welcome to AutoMe!</h1>
        <p>You have been assigned as the owner of <strong>${organizationName}</strong>.</p>
        <p>Your organization has been set up with the <strong>${plan.name}</strong> plan, which includes:</p>
        <ul>
          <li>Up to ${plan.maxCars} cars</li>
          <li>Up to ${plan.maxMembers} team members</li>
          <li>${plan.maxImagesPerCar} images per car</li>
        </ul>
        ${existingUser 
          ? `<p>Since you already have an account, you can access your organization right away:</p>
             <a href="${baseUrl}/${organizationSlug}/admin" 
                style="display: inline-block; background-color: #0070f3; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 16px;">
               Go to Dashboard
             </a>`
          : `<p>To get started, create your account using this email address:</p>
             <a href="${baseUrl}/sign-up" 
                style="display: inline-block; background-color: #0070f3; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 16px;">
               Create Account
             </a>
             <p style="color: #666; font-size: 14px; margin-top: 16px;">
               Make sure to sign up with <strong>${ownerEmail}</strong> to automatically access your organization.
             </p>`
        }
        <hr style="margin-top: 32px; border: none; border-top: 1px solid #eee;">
        <p style="color: #999; font-size: 12px;">This email was sent by AutoMe.</p>
      </div>
    `,
  });
}
