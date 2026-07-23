import { upload } from "@vercel/blob/client";

export async function uploadFile(
  file: File,
  type: "image" | "video",
  handleUploadUrl: string
) {
  const blob = await upload(file.name, file, {
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
