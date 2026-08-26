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

export const metadata = {
  title: "About Us",
  description:
    "Learn about AutoMe — the modern platform helping dealerships digitize operations and buyers find their perfect vehicle.",
};

const values = [
  {
    icon: Shield,
    title: "Trust & Transparency",
    description:
      "We believe car buying should be straightforward. Every listing is verified, every price is honest, and every interaction is built on trust.",
  },
  {
    icon: Zap,
    title: "Innovation First",
    description:
      "From AI-powered descriptions to real-time messaging, we leverage cutting-edge technology to make the automotive experience smarter.",
  },
  {
    icon: Users,
    title: "Community Driven",
    description:
      "We're building more than a platform — we're creating a community where dealerships and buyers connect meaningfully.",
  },
  {
    icon: Heart,
    title: "Customer Obsessed",
    description:
      "Every feature we build starts with a simple question: does this make life better for our users? If not, we go back to the drawing board.",
  },
];

const stats = [
  { value: "500+", label: "Active Dealerships" },
  { value: "25K+", label: "Cars Listed" },
  { value: "100K+", label: "Happy Buyers" },
  { value: "99.9%", label: "Uptime" },
];

const features = [
  {
    icon: Car,
    title: "Smart Inventory Management",
    description:
      "AI-generated descriptions, bulk photo uploads, and intelligent categorization make listing cars effortless.",
  },
  {
    icon: MessageSquare,
    title: "Built-in Messaging",
    description:
      "Real-time chat between dealers and buyers eliminates phone tag and keeps conversations organized.",
  },
  {
    icon: BarChart3,
    title: "Analytics Dashboard",
    description:
      "Track views, leads, and conversions with detailed analytics that help dealerships make data-driven decisions.",
  },
  {
    icon: Building2,
    title: "Multi-location Support",
    description:
      "Manage multiple dealership locations from a single dashboard with role-based team access.",
  },
];

export default function AboutPage() {
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
            About AutoMe
          </span>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 max-w-4xl mx-auto leading-tight">
            Reimagining the Way Cars Are{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">
              Bought & Sold
            </span>
          </h1>
          <p className="text-lg md:text-xl text-gray-300 max-w-2xl mx-auto mb-8">
            AutoMe is the modern automotive platform that empowers dealerships
            with powerful digital tools and helps buyers discover their perfect
            vehicle — all in one seamless experience.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              asChild
              size="lg"
              className="bg-primary hover:bg-primary/90"
            >
              <Link href="/cars" className="flex items-center gap-2">
                Browse Cars
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="border-white/20 bg-white/5 hover:bg-white/10"
            >
              <Link href="/contact">Get in Touch</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="border-b bg-muted/30">
        <div className="container mx-auto px-4 py-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 text-center">
            {stats.map((stat) => (
              <div key={stat.label}>
                <div className="text-3xl md:text-4xl font-bold text-primary mb-1">
                  {stat.value}
                </div>
                <div className="text-sm text-muted-foreground">
                  {stat.label}
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
                Our Mission
              </span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Making automotive commerce{" "}
              <span className="text-primary">simple, smart, and human</span>
            </h2>
            <p className="text-muted-foreground text-lg leading-relaxed mb-4">
              The traditional car buying experience is broken — fragmented
              listings, outdated tools, and frustrating back-and-forth. We
              started AutoMe to change that.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              Our platform gives dealerships the digital storefront they
              deserve, complete with AI-powered features, real-time
              communications, and actionable analytics. For buyers, we offer a
              curated, transparent experience that makes finding the right car
              genuinely enjoyable.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <div
                  key={feature.title}
                  className="bg-card border rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="bg-primary/10 w-10 h-10 rounded-lg flex items-center justify-center mb-3">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="font-semibold text-sm mb-1">
                    {feature.title}
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {feature.description}
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
              What We Stand For
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Our values guide every decision we make, from the features we
              build to the partnerships we form.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((value) => {
              const Icon = value.icon;
              return (
                <div
                  key={value.title}
                  className="bg-card border rounded-xl p-6 text-center shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="bg-primary/10 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-2">{value.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {value.description}
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
          Ready to Get Started?
        </h2>
        <p className="text-muted-foreground text-lg mb-8 max-w-xl mx-auto">
          Whether you&apos;re a dealership looking to go digital or a buyer
          searching for the perfect ride, AutoMe has you covered.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button asChild size="lg">
            <Link href="/onboarding" className="flex items-center gap-2">
              Start Free Trial
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/contact">Contact Us</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
