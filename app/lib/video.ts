export const MAX_ADMIN_VIDEO_BYTES = 50 * 1024 * 1024;
export const MAX_PUBLIC_VIDEO_BYTES = 20 * 1024 * 1024;

export const ALLOWED_VIDEO_MIME_TYPES = [
  "video/mp4",
  "video/webm",
  "video/quicktime",
  "video/x-msvideo",
  "video/ogg",
] as const;

export const VIDEO_FILE_ACCEPT =
  "video/mp4,video/webm,video/quicktime,video/x-msvideo,video/ogg,.mp4,.webm,.mov,.avi,.ogv";

const mimeByExtension: Record<string, string> = {
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".mov": "video/quicktime",
  ".avi": "video/x-msvideo",
  ".ogv": "video/ogg",
  ".ogg": "video/ogg",
};

export function isAllowedVideoType(mimeType: string) {
  return ALLOWED_VIDEO_MIME_TYPES.includes(
    mimeType as (typeof ALLOWED_VIDEO_MIME_TYPES)[number]
  );
}

export function getVideoMimeType(source: string) {
  const cleanSource = source.split("?")[0]?.toLowerCase() ?? "";
  const extension = cleanSource.match(/\.[a-z0-9]+$/)?.[0];
  return extension ? mimeByExtension[extension] ?? "video/mp4" : "video/mp4";
}

export function formatMaxVideoSize(bytes: number) {
  return `${Math.round(bytes / (1024 * 1024))}MB`;
}

export function isVideoUrl(url: string | null | undefined): boolean {
  if (!url || typeof url !== "string") return false;
  const cleanUrl = url.trim().toLowerCase();
  if (!cleanUrl) return false;

  if (cleanUrl.includes("/api/drive-file/")) return true;
  if (/\.(mp4|webm|mov|avi|ogv|ogg|m4v|mkv|3gp)(\?.*)?$/i.test(cleanUrl)) return true;
  if (cleanUrl.startsWith("blob:") || cleanUrl.startsWith("data:video/")) return true;

  return false;
}

export function isImageUrl(url: string | null | undefined): boolean {
  if (!url || typeof url !== "string") return false;
  const cleanUrl = url.trim().toLowerCase();
  if (!cleanUrl) return false;

  if (cleanUrl.includes("googleusercontent.com/d/")) return true;
  if (/\.(jpg|jpeg|png|gif|webp|svg|avif|bmp|tiff)(\?.*)?$/i.test(cleanUrl)) return true;
  if (cleanUrl.startsWith("data:image/")) return true;

  return !isVideoUrl(url);
}

export function formatMediaUrl(url: string | null | undefined): string {
  if (!url) return "";

  // Convert Google Drive video URLs to our high-performance HTTP range streaming proxy
  if (url.includes("drive.google.com") || url.includes("googleusercontent.com")) {
    let fileId = url;
    if (url.includes("/d/")) {
      fileId = url.split("/d/")[1]?.split("/")[0]?.split("?")[0] || url;
    } else if (url.includes("id=")) {
      fileId = url.match(/id=([^&]+)/)?.[1] || url;
    }

    if (fileId && !fileId.startsWith("http")) {
      return `/api/drive-file/${fileId}`;
    }
  }

  return url;
}

export function formatImageUrl(url: string | null | undefined): string {
  if (!url) return "";

  if (url.includes("drive.google.com") || url.includes("googleusercontent.com")) {
    let fileId = url;
    if (url.includes("/d/")) {
      fileId = url.split("/d/")[1]?.split("/")[0]?.split("?")[0] || url;
    } else if (url.includes("id=")) {
      fileId = url.match(/id=([^&]+)/)?.[1] || url;
    }

    if (fileId && !fileId.startsWith("http")) {
      return `https://lh3.googleusercontent.com/d/${fileId}`;
    }
  }

  return url;
}

