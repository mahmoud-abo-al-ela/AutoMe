/**
 * Narrow a raw query-string value to a member of a Prisma enum.
 *
 * Returns undefined when the value is absent, the "all" sentinel the filter
 * UIs use, or not a member of the enum. The last case is the point: these
 * values arrive from the URL, and passing an unknown one straight into a
 * Prisma enum filter throws PrismaClientValidationError and 500s the page.
 * Dropping the filter instead yields an unfiltered list, which is what a
 * mistyped URL should produce.
 */
export function asEnumParam<T extends Record<string, string>>(
  enumObject: T,
  value: string | undefined | null
): T[keyof T] | undefined {
  if (!value || value === "all") {
    return undefined;
  }

  return (Object.values(enumObject) as string[]).includes(value)
    ? (value as T[keyof T])
    : undefined;
}
