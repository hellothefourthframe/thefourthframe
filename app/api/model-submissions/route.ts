import { existsSync } from "fs";
import { mkdir, unlink, writeFile } from "fs/promises";
import { ObjectId } from "mongodb";
import { NextResponse } from "next/server";
import path from "path";
import { getAdminFromCookies } from "@/app/lib/auth";
import { getDb } from "@/app/lib/mongodb";

const MAX_IMAGES = 5;
const MAX_IMAGE_SIZE = 8 * 1024 * 1024;
const MAX_VIDEO_SIZE = 20 * 1024 * 1024;
const PUBLIC_UPLOAD_PATH = "/uploads/model-submissions";
const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "model-submissions");

const allowedImageTypes = new Set(["image/jpeg", "image/jpg", "image/png", "image/webp"]);
const allowedVideoTypes = new Set(["video/mp4", "video/quicktime", "video/webm"]);

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

function cleanText(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value.trim() : "";
}

function safeExtension(fileName: string, fallback: string) {
  const ext = fileName.toLowerCase().match(/\.[a-z0-9]+$/)?.[0];
  return ext && ext.length <= 6 ? ext : fallback;
}

function isUploadPath(filePath: string) {
  return filePath.startsWith(`${PUBLIC_UPLOAD_PATH}/`) && !filePath.includes("..");
}

async function ensureUploadDir() {
  if (!existsSync(UPLOAD_DIR)) {
    await mkdir(UPLOAD_DIR, { recursive: true });
  }
}

async function saveUpload(file: File, type: "image" | "video") {
  const fallbackExt = type === "image" ? ".jpg" : ".mp4";
  const uniqueName = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}${safeExtension(
    file.name,
    fallbackExt
  )}`;
  const fullPath = path.join(UPLOAD_DIR, uniqueName);
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(fullPath, buffer);
  return `${PUBLIC_UPLOAD_PATH}/${uniqueName}`;
}

async function deleteUpload(filePath: string) {
  if (!isUploadPath(filePath)) return;

  const fullPath = path.join(process.cwd(), "public", ...filePath.split("/").filter(Boolean));
  if (existsSync(fullPath)) {
    await unlink(fullPath);
  }
}

function serializeSubmission(submission: StoredSubmission & { _id: ObjectId }) {
  return {
    ...submission,
    _id: submission._id.toString(),
    createdAt: submission.createdAt.toISOString(),
  };
}

export async function POST(request: Request) {
  const savedPaths: string[] = [];

  try {
    const formData = await request.formData();
    const fullname = cleanText(formData.get("fullname"));
    const email = cleanText(formData.get("email"));
    const contact = cleanText(formData.get("contact"));
    const age = cleanText(formData.get("age"));
    const height = cleanText(formData.get("height"));
    const city = cleanText(formData.get("city"));
    const images = formData.getAll("images").filter((item): item is File => item instanceof File);
    const video = formData.get("video");

    if (!fullname || !email || !contact || !age || !height || !city) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 });
    }

    if (images.length === 0 || images.length > MAX_IMAGES) {
      return NextResponse.json(
        { error: `Please upload 1 to ${MAX_IMAGES} images` },
        { status: 400 }
      );
    }

    for (const image of images) {
      if (!allowedImageTypes.has(image.type)) {
        return NextResponse.json(
          { error: "Only JPG, PNG, or WEBP images are allowed" },
          { status: 400 }
        );
      }

      if (image.size > MAX_IMAGE_SIZE) {
        return NextResponse.json(
          { error: "Each image must be 8 MB or smaller" },
          { status: 400 }
        );
      }
    }

    const videoFile = video instanceof File && video.size > 0 ? video : null;
    if (!videoFile) {
      return NextResponse.json({ error: "Please upload one short video" }, { status: 400 });
    }

    if (videoFile) {
      if (!allowedVideoTypes.has(videoFile.type)) {
        return NextResponse.json(
          { error: "Only MP4, MOV, or WEBM videos are allowed" },
          { status: 400 }
        );
      }

      if (videoFile.size > MAX_VIDEO_SIZE) {
        return NextResponse.json(
          { error: "Video must be 20 MB or smaller" },
          { status: 400 }
        );
      }
    }

    await ensureUploadDir();

    const imagePaths = [];
    for (const image of images) {
      const imagePath = await saveUpload(image, "image");
      savedPaths.push(imagePath);
      imagePaths.push(imagePath);
    }

    let videoPath: string | null = null;
    if (videoFile) {
      videoPath = await saveUpload(videoFile, "video");
      savedPaths.push(videoPath);
    }

    const db = await getDb();
    const doc: StoredSubmission = {
      fullname,
      email,
      contact,
      age,
      height,
      city,
      images: imagePaths,
      video: videoPath,
      createdAt: new Date(),
    };

    const result = await db.collection<StoredSubmission>("modelSubmissions").insertOne(doc);

    return NextResponse.json({
      success: true,
      submission: serializeSubmission({ ...doc, _id: result.insertedId }),
    });
  } catch (error) {
    await Promise.all(savedPaths.map((filePath) => deleteUpload(filePath)));
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
