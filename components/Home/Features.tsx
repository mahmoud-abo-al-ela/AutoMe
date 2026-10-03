import { getTranslations } from "next-intl/server";
import { CalendarCheck, Gauge, Languages, MessageCircleQuestion } from "lucide-react";

/**
 * What a buyer actually gets (Figma: Home — features). Four things the
 * product does today, replacing a grid that promised buyer protection, 24/7
 * support, virtual tours and instant financing — none of which exist.
 */
export async function Features() {
  const t = await getTranslations("home.features");
  const items = [
    { icon: Gauge, title: t("priceTitle"), body: t("priceBody") },
    { icon: MessageCircleQuestion, title: t("askTitle"), body: t("askBody") },
    { icon: Languages, title: t("chatTitle"), body: t("chatBody") },
    { icon: CalendarCheck, title: t("driveTitle"), body: t("driveBody") },
  ];

  return (
    <ul className="grid gap-x-8 gap-y-8 sm:grid-cols-2 lg:grid-cols-4">
      {items.map(({ icon: Icon, title, body }) => (
        <li key={title} className="flex flex-col gap-3">
          <span aria-hidden className="flex size-12 items-center justify-center rounded-full border-2 border-border-strong bg-marker">
            <Icon className="size-[22px]" />
          </span>
          <h3 className="text-h3 font-semibold">{title}</h3>
          <p className="text-body text-muted-foreground">{body}</p>
        </li>
      ))}
    </ul>
  );
}
