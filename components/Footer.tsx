import { Link } from "@/i18n/navigation";
import { getTranslations } from "next-intl/server";
import { Logo } from "@/components/brand";
import type { HeaderUser } from "@/components/Header/MainHeader";
import { showsDealerPitch } from "@/lib/org/client";

/**
 * Site footer (Figma: Footer) — asphalt, with the column headings in marker
 * yellow.
 *
 * The social icons are gone: they linked to facebook.com, x.com and
 * instagram.com themselves, not to any AutoMe account. They come back when
 * there are accounts to link to.
 */
const Footer = async ({
  user,
  organization,
}: {
  user?: HeaderUser;
  organization?: {
    name?: string | null;
    description?: string | null;
    phone?: string | null;
    email?: string | null;
    address?: string | null;
  } | null;
}) => {
  const t = await getTranslations("footer");
  const tNav = await getTranslations("nav");

  const isOnSubdomain = !!organization;
  const brandName = organization?.name || "AutoMe";
  // A dealership's own description is user content and is shown as written —
  // there is no translation of it to fall back to. Only the platform's own
  // tagline is a message key.
  const brandDescription = organization?.description || t("tagline");

  const columns: { heading: string; links: { href: string; label: string }[] }[] = [
    {
      heading: t("browse"),
      links: [
        { href: "/cars", label: t("browseCars") },
        ...(isOnSubdomain ? [] : [{ href: "/dealerships", label: t("dealerships") }]),
        { href: "/compare", label: t("compareModels") },
        { href: "/wishlist", label: t("savedVehicles") },
      ],
    },
    ...(isOnSubdomain
      ? []
      : [
          {
            heading: t("company"),
            links: [
              { href: "/about", label: t("aboutUs") },
              { href: "/contact", label: t("contactUs") },
              { href: "/faq", label: t("faq") },
              ...(showsDealerPitch(user, isOnSubdomain)
                ? [{ href: "/for-dealers", label: tNav("forDealers") }]
                : []),
            ],
          },
        ]),
    {
      heading: t("legal"),
      links: [
        { href: "/terms", label: t("terms") },
        { href: "/privacy", label: t("privacy") },
        { href: "/cookies", label: t("cookies") },
      ],
    },
  ];

  return (
    <footer className="bg-inverse text-inverse-foreground">
      <div className="mx-auto flex max-w-[1440px] flex-col gap-10 px-4 pb-8 pt-12 md:px-8 md:pt-14 xl:px-20">
        <div className="grid gap-10 md:grid-cols-[minmax(0,1.4fr)_repeat(3,minmax(0,1fr))] md:gap-16">
          <div className="flex flex-col items-start gap-4">
            <Logo name={brandName} />
            <p className="max-w-xs text-caption text-inverse-foreground/75">{brandDescription}</p>
            {isOnSubdomain && (
              <dl className="flex flex-col gap-2 text-caption">
                {organization.phone && (
                  <div>
                    <dt className="text-micro text-marker">{t("phone")}</dt>
                    {/* The number reads left to right (dir on the link), but the
                        line keeps the page's start: right, on the Arabic page. */}
                    <dd>
                      <a href={`tel:${organization.phone}`} dir="ltr" className="hover:underline">
                        {organization.phone}
                      </a>
                    </dd>
                  </div>
                )}
                {organization.email && (
                  <div>
                    <dt className="text-micro text-marker">{t("email")}</dt>
                    <dd className="break-all">
                      <a href={`mailto:${organization.email}`} dir="ltr" className="hover:underline">
                        {organization.email}
                      </a>
                    </dd>
                  </div>
                )}
                {organization.address && (
                  <div>
                    <dt className="text-micro text-marker">{t("address")}</dt>
                    <dd>{organization.address}</dd>
                  </div>
                )}
              </dl>
            )}
          </div>

          {columns.map((column) => (
            <nav key={column.heading} aria-label={column.heading} className="flex flex-col gap-3">
              <h2 className="text-caption font-semibold text-marker">{column.heading}</h2>
              <ul className="flex flex-col gap-2.5">
                {column.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-caption text-inverse-foreground/80 transition-colors hover:text-inverse-foreground hover:underline"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="flex flex-col gap-2 border-t border-inverse-foreground/15 pt-5 text-micro sm:flex-row sm:items-center sm:justify-between">
          <p className="text-inverse-foreground/60">
            {/* `year` is passed as a string deliberately: a year must not carry
                a thousands separator ("2,026"). */}
            {t("copyright", { year: String(new Date().getFullYear()), brand: brandName })}
            {isOnSubdomain && <> · {t("poweredBy")}</>}
          </p>
          <p className="font-medium text-marker">{t("madeIn")}</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
