import { Twitter, Instagram, Facebook } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { getTranslations } from "next-intl/server";
import React from "react";

const Footer = async ({
  user,
  organization,
}: {
  user?: unknown;
  organization?: {
    name?: string | null;
    description?: string | null;
    phone?: string | null;
    email?: string | null;
    address?: string | null;
  } | null;
}) => {
  const t = await getTranslations("footer");

  const isOnSubdomain = !!organization;
  const brandName = organization?.name || "AutoMe";
  // A dealership's own description is user content and is shown as written —
  // there is no translation of it to fall back to. Only the platform's own
  // tagline is a message key.
  const brandDescription = organization?.description || t("tagline");

  return (
    <footer className="container mx-auto px-4 py-6 md:py-12">
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
        <div className="col-span-2 sm:col-span-2 md:col-span-1 mb-4 md:mb-0">
          <h3 className="text-lg font-semibold mb-3">{brandName}</h3>
          <p className="text-sm text-muted-foreground">
            {brandDescription}
          </p>
        </div>

        <div className="flex flex-col">
          <h3 className="text-sm font-semibold mb-3">{t("quickLinks")}</h3>
          <ul className="space-y-1.5 text-sm">
            <li>
              <Link
                href="/cars"
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                {t("browseCars")}
              </Link>
            </li>
            <li>
              <Link
                href="/compare"
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                {t("compareModels")}
              </Link>
            </li>
            <li>
              <Link
                href="/wishlist"
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                {t("savedVehicles")}
              </Link>
            </li>
            <li>
              <Link
                href="/faq"
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                {t("faq")}
              </Link>
            </li>
          </ul>
        </div>

        <div className="flex flex-col">
          <h3 className="text-sm font-semibold mb-3">
            {isOnSubdomain ? t("contactInfo") : t("company")}
          </h3>
          {isOnSubdomain ? (
            <ul className="space-y-2 text-sm text-muted-foreground">
              {organization.phone && (
                <li>
                  <span className="font-medium text-foreground block">
                    {t("phone")}
                  </span>
                  {/* Phone numbers are always read left-to-right, even in an
                      RTL paragraph, so the direction is pinned rather than
                      inherited. */}
                  <span dir="ltr">{organization.phone}</span>
                </li>
              )}
              {organization.email && (
                <li>
                  <span className="font-medium text-foreground block">
                    {t("email")}
                  </span>
                  <a
                    href={`mailto:${organization.email}`}
                    className="hover:text-primary transition-colors break-all"
                    dir="ltr"
                  >
                    {organization.email}
                  </a>
                </li>
              )}
              {organization.address && (
                <li>
                  <span className="font-medium text-foreground block">
                    {t("address")}
                  </span>
                  {organization.address}
                </li>
              )}
            </ul>
          ) : (
            <ul className="space-y-1.5 text-sm">
              <li>
                <Link
                  href="/about"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  {t("aboutUs")}
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  {t("contactUs")}
                </Link>
              </li>
              <li>
                <Link
                  href="/dealerships"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  {t("dealerships")}
                </Link>
              </li>
            </ul>
          )}
        </div>

        <div className="flex flex-col">
          <h3 className="text-sm font-semibold mb-3">{t("legal")}</h3>
          <ul className="space-y-1.5 text-sm">
            <li>
              <Link
                href="/terms"
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                {t("terms")}
              </Link>
            </li>
            <li>
              <Link
                href="/privacy"
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                {t("privacy")}
              </Link>
            </li>
            <li>
              <Link
                href="/cookies"
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                {t("cookies")}
              </Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t mt-6 md:mt-8 pt-4 md:pt-6 flex flex-col sm:flex-row items-center justify-between">
        <p className="text-xs text-muted-foreground text-center sm:text-start">
          {/* `year` is passed through next-intl's raw number formatting
              deliberately disabled: a year must not carry a thousands
              separator ("2,026"). */}
          {t("copyright", {
            year: String(new Date().getFullYear()),
            brand: brandName,
          })}
        </p>
        <div className="flex items-center gap-4 mt-4 sm:mt-0">
          <a
            href="https://facebook.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground hover:text-primary transition-colors"
            aria-label="Facebook"
          >
            <span className="sr-only">Facebook</span>
            <Facebook size={18} />
          </a>
          <a
            href="https://x.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground hover:text-primary transition-colors"
            aria-label="Twitter"
          >
            <span className="sr-only">Twitter</span>
            <Twitter size={18} />
          </a>
          <a
            href="https://instagram.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground hover:text-primary transition-colors"
            aria-label="Instagram"
          >
            <span className="sr-only">Instagram</span>
            <Instagram size={18} />
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
