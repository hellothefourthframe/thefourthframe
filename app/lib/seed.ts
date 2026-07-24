/**
 * Database seed script
 * Run: npx tsx app/lib/seed.ts
 *
 * Seeds the initial admin user and website content from current constants.
 */

import { MongoClient } from "mongodb";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const MONGODB_URI = process.env.MONGODB_URI!;

if (!MONGODB_URI) {
  console.error("❌ MONGODB_URI not set in .env");
  process.exit(1);
}

async function seed() {
  console.log("🌱 Connecting to MongoDB...");
  const client = await MongoClient.connect(MONGODB_URI);
  const db = client.db();

  // ── Seed Admin ──────────────────────────────────────
  const adminsCol = db.collection("admins");
  const existingAdmin = await adminsCol.findOne({ username: "admin" });

  if (!existingAdmin) {
    const hashedPassword = await bcrypt.hash("admin123", 12);
    await adminsCol.insertOne({
      username: "admin",
      password: hashedPassword,
      createdAt: new Date(),
    });
    console.log("✅ Admin user created (username: admin, password: admin123)");
  } else {
    console.log("⏭️  Admin user already exists, skipping.");
  }

  // ── Seed Site Content ───────────────────────────────
  const contentCol = db.collection("siteContent");
  const existingContent = await contentCol.findOne({});

  if (!existingContent) {
    const siteContent = {
      site: {
        name: "THE AGENCY FRAME",
        operatedBy: "THE FOURTH FRAME",
        established: 2024,
        logo: "/images/logo.jpg",
        email: "hellothefourthframe@gmail.com",
        footerEmail: "HELLO@THEFOURTHFRAME.COM",
        footerEmailHref: "mailto:hello@thefourthframe.com",
        location: {
          studio: "Fourth Frame Production Studio",
          city: "Bikaner",
          country: "India",
        },
        badges: ["EST. 2024", "PRODUCTION PARTNER", "PAN-INDIA"],
      },
      socialLinks: [
        {
          label: "Instagram",
          href: "https://www.instagram.com/the_fourthframe_/",
          handle: "@the_fourthframe_",
        },
      ],
      heroMedia: {
        desktopVideo: "/main/main.mp4",
        mobileVideo: "/main/mianveritical.mp4",
      },
      foundersSection: {
        label: "LEADERSHIP",
        title: "The Faces Behind",
        titleAccent: "The Fourth Frame",
        sliderSpeed: 20,
      },
      founders: [
        {
          name: "Co-Founder & Producer",
          role: "PRODUCER",
          image: "/main/COP.jpeg",
        },
        {
          name: "Casting Manager",
          role: "CASTING",
          image: "/main/CM.jpeg",
        },
        {
          name: "Co-Founder & DOP",
          role: "DIRECTOR OF PHOTOGRAPHY",
          image: "/main/CFD.jpeg",
        },
      ],
      servicesSection: {
        label: "OUR EXPERTISE",
        title: "Integrated Production &",
        titleAccent: "Talent Management",
      },
      services: [
        {
          title: "BACKSTAGE",
          video: "/main/main.mp4",
          image: "/main/S3.jpeg",
        },
        {
          title: "BRAND SHOOT",
          video: "/main/mianveritical.mp4",
          image: "/main/S1.jpeg",
        },
        {
          title: "PROFESSIONAL EDITORS",
          video: "/main/CTABG.mp4",
          image: "/main/S4.jpeg",
        },
        {
          title: "BTS MAN",
          video: "/main/main.mp4",
          image: "/main/S2.jpeg",
        },
      ],
      modelsSection: {
        label: "OUR TALENT",
        title: "Models",
        titleAccent: "Roster",
        sliderSpeed: 25,
      },
      models: [
        {
          id: 1,
          name: "Iri",
          height: '162 cm (5\'4")',
          hair: "Dark Brown",
          eyes: "Dark Brown",
          image: "/main/M1.jpeg",
        },
        {
          id: 2,
          name: "Tamannah",
          height: '162 cm (5\'4")',
          hair: "Dark Brown",
          eyes: "Dark Brown",
          image: "/main/M3.png",
        },
        {
          id: 3,
          name: "Bhavika Jain",
          height: '167 cm (5\'5")',
          hair: "Black",
          eyes: "Dark Brown",
          image: "/main/M4.png",
        },
        {
          id: 4,
          name: "Zuber mirza",
          height: '180 cm (5\'9")',
          hair: "Black",
          eyes: "Black",
          image: "/main/M5.png",
        },
      ],
      contactSection: {
        label: "GET IN TOUCH",
        title: "CONNECT WITH",
        titleAccent: "THE FRAME",
        submitButtonText: "Book Your Talent",
        successTitle: "Submission Successful",
        successMessage:
          "Your query has been submitted and our team will connect with you soon.",
      },
      contactFormInterests: [
        "Talent Booking",
        "Production Management",
        "Location Scouting",
        "Full Agency Service",
      ],
      footer: {
        ctaVideoSrc: "/main/CTABG.mp4",
        ctaHeadline:
          "Build visuals that look premium before production even starts.",
        heading: ["WE COMMAND", "THE STAGE.", "WE CURATE", "THE FACE"],
        description:
          "Premium talent casting for global brands and comprehensive backstage logistics for large-scale fashion shows. We handle the hustle; you take the applause.",
        team: {
          title: "MAIN TEAM FOURTHFRAME",
          marketing: "MARKETING HANDLE BY ZAYRAGENCY",
          members: [
            { name: "AYAN", role: "THEME DIRECTOR" },
            { name: "REHAN", role: "D.O.V" },
            { name: "TANISHA", role: "CASTING DIRECTOR & CHOREOGRAPHER" },
            { name: "AMIT", role: "BTS MAN" },
          ],
        },
        studioLocations: [{ city: "Bikaner", note: "Primary Base" }],
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await contentCol.insertOne(siteContent);
    console.log("✅ Site content seeded successfully.");
  } else {
    console.log("⏭️  Site content already exists, skipping.");
  }

  await client.close();
  console.log("🎉 Seed complete!");
}

seed().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
