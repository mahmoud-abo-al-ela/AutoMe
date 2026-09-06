// Structure for the contact page. The prose lives in messages/{en,ar}/contact.json.
//
// This file used to hold the copy itself, which no JSX string sweep would ever
// find — the same trap as lib/WhyConfig.ts and lib/HeaderConfig.ts. What stays
// here is what is not language: icons, hrefs, form values, and the two details
// that are literally the same in both locales.
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
  // `detail` set here is script-neutral and stays as-is; where it is omitted
  // the copy comes from contact.methods.<key>.detail, because an address and a
  // business-hours line are both language.
  { key: "email", icon: Mail, detail: "support@autome.com" },
  { key: "phone", icon: Phone, detail: "+20 2 2480 1500" },
  { key: "visit", icon: MapPin },
  { key: "hours", icon: Clock },
] as const;

/** `value` is what the form submits; the label comes from contact.topics. */
export const topics = [
  { value: "general" },
  { value: "support" },
  { value: "sales" },
  { value: "partnership" },
  { value: "feedback" },
  { value: "bug" },
] as const;

export const faqQuickLinks = [
  { key: "faq", icon: HelpCircle, href: "/faq" },
  { key: "onboarding", icon: Building2, href: "/onboarding" },
  { key: "chat", icon: MessageSquare, href: "/messages" },
] as const;
