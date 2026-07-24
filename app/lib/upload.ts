import { upload } from "@vercel/blob/client";

export async function uploadFile(
  file: File,
  type: "image" | "video",
  handleUploadUrl: string,
  onProgress?: (ratio: number) => void
) {
  const blob = await upload(file.name, file, {
    access: "public",
    handleUploadUrl,
    clientPayload: JSON.stringify({ type }),
    onUploadProgress: (progress) => {
      if (onProgress) {
        onProgress(progress.percentage / 100);
      }
    },
  });

  return {
    success: true,
    path: blob.url,
    pathname: blob.pathname,
  };
}