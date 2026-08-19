// Static content for the contact page.
import {
  Mail,
  MapPin,
  Phone,
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
    icon: Phone,
    title: "Call Us",
    description: "Sunday to Thursday, during business hours.",
    detail: "+20 2 2480 1500",
  },
  {
    icon: MapPin,
    title: "Visit Us",
    description: "Come say hello at our headquarters.",
    detail: "12 El-Nasr Road, New Cairo, Cairo Governorate 11835",
  },
  {
    icon: Clock,
    title: "Business Hours",
    description: "We're available during these times.",
    // Egypt runs a Sunday–Thursday working week; EET is UTC+2 (UTC+3 in summer).
    detail: "Sun – Thu: 9AM – 6PM (EET)",
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
