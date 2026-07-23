import { NextResponse } from "next/server";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { del } from "@vercel/blob";
import { getAdminFromCookies } from "@/app/lib/auth";
import {
  ALLOWED_VIDEO_MIME_TYPES,
  MAX_ADMIN_VIDEO_BYTES,
} from "@/app/lib/video";

const imageContentTypes = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
];

const videoContentTypes = [...ALLOWED_VIDEO_MIME_TYPES];

// POST — Generate upload token (admin only) + handle upload completion
export async function POST(request: Request) {
  const body = (await request.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        // Auth check — runs BEFORE any upload token is issued
        const admin = await getAdminFromCookies();

        if (!admin) {
          throw new Error("Unauthorized");
        }

        let type: string | null = null;
        try {
          type = clientPayload ? JSON.parse(clientPayload).type : null;
        } catch {
          type = null;
        }

        if (type !== "image" && type !== "video") {
          throw new Error("Invalid file type. Must be 'image' or 'video'");
        }

        return {
          allowedContentTypes:
            type === "image" ? imageContentTypes : videoContentTypes,
          maximumSizeInBytes:
            type === "video" ? MAX_ADMIN_VIDEO_BYTES : 10 * 1024 * 1024,
          addRandomSuffix: true,
          tokenPayload: JSON.stringify({ type }),
          validUntil: Date.now() + 60 * 60 * 1000,
        };
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        // Optional: log or persist to DB after upload finishes
        console.log("Upload completed:", blob.url, tokenPayload);
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (err) {
    console.error("Upload error:", err);

    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : "Upload failed",
      },
      { status: 400 }
    );
  }
}

// DELETE — Remove uploaded file (admin only) — unchanged
export async function DELETE(request: Request) {
  try {
    const admin = await getAdminFromCookies();

    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Delete error:", err);

    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : "Delete failed",
      },
      { status: 500 }
    );
  }
}