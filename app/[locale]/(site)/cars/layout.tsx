// No metadata here. A plain-string `title` in a layout carries no template,
// so every page beneath it lost the root layout's "%s | AutoMe" and rendered
// a bare title. The listing's title lives on the listing page.

export default async function CarsLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  return children;
}
