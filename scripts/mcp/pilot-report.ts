import { pilotReport } from "@/lib/services/mcp/pilot-report";
import { db } from "@/lib/prisma";

function arg(name: string): string | undefined {
  const index = process.argv.indexOf(`--${name}`);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

function parseDate(value: string, name: string): Date {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) throw new Error(`--${name} is not a date: ${value}`);
  return date;
}

async function main() {
  const until = arg("until") ? parseDate(arg("until")!, "until") : new Date();
  const days = Number(arg("days") ?? 7);
  const since = arg("since") ? parseDate(arg("since")!, "since") : new Date(until.getTime() - days * 86_400_000);

  const report = await pilotReport(since, until);
  const percent = (value: number) => `${(value * 100).toFixed(2)} %`;

  console.info(`MCP pilot, ${report.window.since.slice(0, 10)} → ${report.window.until.slice(0, 10)}`);
  console.info(`calls ${report.totals.calls} · internal ${percent(report.totals.internalErrorRate)} · unavailable ${percent(report.totals.unavailableRate)} · rate-limited ${percent(report.totals.rateLimitedRate)} · zero results ${percent(report.totals.zeroResultRate)} · referrals ${report.totals.referrals}`);
  console.table(report.tools.map(({ errors, ...tool }) => ({ ...tool, errors: JSON.stringify(errors) })));
  console.info(JSON.stringify(report, null, 2));
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
