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
import { Send, CheckCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { useActionError } from "@/hooks/use-action-error";
import { useFormatters } from "@/hooks/use-formatters";
import { submitContactForm } from "@/actions/contact";
import { RESPONSE_HOURS, topics } from "../contact-data";

interface ContactFormState {
  name: string;
  email: string;
  topic: string;
  message: string;
}

// The site's control size and field surface, matching the search inputs.
const FIELD = "h-12 rounded-control bg-field px-4 text-body";

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
  const fmt = useFormatters();

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
      <div role="status" className="flex flex-col items-start gap-3 rounded-control border border-border bg-card p-6 sm:p-8">
        <span aria-hidden className="flex size-12 items-center justify-center rounded-full bg-positive-soft">
          <CheckCircle className="size-6 text-positive" />
        </span>
        <h3 className="text-h3 font-semibold">{t("successTitle")}</h3>
        <p className="mb-2 text-body text-muted-foreground">
          {t("successBody", { hours: fmt.number(RESPONSE_HOURS) })}
        </p>
        <Button
          variant="outline-strong"
          size="control"
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
            className={FIELD}
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
            className={FIELD}
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
          <SelectTrigger id="contact-topic" className={`${FIELD} w-full`}>
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
          className="rounded-control bg-field px-4 py-3 text-body"
          value={formState.message}
          onChange={(e) => handleChange("message", e.target.value)}
          required
        />
      </div>

      <Button
        type="submit"
        variant="marker"
        size="xl"
        className="w-full sm:w-auto"
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <>
            <Loader2 aria-hidden className="size-4 animate-spin" />
            {t("sending")}
          </>
        ) : (
          <>
            <Send aria-hidden className="size-4 rtl:-scale-x-100" />
            {t("submit")}
          </>
        )}
      </Button>
    </form>
  );
}
