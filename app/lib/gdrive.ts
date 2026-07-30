import { google, drive_v3 } from "googleapis";
import { Readable } from "stream";

let cachedFolderId: string | undefined = undefined;

function getDriveClient(): drive_v3.Drive {
  const clientId = process.env.DRIVE_CLIENT_ID;
  const clientSecret = process.env.DRIVE_CLIENT_SECRET;
  const refreshToken = process.env.DRIVE_REFRESH_TOKEN;

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error(
      "Missing Google Drive credentials. Please ensure DRIVE_CLIENT_ID, DRIVE_CLIENT_SECRET, and DRIVE_REFRESH_TOKEN are set in .env"
    );
  }

  const oauth2Client = new google.auth.OAuth2(
    clientId,
    clientSecret,
    "http://localhost:3000/api/auth/callback"
  );

  oauth2Client.setCredentials({
    refresh_token: refreshToken,
  });

  return google.drive({ version: "v3", auth: oauth2Client });
}

async function getTheFourthFrameFolderId(
  drive: drive_v3.Drive,
  explicitFolderId?: string
): Promise<string | undefined> {
  if (explicitFolderId) return explicitFolderId;
  if (cachedFolderId) return cachedFolderId;

  const envValue = process.env.DRIVE_FOLDER_ID?.trim();

  // If env contains an actual Google Drive alphanumeric Folder ID (e.g. 1A2b3C4d5E...)
  if (
    envValue &&
    envValue.length > 15 &&
    !envValue.includes(" ") &&
    envValue.toLowerCase() !== "thefourthframe"
  ) {
    cachedFolderId = envValue;
    return cachedFolderId;
  }

  // If env specifies a folder name like "thefourthframe"
  const folderName = (envValue || "thefourthframe").replace(/'/g, "\\'");

  try {
    // 1. Search for existing folder by name in Google Drive
    const response = await drive.files.list({
      q: `name = '${folderName}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
      fields: "files(id, name)",
      spaces: "drive",
    });

    const files = response.data.files;
    const foundId = files?.[0]?.id;
    if (typeof foundId === "string" && foundId.length > 0) {
      cachedFolderId = foundId;
      console.log(`Resolved env folder '${files?.[0]?.name ?? folderName}' to Google Drive Folder ID: ${cachedFolderId}`);
      return cachedFolderId;
    }

    // 2. If folder doesn't exist yet, create it automatically
    console.log(`Folder '${folderName}' not found, creating it automatically on Google Drive...`);
    const createRes = await drive.files.create({
      requestBody: {
        name: folderName,
        mimeType: "application/vnd.google-apps.folder",
      },
      fields: "id",
    });

    if (createRes.data.id) {
      cachedFolderId = createRes.data.id;
      console.log(`Created Google Drive folder '${folderName}': ID ${cachedFolderId}`);
      return cachedFolderId;
    }
  } catch (err) {
    console.warn(`Folder lookup/create warning for '${folderName}':`, err);
  }

  return undefined;
}

export async function uploadToGoogleDrive(
  file: File,
  folderId?: string
): Promise<{ id: string; url: string; name: string }> {
  const drive = getDriveClient();

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const stream = new Readable();
  stream.push(buffer);
  stream.push(null);

  const fileMetadata: drive_v3.Schema$File = {
    name: file.name || `upload_${Date.now()}`,
  };

  const targetFolder = await getTheFourthFrameFolderId(drive, folderId);
  if (targetFolder) {
    fileMetadata.parents = [targetFolder];
  }

  const media = {
    mimeType: file.type || "application/octet-stream",
    body: stream,
  };

  // Upload raw stream without compression (100% original quality)
  const res = await drive.files.create({
    requestBody: fileMetadata,
    media: media,
    fields: "id, name, webViewLink, webContentLink",
  });

  const fileId = res.data.id;
  if (!fileId) {
    throw new Error("Failed to retrieve file ID from Google Drive");
  }

  // Make the file publicly accessible to anyone with link for viewing
  await drive.permissions.create({
    fileId: fileId,
    requestBody: {
      role: "reader",
      type: "anyone",
    },
  });

  // Direct public viewable URL format for images/videos
  const isVideo =
    file.type?.startsWith("video/") ||
    Boolean(file.name?.match(/\.(mp4|webm|mov|avi|ogv)$/i));

  const publicUrl = isVideo
    ? `/api/drive-file/${fileId}`
    : `https://lh3.googleusercontent.com/d/${fileId}`;

  return {
    id: fileId,
    url: publicUrl,
    name: res.data.name || file.name || `upload_${Date.now()}`,
  };
}

export async function deleteFromGoogleDrive(filePathOrId: string): Promise<boolean> {
  if (!filePathOrId) return true;

  // Handle legacy Vercel Blob URLs gracefully without console noise
  if (filePathOrId.includes("blob.vercel-storage.com")) {
    try {
      const { del } = await import("@vercel/blob");
      if (process.env.BLOB_READ_WRITE_TOKEN) {
        await del(filePathOrId, { token: process.env.BLOB_READ_WRITE_TOKEN });
      }
    } catch {
      // Quietly ignore Vercel Blob cleanup failures
    }
    return true;
  }

  let fileId = filePathOrId;
  if (filePathOrId.includes("googleusercontent.com/d/")) {
    const parts = filePathOrId.split("/d/");
    fileId = parts[1]?.split("?")[0] || filePathOrId;
  } else if (filePathOrId.includes("id=")) {
    const match = filePathOrId.match(/id=([^&]+)/);
    if (match?.[1]) {
      fileId = match[1];
    }
  } else if (filePathOrId.includes("/file/d/")) {
    const match = filePathOrId.match(/\/file\/d\/([^/]+)/);
    if (match?.[1]) {
      fileId = match[1];
    }
  }

  // Skip non-Google Drive URLs quietly to prevent API errors
  if (fileId.startsWith("http://") || fileId.startsWith("https://") || fileId.includes("/")) {
    return true;
  }

  try {
    const drive = getDriveClient();
    await drive.files.delete({ fileId });
    return true;
  } catch {
    // Quietly ignore missing/already deleted files
    return true;
  }
}
