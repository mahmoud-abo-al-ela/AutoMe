"use client";

import { useState } from "react";
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
import { Send, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { useActionError } from "@/hooks/use-action-error";
import { submitContactForm } from "@/actions/contact";
import { topics } from "../contact-data";

interface ContactFormState {
  name: string;
  email: string;
  topic: string;
  message: string;
}

const EMPTY_FORM: ContactFormState = {
  name: "",
  email: "",
  topic: "",
  message: "",
};

// The contact message form, including its submit + success states.
export default function ContactForm() {
  const [formState, setFormState] = useState(EMPTY_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const t = useTranslations("contact.form");
  const tTopics = useTranslations("contact.topics");
  const actionError = useActionError();
  const RESPONSE_HOURS = 24;

  const handleChange = (field: keyof ContactFormState, value: string) => {
    setFormState((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!formState.name || !formState.email || !formState.message) {
      toast.error(t("requiredFields"));
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await submitContactForm(formState);

      if (result?.success) {
        setIsSubmitted(true);
        toast.success(t("sent"));
      } else {
        toast.error(actionError(result?.error, t("failed")));
      }
    } catch (error) {
      toast.error(t("failed"));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="bg-card border rounded-xl p-10 text-center shadow-sm">
        <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="h-8 w-8 text-green-600" />
        </div>
        <h3 className="text-xl font-semibold mb-2">{t("successTitle")}</h3>
        <p className="text-muted-foreground mb-6">
          {t("successBody", { hours: RESPONSE_HOURS })}
        </p>
        <Button
          variant="outline"
          onClick={() => {
            setIsSubmitted(false);
            setFormState(EMPTY_FORM);
          }}
        >
          {t("sendAnother")}
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="contact-name">
            {t("name")} <span className="text-destructive">*</span>
          </Label>
          <Input
            id="contact-name"
            placeholder={t("namePlaceholder")}
            value={formState.name}
            onChange={(e) => handleChange("name", e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="contact-email">
            {t("email")} <span className="text-destructive">*</span>
          </Label>
          <Input
            id="contact-email"
            type="email"
            placeholder={t("emailPlaceholder")}
            value={formState.email}
            onChange={(e) => handleChange("email", e.target.value)}
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="contact-topic">{t("topic")}</Label>
        <Select
          value={formState.topic}
          onValueChange={(value) => handleChange("topic", value)}
        >
          <SelectTrigger id="contact-topic">
            <SelectValue placeholder={t("topicPlaceholder")} />
          </SelectTrigger>
          <SelectContent>
            {topics.map((topic) => (
              <SelectItem key={topic.value} value={topic.value}>
                {tTopics(topic.value)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="contact-message">
          {t("message")} <span className="text-destructive">*</span>
        </Label>
        <Textarea
          id="contact-message"
          placeholder={t("messagePlaceholder")}
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
            <span className="animate-spin me-2">⏳</span>
            {t("sending")}
          </>
        ) : (
          <>
            <Send className="h-4 w-4 me-2" />
            {t("submit")}
          </>
        )}
      </Button>
    </form>
  );
}
