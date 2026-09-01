import { setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { MapPin } from "lucide-react";
import { contactMethods, faqQuickLinks } from "./contact-data";
import ContactForm from "./_components/ContactForm";

export default async function ContactPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  // Statically rendered pages do not inherit the locale from the root layout
  // the way dynamic ones do, so without this the whole tree — including the
  // shared header and footer — renders in the default locale.
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-white">
        <div className="absolute inset-0">
          <div className="absolute top-1/3 end-1/4 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-1/3 start-1/4 w-80 h-80 bg-primary/10 rounded-full blur-3xl" />
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

            <ContactForm />
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
              <p className="text-sm font-medium mb-1">New Cairo, Cairo</p>
              <p className="text-xs text-muted-foreground">
                12 El-Nasr Road, Fifth Settlement
                <br />
                New Cairo, Cairo Governorate 11835
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
