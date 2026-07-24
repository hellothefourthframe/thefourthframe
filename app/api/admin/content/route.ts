import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getDb } from "@/app/lib/mongodb";
import { getAdminFromCookies } from "@/app/lib/auth";

// GET — Public: fetch all site content directly from MongoDB
export async function GET() {
  try {
    const db = await getDb();
    const content = await db.collection("siteContent").findOne({}, { sort: { _id: -1 } });

    if (!content) {
      return NextResponse.json({ error: "No content found" }, { status: 404 });
    }

    const data = { ...content };

    delete data._id;
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

// PUT — Admin only: update site content in MongoDB
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
    const latest = await db.collection("siteContent").findOne({}, { sort: { _id: -1 } });

    if (!latest) {
      // If collection is empty, insert the document
      await db.collection("siteContent").insertOne({
        ...updates,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    } else {
      // Update the latest document by _id
      await db.collection("siteContent").updateOne(
        { _id: latest._id },
        {
          $set: {
            ...updates,
            updatedAt: new Date(),
          },
        }
      );
    }

    revalidatePath("/", "layout");
    revalidatePath("/", "page");
    revalidatePath("/(main)", "layout");
    revalidatePath("/(main)", "page");
    revalidatePath("/services", "page");
    revalidatePath("/gallery", "page");
    revalidatePath("/plans", "page");
    revalidatePath("/contact", "page");
    revalidatePath("/submissionform", "page");

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Content update error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
