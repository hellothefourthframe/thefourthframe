import { NextResponse } from "next/server";
import { getAdminFromCookies } from "@/app/lib/auth";
import { uploadToGoogleDrive } from "@/app/lib/gdrive";

export const maxDuration = 60;

// Temporary memory store for chunked uploads
const pendingUploads = new Map<
  string,
  {
    chunks: Map<number, Buffer>;
    totalChunks: number;
    fileName: string;
    fileType: string;
    createdAt: number;
  }
>();

// Clean up stale uploads older than 15 minutes
function cleanupStaleUploads() {
  const now = Date.now();
  for (const [id, upload] of pendingUploads.entries()) {
    if (now - upload.createdAt > 15 * 60 * 1000) {
      pendingUploads.delete(id);
    }
  }
}

export async function POST(request: Request) {
  try {
    const admin = await getAdminFromCookies();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    cleanupStaleUploads();

    const formData = await request.formData();
    const chunkFile = formData.get("chunk");
    const uploadId = formData.get("uploadId") as string;
    const chunkIndexStr = formData.get("chunkIndex") as string;
    const totalChunksStr = formData.get("totalChunks") as string;
    const fileName = (formData.get("fileName") as string) || "uploaded_media.mp4";
    const fileType = (formData.get("fileType") as string) || "video/mp4";

    if (
      !(chunkFile instanceof File) ||
      !uploadId ||
      chunkIndexStr === null ||
      !totalChunksStr
    ) {
      return NextResponse.json(
        { success: false, error: "Missing chunk parameters" },
        { status: 400 }
      );
    }

    const chunkIndex = parseInt(chunkIndexStr, 10);
    const totalChunks = parseInt(totalChunksStr, 10);

    const chunkArrayBuffer = await chunkFile.arrayBuffer();
    const chunkBuffer = Buffer.from(chunkArrayBuffer);

    let pending = pendingUploads.get(uploadId);
    if (!pending) {
      pending = {
        chunks: new Map(),
        totalChunks,
        fileName,
        fileType,
        createdAt: Date.now(),
      };
      pendingUploads.set(uploadId, pending);
    }

    pending.chunks.set(chunkIndex, chunkBuffer);

    // If all chunks have arrived, assemble and upload to Google Drive
    if (pending.chunks.size === totalChunks) {
      const bufferList: Buffer[] = [];
      for (let i = 0; i < totalChunks; i++) {
        const buf = pending.chunks.get(i);
        if (!buf) {
          throw new Error(`Missing chunk index ${i}`);
        }
        bufferList.push(buf);
      }

      const completeBuffer = Buffer.concat(bufferList);
      pendingUploads.delete(uploadId);

      const fullFile = new File([completeBuffer], fileName, { type: fileType });
      const result = await uploadToGoogleDrive(fullFile);

      return NextResponse.json({
        success: true,
        path: result.url,
        url: result.url,
        pathname: result.id,
        fileId: result.id,
        name: result.name,
      });
    }

    return NextResponse.json({
      success: true,
      progress: Math.round((pending.chunks.size / totalChunks) * 100),
    });
  } catch (err) {
    console.error("Chunk Upload Error:", err);
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : "Chunk upload failed",
      },
      { status: 500 }
    );
  }
}
