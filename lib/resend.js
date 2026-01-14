import { Resend } from "resend";

// Initialize Resend client
// You need to set RESEND_API_KEY in your .env file
// Get your API key from https://resend.com/api-keys
export const resend = new Resend(process.env.RESEND_API_KEY);

// Default from email - update this with your verified domain
export const FROM_EMAIL =
  process.env.FROM_EMAIL || "AutoMe <noreply@autome.com>";
