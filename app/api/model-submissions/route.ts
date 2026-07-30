import { del } from "@vercel/blob";
import { ObjectId } from "mongodb";
import { NextResponse } from "next/server";
import { getAdminFromCookies } from "@/app/lib/auth";
import { getDb } from "@/app/lib/mongodb";

const MAX_IMAGES = 5;

interface StoredSubmission {
  fullname: string;
  email: string;
  contact: string;
  age: string;
  height: string;
  city: string;
  images: string[];
  video: string | null;
  createdAt: Date;
}

interface SubmissionPayload {
  fullname?: string;
  email?: string;
  contact?: string;
  age?: string;
  height?: string;
  city?: string;
  images?: string[];
  video?: string | null;
}

function cleanText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function isGoogleDriveUrl(filePath: string) {
  return (
    filePath.includes("googleusercontent.com") ||
    filePath.includes("drive.google.com") ||
    filePath.startsWith("/api/drive-file/")
  );
}

function isBlobUrl(filePath: string) {
  try {
    const url = new URL(filePath);
    return (
      url.protocol === "https:" &&
      (url.hostname.endsWith(".blob.vercel-storage.com") ||
        url.hostname.endsWith(".public.blob.vercel-storage.com") ||
        url.hostname === "blob.vercel-storage.com")
    );
  } catch {
    return false;
  }
}

function isUploadPath(filePath: string) {
  return filePath.startsWith("/uploads/model-submissions/") && !filePath.includes("..");
}

function isValidMediaPath(filePath: string) {
  return (
    isGoogleDriveUrl(filePath) ||
    isBlobUrl(filePath) ||
    isUploadPath(filePath) ||
    filePath.startsWith("http://") ||
    filePath.startsWith("https://") ||
    filePath.startsWith("/api/drive-file/")
  );
}

function serializeSubmission(submission: StoredSubmission & { _id: ObjectId }) {
  return {
    ...submission,
    _id: submission._id.toString(),
    createdAt: submission.createdAt.toISOString(),
  };
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as SubmissionPayload;
    const fullname = cleanText(body.fullname);
    const email = cleanText(body.email);
    const contact = cleanText(body.contact);
    const age = cleanText(body.age);
    const height = cleanText(body.height);
    const city = cleanText(body.city);
    const images = Array.isArray(body.images)
      ? body.images.filter((item): item is string => typeof item === "string" && item.trim().length > 0)
      : [];
    const video = cleanText(body.video);

    if (!fullname || !email || !contact || !age || !height || !city) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 });
    }

    if (images.length === 0 || images.length > MAX_IMAGES) {
      return NextResponse.json(
        { error: `Please upload 1 to ${MAX_IMAGES} images` },
        { status: 400 }
      );
    }

    if (!images.every(isValidMediaPath)) {
      return NextResponse.json({ error: "Invalid image upload path" }, { status: 400 });
    }

    if (!video) {
      return NextResponse.json({ error: "Please upload one short video" }, { status: 400 });
    }

    if (!isValidMediaPath(video)) {
      return NextResponse.json({ error: "Invalid video upload path" }, { status: 400 });
    }

    const db = await getDb();
    const doc: StoredSubmission = {
      fullname,
      email,
      contact,
      age,
      height,
      city,
      images,
      video,
      createdAt: new Date(),
    };

    const result = await db.collection<StoredSubmission>("modelSubmissions").insertOne(doc);

    return NextResponse.json({
      success: true,
      submission: serializeSubmission({ ...doc, _id: result.insertedId }),
    });
  } catch (error) {
    console.error("Model submission error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const admin = await getAdminFromCookies();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = await getDb();
    const submissions = await db
      .collection<StoredSubmission>("modelSubmissions")
      .find({})
      .sort({ createdAt: -1 })
      .toArray();

    return NextResponse.json({
      submissions: submissions.map((submission) =>
        serializeSubmission(submission as StoredSubmission & { _id: ObjectId })
      ),
    });
  } catch (error) {
    console.error("Model submissions fetch error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

async function deleteUpload(filePath: string) {
  if (isGoogleDriveUrl(filePath)) {
    try {
      const { deleteFromGoogleDrive } = await import("@/app/lib/gdrive");
      await deleteFromGoogleDrive(filePath);
    } catch (e) {
      console.error("Failed to delete Google Drive file:", e);
    }
    return;
  }

  if (isBlobUrl(filePath)) {
    await del(filePath, {
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });
    return;
  }

  if (!isUploadPath(filePath)) return;

  const { existsSync } = await import("fs");
  const { unlink } = await import("fs/promises");
  const path = await import("path");

  const fullPath = path.join(process.cwd(), "public", ...filePath.split("/").filter(Boolean));
  if (existsSync(fullPath)) {
    await unlink(fullPath);
  }
}

export async function DELETE(request: Request) {
  try {
    const admin = await getAdminFromCookies();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = (await request.json()) as { id?: string };
    if (!id || !ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid submission id" }, { status: 400 });
    }

    const db = await getDb();
    const collection = db.collection("modelSubmissions");
    const submission = await collection.findOne({ _id: new ObjectId(id) });

    if (!submission) {
      return NextResponse.json({ error: "Submission not found" }, { status: 404 });
    }

    const result = await collection.deleteOne({ _id: new ObjectId(id) });
    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "Submission not deleted" }, { status: 500 });
    }

    const files = [...submission.images, submission.video].filter((filePath): filePath is string =>
      Boolean(filePath)
    );
    await Promise.all(files.map((filePath) => deleteUpload(filePath)));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Model submission delete error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
