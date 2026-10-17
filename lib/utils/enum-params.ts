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
