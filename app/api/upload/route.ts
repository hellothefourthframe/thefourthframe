import { NextResponse } from "next/server";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { ALLOWED_VIDEO_MIME_TYPES } from "@/app/lib/video";

const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const MAX_VIDEO_BYTES = 20 * 1024 * 1024;

const imageContentTypes = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
];

const videoContentTypes = [...ALLOWED_VIDEO_MIME_TYPES];

function parseUploadType(
  clientPayload: string | null | undefined
): "image" | "video" | null {
  if (!clientPayload) return null;

  try {
    const parsed = JSON.parse(clientPayload) as { type?: string };
    if (parsed.type === "image" || parsed.type === "video") {
      return parsed.type;
    }
  } catch {
    return null;
  }

  return null;
}

export async function POST(request: Request) {
  const body = (await request.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (_pathname, clientPayload) => {
        const type = parseUploadType(clientPayload);
        if (!type) {
          throw new Error("Invalid file type. Must be 'image' or 'video'");
        }

        return {
          allowedContentTypes:
            type === "image" ? imageContentTypes : videoContentTypes,
          maximumSizeInBytes:
            type === "image" ? MAX_IMAGE_BYTES : MAX_VIDEO_BYTES,
          addRandomSuffix: true,
          tokenPayload: JSON.stringify({ type }),
          validUntil: Date.now() + 60 * 60 * 1000,
        };
      },
      onUploadCompleted: async ({ blob }) => {
        console.log("Public upload completed:", blob.url);
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
