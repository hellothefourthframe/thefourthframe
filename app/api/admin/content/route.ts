

import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getDb } from "@/app/lib/mongodb";
import { getAdminFromCookies } from "@/app/lib/auth";

// GET — Public: fetch all site content
export async function GET() {
  try {
    const db = await getDb();
    const content = await db.collection("siteContent").findOne({});

    if (!content) {
      return NextResponse.json({ error: "No content found" }, { status: 404 });
    }

    const data = { ...content };

    delete data.createdAt;
    delete data.updatedAt;

    return NextResponse.json(data);
  } catch (error) {
    console.error("Content fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT — Admin only: update site content (partial update)
export async function PUT(request: Request) {
  try {
    const admin = await getAdminFromCookies();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const updates = await request.json();

    // Prevent overwriting _id or timestamps via the API
    delete updates._id;
    delete updates.createdAt;

    const db = await getDb();
    const result = await db.collection("siteContent").updateOne(
      {},
      {
        $set: {
          ...updates,
          updatedAt: new Date(),
        },
      }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "No content document found" }, { status: 404 });
    }

    revalidatePath("/", "layout");
    revalidatePath("/", "page");
    revalidatePath("/(main)", "layout");
    revalidatePath("/(main)", "page");
    revalidatePath("/services", "page");
    revalidatePath("/gallery", "page");
    revalidatePath("/plans", "page");
    revalidatePath("/contact", "page");

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Content update error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
