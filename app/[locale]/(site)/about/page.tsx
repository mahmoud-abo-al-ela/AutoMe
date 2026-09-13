import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import {
  Car,
  Shield,
  Users,
  Zap,
  Target,
  Heart,
  ArrowRight,
  Building2,
  MessageSquare,
  BarChart3,
} from "lucide-react";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "about.meta" });

  return { title: t("title"), description: t("description") };
}

// Icons and order only. Every string these used to carry now lives in
// messages/{en,ar}/about.json, keyed by the same id — the pattern the contact
// and compare surfaces already use.
const values = [
  { key: "trust", icon: Shield },
  { key: "innovation", icon: Zap },
  { key: "community", icon: Users },
  { key: "customer", icon: Heart },
] as const;

// The figures are claims about the business, not copy, so they are translated
// rather than formatted: "25K+" has no meaningful Arabic rendering through
// Intl. See the note in the commit — none of these numbers are verified.
const stats = ["dealerships", "cars", "buyers", "uptime"] as const;

const features = [
  { key: "inventory", icon: Car },
  { key: "messaging", icon: MessageSquare },
  { key: "analytics", icon: BarChart3 },
  { key: "multiLocation", icon: Building2 },
] as const;

export default async function AboutPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("about");

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-white">
        <div className="absolute inset-0">
          <div className="absolute top-1/4 start-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 end-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        </div>
        <div className="container mx-auto px-4 py-20 md:py-28 relative z-10 text-center">
          <span className="inline-block text-xs font-semibold uppercase tracking-widest text-blue-300 mb-4">
            {t("hero.eyebrow")}
          </span>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 max-w-4xl mx-auto leading-tight">
            {t("hero.headline")}{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">
              {t("hero.headlineAccent")}
            </span>
          </h1>
          <p className="text-lg md:text-xl text-gray-300 max-w-2xl mx-auto mb-8">
            {t("hero.subtitle")}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              asChild
              size="lg"
              className="bg-primary hover:bg-primary/90"
            >
              <Link href="/cars" className="flex items-center gap-2">
                {t("hero.browseCars")}
                <ArrowRight className="h-4 w-4 rtl:rotate-180" />
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="border-white/20 bg-white/5 hover:bg-white/10"
            >
              <Link href="/contact">{t("hero.getInTouch")}</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="border-b bg-muted/30">
        <div className="container mx-auto px-4 py-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 text-center">
            {stats.map((stat) => (
              <div key={stat}>
                <div className="text-3xl md:text-4xl font-bold text-primary mb-1">
                  {t(`stats.${stat}.value`)}
                </div>
                <div className="text-sm text-muted-foreground">
                  {t(`stats.${stat}.label`)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="container mx-auto px-4 py-16 md:py-24 max-w-5xl">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Target className="h-5 w-5 text-primary" />
              <span className="text-sm font-semibold uppercase tracking-wide text-primary">
                {t("mission.eyebrow")}
              </span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              {t("mission.headline")}{" "}
              <span className="text-primary">{t("mission.headlineAccent")}</span>
            </h2>
            <p className="text-muted-foreground text-lg leading-relaxed mb-4">
              {t("mission.body1")}
            </p>
            <p className="text-muted-foreground leading-relaxed">
              {t("mission.body2")}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <div
                  key={feature.key}
                  className="bg-card border rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="bg-primary/10 w-10 h-10 rounded-lg flex items-center justify-center mb-3">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="font-semibold text-sm mb-1">
                    {t(`features.${feature.key}.title`)}
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {t(`features.${feature.key}.description`)}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="bg-muted/30 border-y">
        <div className="container mx-auto px-4 py-16 md:py-24 max-w-5xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              {t("values.heading")}
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              {t("values.subtitle")}
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((value) => {
              const Icon = value.icon;
              return (
                <div
                  key={value.key}
                  className="bg-card border rounded-xl p-6 text-center shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="bg-primary/10 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-2">
                    {t(`values.${value.key}.title`)}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {t(`values.${value.key}.description`)}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-16 md:py-24 max-w-3xl text-center">
        <h2 className="text-3xl md:text-4xl font-bold mb-4">
          {t("cta.heading")}
        </h2>
        <p className="text-muted-foreground text-lg mb-8 max-w-xl mx-auto">
          {t("cta.body")}
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button asChild size="lg">
            <Link href="/onboarding" className="flex items-center gap-2">
              {t("cta.startTrial")}
              <ArrowRight className="h-4 w-4 rtl:rotate-180" />
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/contact">{t("cta.contactUs")}</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
