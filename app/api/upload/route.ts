import { NextResponse } from "next/server";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { del } from "@vercel/blob";
import { getAdminFromCookies } from "@/app/lib/auth";
import {
  ALLOWED_VIDEO_MIME_TYPES,
  MAX_PUBLIC_VIDEO_BYTES,
} from "@/app/lib/video";

const imageContentTypes = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
];

const videoContentTypes = [...ALLOWED_VIDEO_MIME_TYPES];

const MAX_PUBLIC_IMAGE_BYTES = 10 * 1024 * 1024;

// POST — Public upload (used by the model-application contact form)
export async function POST(request: Request) {
  const body = (await request.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (_pathname, clientPayload) => {
        // NOTE: intentionally no admin check — this is the public form route.
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
            type === "video" ? MAX_PUBLIC_VIDEO_BYTES : MAX_PUBLIC_IMAGE_BYTES,
          addRandomSuffix: true,
          tokenPayload: JSON.stringify({ type }),
          validUntil: Date.now() + 60 * 60 * 1000,
        };
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        console.log("Public upload completed:", blob.url, tokenPayload);
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (err) {
    console.error("Upload error:", err);
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : "Upload failed" },
      { status: 400 }
    );
  }
}

// DELETE — Keep this admin-only (cleanup should stay protected)
export async function DELETE(request: Request) {
  try {
    const admin = await getAdminFromCookies();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { filePath } = await request.json();
    if (!filePath) {
      return NextResponse.json({ error: "Missing file path" }, { status: 400 });
    }

    await del(filePath, { token: process.env.BLOB_READ_WRITE_TOKEN });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Delete error:", err);
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : "Delete failed" },
      { status: 500 }
    );
  }
}
