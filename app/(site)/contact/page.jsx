"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Mail,
  MapPin,
  Clock,
  Send,
  CheckCircle,
  MessageSquare,
  HelpCircle,
  Building2,
} from "lucide-react";
import { toast } from "sonner";
import { submitContactForm } from "@/actions/contact";

const contactMethods = [
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

const topics = [
  { value: "general", label: "General Inquiry" },
  { value: "support", label: "Technical Support" },
  { value: "sales", label: "Sales & Pricing" },
  { value: "partnership", label: "Partnership Opportunity" },
  { value: "feedback", label: "Feedback & Suggestions" },
  { value: "bug", label: "Report a Bug" },
];

const faqQuickLinks = [
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

export default function ContactPage() {
  const [formState, setFormState] = useState({
    name: "",
    email: "",
    topic: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleChange = (field, value) => {
    setFormState((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formState.name || !formState.email || !formState.message) {
      toast.error("Please fill in all required fields.");
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await submitContactForm(formState);

      if (result?.success) {
        setIsSubmitted(true);
        toast.success("Message sent! We'll get back to you soon.");
      } else {
        toast.error(
          result?.error?.message ||
            "Something went wrong. Please try again later."
        );
      }
    } catch (error) {
      toast.error("Something went wrong. Please try again later.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-white">
        <div className="absolute inset-0">
          <div className="absolute top-1/3 right-1/4 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-1/3 left-1/4 w-80 h-80 bg-primary/10 rounded-full blur-3xl" />
        </div>
        <div className="container mx-auto px-4 py-16 md:py-24 relative z-10 text-center">
          <span className="inline-block text-xs font-semibold uppercase tracking-widest text-blue-300 mb-4">
            Contact Us
          </span>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 max-w-3xl mx-auto">
            We&apos;d Love to{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">
              Hear From You
            </span>
          </h1>
          <p className="text-lg text-gray-300 max-w-xl mx-auto">
            Have a question, suggestion, or just want to say hi? Reach out and
            our team will get back to you as soon as possible.
          </p>
        </div>
      </section>

      {/* Contact Methods */}
      <section className="border-b bg-muted/30">
        <div className="container mx-auto px-4 py-10">
          <div className="grid sm:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {contactMethods.map((method) => {
              const Icon = method.icon;
              return (
                <div
                  key={method.title}
                  className="bg-card border rounded-xl p-6 text-center shadow-sm"
                >
                  <div className="bg-primary/10 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-1">{method.title}</h3>
                  <p className="text-xs text-muted-foreground mb-2">
                    {method.description}
                  </p>
                  <p className="text-sm font-medium text-primary">
                    {method.detail}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Form + Quick Links */}
      <section className="container mx-auto px-4 py-16 md:py-24">
        <div className="grid lg:grid-cols-5 gap-12 max-w-6xl mx-auto">
          {/* Contact Form */}
          <div className="lg:col-span-3">
            <h2 className="text-2xl md:text-3xl font-bold mb-2">
              Send Us a Message
            </h2>
            <p className="text-muted-foreground mb-8">
              Fill out the form below and we&apos;ll get back to you within 24
              hours.
            </p>

            {isSubmitted ? (
              <div className="bg-card border rounded-xl p-10 text-center shadow-sm">
                <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Message Sent!</h3>
                <p className="text-muted-foreground mb-6">
                  Thank you for reaching out. Our team will review your message
                  and respond within 24 hours.
                </p>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsSubmitted(false);
                    setFormState({
                      name: "",
                      email: "",
                      topic: "",
                      message: "",
                    });
                  }}
                >
                  Send Another Message
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="contact-name">
                      Full Name <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="contact-name"
                      placeholder="John Doe"
                      value={formState.name}
                      onChange={(e) => handleChange("name", e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contact-email">
                      Email <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="contact-email"
                      type="email"
                      placeholder="john@example.com"
                      value={formState.email}
                      onChange={(e) => handleChange("email", e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contact-topic">Topic</Label>
                  <Select
                    value={formState.topic}
                    onValueChange={(value) => handleChange("topic", value)}
                  >
                    <SelectTrigger id="contact-topic">
                      <SelectValue placeholder="Select a topic" />
                    </SelectTrigger>
                    <SelectContent>
                      {topics.map((topic) => (
                        <SelectItem key={topic.value} value={topic.value}>
                          {topic.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contact-message">
                    Message <span className="text-destructive">*</span>
                  </Label>
                  <Textarea
                    id="contact-message"
                    placeholder="Tell us how we can help..."
                    rows={6}
                    value={formState.message}
                    onChange={(e) => handleChange("message", e.target.value)}
                    required
                  />
                </div>

                <Button
                  type="submit"
                  size="lg"
                  className="w-full sm:w-auto"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <span className="animate-spin mr-2">⏳</span>
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Send Message
                    </>
                  )}
                </Button>
              </form>
            )}
          </div>

          {/* Quick Links Sidebar */}
          <div className="lg:col-span-2">
            <h3 className="text-lg font-semibold mb-4">
              Other Ways to Get Help
            </h3>
            <div className="space-y-4">
              {faqQuickLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <Link
                    key={link.title}
                    href={link.href}
                    className="group flex items-start gap-4 bg-card border rounded-xl p-5 shadow-sm hover:shadow-md transition-all hover:border-primary/30"
                  >
                    <div className="bg-primary/10 w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 transition-colors">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-medium text-sm mb-0.5 group-hover:text-primary transition-colors">
                        {link.title}
                      </h4>
                      <p className="text-xs text-muted-foreground">
                        {link.description}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>

            {/* Map placeholder */}
            <div className="mt-8 bg-muted/50 border rounded-xl p-6 text-center">
              <MapPin className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm font-medium mb-1">San Francisco, CA</p>
              <p className="text-xs text-muted-foreground">
                123 Innovation Drive, Suite 400
                <br />
                San Francisco, CA 94102
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
