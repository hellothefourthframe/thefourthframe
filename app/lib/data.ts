import { connection } from "next/server";
import { getDb } from "./mongodb";
import type { SiteContent } from "./types";

/**
 * Fetch the single siteContent document from MongoDB.
 * Used by server components to load dynamic data.
 * Rendered at request time so admin media/content changes are visible publicly.
 */
export async function getSiteContent(): Promise<SiteContent> {
  await connection();

  const db = await getDb();
  const doc = await db.collection("siteContent").findOne({});

  if (!doc) {
    throw new Error("Site content not found in database. Run the seed script first: npx tsx app/lib/seed.ts");
  }

  const content = { ...(doc as Record<string, unknown>) };
  delete content._id;
  delete content.createdAt;
  delete content.updatedAt;

  return content as unknown as SiteContent;
}
