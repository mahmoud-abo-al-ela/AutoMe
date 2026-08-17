"use server";

import { z } from "zod";
import aj from "@/lib/arcjet";
import {
  assertArcjetAllowed,
  assertArcjetConfigured,
} from "@/lib/middleware/with-rate-limit";
import { request } from "@arcjet/next";
import { sendEmail } from "@/lib/resend";
import { createSuccessResponse } from "@/lib/utils/response";
import { withErrorHandling } from "@/lib/middleware/with-auth";
import { ValidationError, RateLimitError, AppError } from "@/lib/utils/errors";
import { getCurrentOrganization } from "@/lib/getOrganization";

const contactSchema = z.object({
  name: z.string().trim().min(2, "Please enter your name").max(100),
  email: z.string().trim().email("Please enter a valid email address"),
  topic: z.string().trim().max(50).optional(),
  message: z
    .string()
    .trim()
    .min(10, "Message must be at least 10 characters")
    .max(5000, "Message is too long"),
});

function escapeHtml(value: string = "") {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export const submitContactForm = withErrorHandling(async (formData: unknown) => {
  // Rate limiting (per IP) to prevent contact-form abuse
  const req = await request();
  assertArcjetConfigured();
  const decision = await aj.protect(req, { requested: 1 });
  assertArcjetAllowed(decision, "Too many messages sent. Please try again later.");

  const parsed = contactSchema.safeParse(formData);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    // Zod path segments can be array indices; ValidationError names a field.
    const field = issue?.path?.[0];
    throw new ValidationError(
      issue?.message || "Please check the form and try again.",
      typeof field === "string" ? field : null
    );
  }

  const { name, email, topic, message } = parsed.data;

  // On a tenant subdomain, route to the dealership's inbox; otherwise the platform inbox.
  const organization = await getCurrentOrganization();
  const brandName = organization?.name || "AutoMe";
  const to =
    organization?.email || process.env.CONTACT_EMAIL || "support@autome.com";
  const subjectTopic = topic || "General Inquiry";

  const html = `
    <h2>New contact message — ${escapeHtml(brandName)}</h2>
    <p><strong>Name:</strong> ${escapeHtml(name)}</p>
    <p><strong>Email:</strong> ${escapeHtml(email)}</p>
    <p><strong>Topic:</strong> ${escapeHtml(subjectTopic)}</p>
    <p><strong>Message:</strong></p>
    <p style="white-space:pre-wrap">${escapeHtml(message)}</p>
  `;

  const { error } = await sendEmail({
    to,
    subject: `[${brandName}] New contact: ${subjectTopic}`,
    html,
  });

  if (error) {
    throw new AppError(
      (error instanceof Error && error.message) ||
        "Failed to send your message.",
      502,
      "EMAIL_SEND_FAILED"
    );
  }

  return createSuccessResponse(null, "Message sent");
});
