/**
 * Renders JSON-LD built by `lib/utils/structured-data.ts`.
 *
 * The documents carry dealer-written text (names, descriptions, addresses),
 * and JSON.stringify does not escape `<`: a description containing
 * `</script>` would close the tag and the rest would run as markup. Every `<`
 * is written as `<`, which JSON parsers read back as the same character.
 */
export function StructuredData({ data }: { data: unknown }) {
    if (!data) return null;

    return (
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
        />
    );
}
