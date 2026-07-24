import { ObjectId } from "mongodb";
import { NextResponse } from "next/server";
import { getAdminFromCookies } from "@/app/lib/auth";
import { getDb } from "@/app/lib/mongodb";

interface StoredContactQuery {
  _id?: ObjectId;
  name: string;
  email: string;
  interest: string;
  timeline: string;
  message: string;
  createdAt: Date;
}

interface ContactQueryPayload {
  name?: string;
  email?: string;
  interest?: string;
  timeline?: string;
  message?: string;
}

function cleanText(val: unknown): string {
  return typeof val === "string" ? val.trim() : "";
}

function serializeQuery(query: StoredContactQuery & { _id: ObjectId }) {
  return {
    ...query,
    _id: query._id.toString(),
    createdAt: query.createdAt.toISOString(),
  };
}

// ─────────────────────────────────────────────────────────
// POST: Submit Contact Form Brief (Public)
// ─────────────────────────────────────────────────────────
export async function POST(request: Request) {
  try {
    const body = (await request.json()) as ContactQueryPayload;

    const name = cleanText(body.name);
    const email = cleanText(body.email);
    const interest = cleanText(body.interest);
    const timeline = cleanText(body.timeline);
    const message = cleanText(body.message);

    if (!name || !email || !interest || !timeline || !message) {
      return NextResponse.json(
        { error: "All fields (Name, Email, Primary Interest, Timeline, Project Brief) are required." },
        { status: 400 }
      );
    }

    // Basic email validation
    if (!email.includes("@") || !email.includes(".")) {
      return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
    }

    const db = await getDb();
    const doc: StoredContactQuery = {
      name,
      email,
      interest,
      timeline,
      message,
      createdAt: new Date(),
    };

    const result = await db.collection<StoredContactQuery>("contactQueries").insertOne(doc);

    return NextResponse.json({
      success: true,
      query: serializeQuery({ ...doc, _id: result.insertedId }),
    });
  } catch (error) {
    console.error("Contact query submission error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ─────────────────────────────────────────────────────────
// GET: Admin Fetch Contact Queries with Pagination
// ─────────────────────────────────────────────────────────
export async function GET(request: Request) {
  try {
    const admin = await getAdminFromCookies();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.max(1, parseInt(searchParams.get("limit") || "5", 10));
    const skip = (page - 1) * limit;

    const db = await getDb();
    const collection = db.collection<StoredContactQuery>("contactQueries");

    const totalQueries = await collection.countDocuments({});
    const totalPages = Math.ceil(totalQueries / limit) || 1;

    const queries = await collection
      .find({})
      .sort({ _id: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();

    return NextResponse.json({
      queries: queries.map((q) => serializeQuery(q as StoredContactQuery & { _id: ObjectId })),
      page,
      limit,
      totalPages,
      totalQueries,
    });
  } catch (error) {
    console.error("Fetch contact queries error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ─────────────────────────────────────────────────────────
// DELETE: Admin Remove Contact Query
// ─────────────────────────────────────────────────────────
export async function DELETE(request: Request) {
  try {
    const admin = await getAdminFromCookies();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const queryId = searchParams.get("id");

    if (!queryId || !ObjectId.isValid(queryId)) {
      return NextResponse.json({ error: "Invalid query ID" }, { status: 400 });
    }

    const db = await getDb();
    const result = await db.collection("contactQueries").deleteOne({ _id: new ObjectId(queryId) });

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "Query not found or already deleted" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete contact query error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
