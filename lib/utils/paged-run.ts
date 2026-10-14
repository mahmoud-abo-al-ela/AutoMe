/**
 * Walk a cursor-paged backfill from its first page until it has no next page
 * or `deadline` passes — how a scheduled run covers everything left to do
 * without outliving its function. A backfill that selects only the work
 * still missing converges: what one run doesn't reach, the next starts with.
 */
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
