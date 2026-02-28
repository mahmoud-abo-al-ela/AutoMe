// EmailJS for server-side email sending using REST API
// You need to set these in your .env file
// Get your credentials from https://dashboard.emailjs.com

export const FROM_EMAIL =
  process.env.FROM_EMAIL || "AutoMe <noreply@autome.com>";

export async function sendEmail({ to, subject, html }) {
  // Check if EmailJS is configured
  if (!process.env.EMAILJS_PUBLIC_KEY || !process.env.EMAILJS_PRIVATE_KEY || !process.env.EMAILJS_SERVICE_ID) {
    throw new Error(
      "EmailJS is not configured. Please add EMAILJS_PUBLIC_KEY, EMAILJS_PRIVATE_KEY, EMAILJS_SERVICE_ID, and EMAILJS_TEMPLATE_ID to your .env file"
    );
  }

  const template = process.env.EMAILJS_TEMPLATE_ID;

  if (!template) {
    throw new Error(
      "EMAILJS_TEMPLATE_ID is not configured in your .env file"
    );
  }

  try {
    const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        service_id: process.env.EMAILJS_SERVICE_ID,
        template_id: template,
        user_id: process.env.EMAILJS_PUBLIC_KEY,
        accessToken: process.env.EMAILJS_PRIVATE_KEY,
        template_params: {
          to_email: to,
          subject: subject,
          html_content: html,
          from_name: "AutoMe",
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`EmailJS API error: ${response.status} - ${errorText}`);
    }

    const result = await response.text();
    return { data: result, error: null };
  } catch (error) {
    return { data: null, error };
  }
}

// For backward compatibility with existing code that imports 'resend'
export const resend = {
  emails: {
    send: async ({ from, to, subject, html }) => {
      return sendEmail({ to, subject, html });
    },
  },
};
