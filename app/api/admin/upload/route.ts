import { NextResponse } from "next/server";
import { writeFile, unlink, mkdir } from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import { getAdminFromCookies } from "@/app/lib/auth";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");
const imageExtensions: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/jpg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};

// Ensure upload directory exists
async function ensureUploadDir() {
  if (!existsSync(UPLOAD_DIR)) {
    await mkdir(UPLOAD_DIR, { recursive: true });
  }
}

// POST — Upload a file (admin only)
export async function POST(request: Request) {
  try {
    const admin = await getAdminFromCookies();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await ensureUploadDir();

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const type = formData.get("type") as string | null; // "image" or "video"

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file type
    if (type === "image") {
      if (!imageExtensions[file.type]) {
        return NextResponse.json(
          { error: "Only JPG, PNG, or WEBP images are allowed" },
          { status: 400 }
        );
      }
    } else if (type === "video") {
      if (file.type !== "video/mp4") {
        return NextResponse.json(
          { error: "Only MP4 videos are allowed" },
          { status: 400 }
        );
      }
    } else {
      return NextResponse.json(
        { error: "Invalid file type. Must be 'image' or 'video'" },
        { status: 400 }
      );
    }

    // Generate unique filename
    const ext = type === "image" ? imageExtensions[file.type] : ".mp4";
    const uniqueName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`;
    const filePath = path.join(UPLOAD_DIR, uniqueName);

    // Write file to disk
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    // Return the public URL path
    const publicPath = `/uploads/${uniqueName}`;

    return NextResponse.json({ success: true, path: publicPath });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE — Remove an uploaded file (admin only)
export async function DELETE(request: Request) {
  try {
    const admin = await getAdminFromCookies();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { filePath } = await request.json();

    if (!filePath || !filePath.startsWith("/uploads/")) {
      return NextResponse.json(
        { error: "Invalid file path" },
        { status: 400 }
      );
    }

    const fullPath = path.join(process.cwd(), "public", filePath);

    if (existsSync(fullPath)) {
      await unlink(fullPath);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete file error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
