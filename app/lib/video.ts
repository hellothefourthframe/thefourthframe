export const MAX_ADMIN_VIDEO_BYTES = 50 * 1024 * 1024;

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
