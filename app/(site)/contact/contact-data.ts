// Static content for the contact page.
import {
  Mail,
  MapPin,
  Clock,
  MessageSquare,
  HelpCircle,
  Building2,
} from "lucide-react";

export const contactMethods = [
  {
    icon: Mail,
    title: "Email Us",
    description: "Our team typically responds within 24 hours.",
    detail: "support@autome.com",
  },
  {
    icon: MapPin,
    title: "Visit Us",
    description: "Come say hello at our headquarters.",
    detail: "123 Innovation Drive, San Francisco, CA 94102",
  },
  {
    icon: Clock,
    title: "Business Hours",
    description: "We're available during these times.",
    detail: "Mon – Fri: 9AM – 6PM (PST)",
  },
];

export const topics = [
  { value: "general", label: "General Inquiry" },
  { value: "support", label: "Technical Support" },
  { value: "sales", label: "Sales & Pricing" },
  { value: "partnership", label: "Partnership Opportunity" },
  { value: "feedback", label: "Feedback & Suggestions" },
  { value: "bug", label: "Report a Bug" },
];

export const faqQuickLinks = [
  {
    icon: HelpCircle,
    title: "Check our FAQ",
    description: "Find quick answers to common questions.",
    href: "/faq",
  },
  {
    icon: Building2,
    title: "Dealership Onboarding",
    description: "Learn how to set up your digital dealership.",
    href: "/onboarding",
  },
  {
    icon: MessageSquare,
    title: "Live Chat",
    description: "Chat with us directly from your dashboard.",
    href: "/messages",
  },
];
