import { createAdminClient } from "@/lib/supabase";
import { getPublicUrl } from "@/lib/services/storage";
import { db } from "@/lib/prisma";

const BUCKET = "car-images";
const PAGE = 1000;

type Storage = ReturnType<typeof createAdminClient>["storage"];

/** Every entry directly under `prefix`, page by page. */
async function listAll(storage: Storage, prefix: string) {
  const entries: { name: string; id: string | null }[] = [];
  for (let offset = 0; ; offset += PAGE) {
    const { data, error } = await storage.from(BUCKET).list(prefix, { limit: PAGE, offset });
    if (error) throw new Error(`Listing ${prefix} failed: ${error.message}`);
    entries.push(...(data ?? []));
    if (!data || data.length < PAGE) return entries;
  }
}

async function main() {
  const shouldDelete = process.argv.includes("--delete");
  const storage = createAdminClient().storage;

  // Every photo URL any car still shows: those are never orphans.
  const referenced = new Set<string>();
  const cars = await db.car.findMany({ select: { images: true } });
  for (const car of cars) for (const url of car.images) referenced.add(url);

  // Folders under cars/ are car ids (a folder entry has no id).
  const folders = (await listAll(storage, "cars")).filter((entry) => entry.id === null);

  const orphans: string[] = [];
  for (const folder of folders) {
    const files = (await listAll(storage, `cars/${folder.name}`)).filter((entry) => entry.id !== null);
    for (const file of files) {
      const path = `cars/${folder.name}/${file.name}`;
      if (!referenced.has(getPublicUrl(BUCKET, path))) orphans.push(path);
    }
  }

  console.log(`${folders.length} car folders; ${orphans.length} photos no car shows.`);
  for (const path of orphans.slice(0, 50)) console.log(`  ${path}`);
  if (orphans.length > 50) console.log(`  … and ${orphans.length - 50} more`);

  if (!shouldDelete) {
    console.log("Dry run: nothing deleted. Run again with --delete to remove them.");
    return;
  }

  for (let i = 0; i < orphans.length; i += 100) {
    const batch = orphans.slice(i, i + 100);
    const { error } = await storage.from(BUCKET).remove(batch);
    if (error) throw new Error(`Deleting a batch failed after ${i} photos: ${error.message}`);
  }
  console.log(`Deleted ${orphans.length} photos.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
