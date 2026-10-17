import "dotenv/config";
import pg from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../lib/generated/prisma";
import { findDemo, removeDemo } from "./find-demo";
import { createDemo } from "./create-demo";

async function main() {
  const apply = process.argv.includes("--apply");
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");
  const target = new URL(url);
  const local = ["localhost", "127.0.0.1", "::1"].includes(target.hostname);
  console.log(`Database: ${target.hostname}:${target.port || 5432}${target.pathname} ${local ? "(this machine)" : "(remote)"}`);
  if (apply && !local && !process.argv.includes("--production")) {
    throw new Error("A remote database: add --production as well, to say you mean it.");
  }

  const db = new PrismaClient({ adapter: new PrismaPg(new pg.Pool({ connectionString: url })) });
  try {
    const demo = await findDemo(db);
    console.log(`\nWould remove ${demo.orgs.length} demo dealership(s) and ${demo.users.length} demo user(s):`);
    for (const org of demo.orgs) {
      const c = org._count;
      console.log(`  - ${org.name} (${org.slug}): ${c.cars} cars, ${c.testDrives} test drives, ${c.dealershipReviews} reviews`);
    }
    const kept = await db.organization.findMany({ where: { id: { notIn: demo.orgIds } }, select: { name: true } });
    console.log(`Keeps ${kept.length} other dealership(s): ${kept.map((o) => o.name).join(", ") || "none"}`);

    if (demo.problems.length > 0) {
      console.error("\nRefusing — this is not only demo data:");
      for (const p of demo.problems) console.error(`  ! ${p}`);
      process.exitCode = 1;
      return;
    }
    if (!apply) {
      console.log("\nDry run: nothing changed. Run again with --apply to replace it.");
      return;
    }

    await removeDemo(db, demo);
    console.log("\nRemoved.");
    const made = await createDemo(db, new Date());
    console.log(`Created ${made.dealerships} dealerships, ${made.cars} cars, ${made.buyers} buyers, ${made.saves} saved cars.`);
  } finally {
    await db.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
