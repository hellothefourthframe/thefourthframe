import { upload } from "@vercel/blob/client";
import { transcodeToH264 } from "./transcodeVideo";

export async function uploadFile(
  file: File,
  type: "image" | "video",
  handleUploadUrl: string,
  onProgress?: (ratio: number) => void
) {
  const finalFile =
    type === "video" ? await transcodeToH264(file, onProgress) : file;

  const blob = await upload(finalFile.name, finalFile, {
    access: "public",
    handleUploadUrl,
    clientPayload: JSON.stringify({ type }),
  });

  return {
    success: true,
    path: blob.url,
    pathname: blob.pathname,
  };
}