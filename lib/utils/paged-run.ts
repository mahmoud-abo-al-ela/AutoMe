export async function runAllPages<P extends { next: string | null }>(
  page: (after?: string) => Promise<P>,
  deadline: number
): Promise<{ results: P[]; finished: boolean }> {
  const results: P[] = [];
  let after: string | undefined;
  do {
    const result = await page(after);
    results.push(result);
    after = result.next ?? undefined;
  } while (after && Date.now() < deadline);
  return { results, finished: after === undefined };
}
