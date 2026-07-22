import { NextResponse } from "next/server";
import { put, del } from "@vercel/blob";
import { getAdminFromCookies } from "@/app/lib/auth";

const imageExtensions: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/jpg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};

// POST — Upload a file (admin only)
export async function POST(request: Request) {
  try {
    const admin = await getAdminFromCookies();

    if (!admin) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const type = formData.get("type") as string | null;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    // Validate file type
    if (type === "image") {
      if (!imageExtensions[file.type]) {
        return NextResponse.json(
          { error: "Only JPG, PNG or WEBP images are allowed" },
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

    const ext =
      type === "image"
        ? imageExtensions[file.type]
        : ".mp4";

    const filename = `${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 8)}${ext}`;

    const blob = await put(filename, file, {
      access: "public",
      addRandomSuffix: false,
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });

    return NextResponse.json({
      success: true,
      path: blob.url,
      pathname: blob.pathname,
    });
  } catch (err) {
    console.error("Upload error:", err);

    return NextResponse.json(
      {
        success: false,
        error:
          err instanceof Error
            ? err.message
            : "Upload failed",
      },
      { status: 500 }
    );
  }
}

// DELETE — Remove uploaded file
export async function DELETE(request: Request) {
  try {
    const admin = await getAdminFromCookies();

    if (!admin) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { filePath } = await request.json();

    if (!filePath) {
      return NextResponse.json(
        { error: "Missing file path" },
        { status: 400 }
      );
    }

    await del(filePath, {
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });

    return NextResponse.json({
      success: true,
    });
  } catch (err) {
    console.error("Delete error:", err);

    return NextResponse.json(
      {
        success: false,
        error:
          err instanceof Error
            ? err.message
            : "Delete failed",
      },
      { status: 500 }
    );
  }
}