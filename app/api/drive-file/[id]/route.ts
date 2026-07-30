import { NextResponse } from "next/server";
import { google } from "googleapis";

function getDriveClient() {
  const clientId = process.env.DRIVE_CLIENT_ID;
  const clientSecret = process.env.DRIVE_CLIENT_SECRET;
  const refreshToken = process.env.DRIVE_REFRESH_TOKEN;

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error("Missing Google Drive credentials");
  }

  const oauth2Client = new google.auth.OAuth2(
    clientId,
    clientSecret,
    "http://localhost:3000/api/auth/callback"
  );

  oauth2Client.setCredentials({ refresh_token: refreshToken });

  return google.drive({ version: "v3", auth: oauth2Client });
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) {
      return new NextResponse("Missing file ID", { status: 400 });
    }

    const drive = getDriveClient();

    // Fetch file metadata for mimeType and size
    const fileMeta = await drive.files.get({
      fileId: id,
      fields: "id, name, mimeType, size",
    });

    const mimeType = fileMeta.data.mimeType || "video/mp4";
    const fileSize = parseInt(fileMeta.data.size || "0", 10);

    const range = request.headers.get("range");

    if (range && fileSize > 0) {
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunkSize = end - start + 1;

      const gdriveStream = await drive.files.get(
        { fileId: id, alt: "media" },
        {
          responseType: "stream",
          headers: { Range: `bytes=${start}-${end}` },
        }
      );

      const headers = new Headers({
        "Content-Range": `bytes ${start}-${end}/${fileSize}`,
        "Accept-Ranges": "bytes",
        "Content-Length": chunkSize.toString(),
        "Content-Type": mimeType,
        "Cache-Control": "public, max-age=31536000, immutable",
      });

      return new NextResponse(gdriveStream.data as any, {
        status: 206,
        headers,
      });
    }

    // Full video stream
    const gdriveStream = await drive.files.get(
      { fileId: id, alt: "media" },
      { responseType: "stream" }
    );

    const headers = new Headers({
      "Accept-Ranges": "bytes",
      "Content-Type": mimeType,
      "Cache-Control": "public, max-age=31536000, immutable",
    });

    if (fileSize > 0) {
      headers.set("Content-Length", fileSize.toString());
    }

    return new NextResponse(gdriveStream.data as any, {
      status: 200,
      headers,
    });
  } catch (err) {
    console.error("Drive streaming route error:", err);
    return new NextResponse("Failed to stream media from Google Drive", { status: 500 });
  }
}
