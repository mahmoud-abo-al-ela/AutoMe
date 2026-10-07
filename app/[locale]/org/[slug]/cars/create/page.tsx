import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import type { Locale } from "@/i18n/routing";
import { Link } from "@/i18n/navigation";
import { CarEditor } from "../_components/editor/CarEditor";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "org.carForm.meta" });

  return { title: t("title"), description: t("description") };
}

/**
 * Adding a car: straight into the steps, photos first. There is no separate
 * "by hand or with AI" choice any more — the photos step offers to read the
 * details when the plan does, and typing them is simply carrying on.
 */
const CreateCarPage = async ({ params }: { params: Promise<{ slug: string }> }) => {
  const { slug } = await params;
  const t = await getTranslations("org.carForm.editor");

  return (
    <CarEditor
      mode="add"
      title={
        <>
          <p className="text-caption text-muted-foreground">
            <Link href={`/org/${slug}/cars`} className="text-[#1d4e9e] hover:underline">
              {t("cars")}
            </Link>{" "}
            / {t("addTitle")}
          </p>
          <h1 className="text-h1 font-extrabold">{t("addTitle")}</h1>
        </>
      }
    />
  );
};

export default CreateCarPage;
