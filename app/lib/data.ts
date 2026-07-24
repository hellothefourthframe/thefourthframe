import { connection } from "next/server";
import { getDb } from "./mongodb";
import type { SiteContent } from "./types";
import {
  SITE,
  SOCIAL_LINKS,
  HERO_MEDIA,
  FOUNDERS_SECTION,
  FOUNDERS,
  SERVICES_SECTION,
  SERVICES,
  MODELS_SECTION,
  MODELS,
  CONTACT_SECTION,
  CONTACT_FORM_INTERESTS,
  FOOTER,
} from "./constants";

export const DEFAULT_SITE_CONTENT: SiteContent = {
  site: SITE as unknown as SiteContent["site"],
  socialLinks: SOCIAL_LINKS as unknown as SiteContent["socialLinks"],
  heroMedia: HERO_MEDIA as unknown as SiteContent["heroMedia"],
  foundersSection: FOUNDERS_SECTION as unknown as SiteContent["foundersSection"],
  founders: FOUNDERS as unknown as SiteContent["founders"],
  servicesSection: SERVICES_SECTION as unknown as SiteContent["servicesSection"],
  services: SERVICES as unknown as SiteContent["services"],
  modelsSection: MODELS_SECTION as unknown as SiteContent["modelsSection"],
  models: MODELS as unknown as SiteContent["models"],
  contactSection: CONTACT_SECTION as unknown as SiteContent["contactSection"],
  contactFormInterests: CONTACT_FORM_INTERESTS as unknown as SiteContent["contactFormInterests"],
  footer: FOOTER as unknown as SiteContent["footer"],
};

/**
 * Fetch the latest siteContent document directly from MongoDB.
 * Auto-creates document and falls back gracefully if database is unseeded.
 */
export async function getSiteContent(): Promise<SiteContent> {
  await connection();

  try {
    const db = await getDb();
    const doc = await db.collection("siteContent").findOne({}, { sort: { _id: -1 } });

    if (!doc) {
      // Auto-create document in MongoDB if empty
      try {
        await db.collection("siteContent").insertOne({
          ...DEFAULT_SITE_CONTENT,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      } catch { /* ignore write errors */ }

      return DEFAULT_SITE_CONTENT;
    }

    const content = { ...(doc as Record<string, unknown>) };
    delete content._id;
    delete content.createdAt;
    delete content.updatedAt;

    return content as unknown as SiteContent;
  } catch (error) {
    console.error("MongoDB connection or query error, using fallback content:", error);
    return DEFAULT_SITE_CONTENT;
  }
}
