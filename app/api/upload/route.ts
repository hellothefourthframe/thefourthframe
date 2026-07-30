import { NextResponse } from "next/server";
import { uploadToGoogleDrive, deleteFromGoogleDrive } from "@/app/lib/gdrive";

// POST — Public upload to Google Drive (used by model-application submission form)
export async function POST(request: Request) {
  try {
    const formData = await request.formData();

    // Collect all files uploaded under 'file', 'files', 'images', or 'video'
    const fileEntries = [
      ...formData.getAll("file"),
      ...formData.getAll("files"),
      ...formData.getAll("images"),
      ...formData.getAll("video"),
    ];

    const files = fileEntries.filter(
      (item): item is File => item instanceof File && item.size > 0
    );

    if (files.length === 0) {
      return NextResponse.json(
        { success: false, error: "No files uploaded" },
        { status: 400 }
      );
    }

    const uploadedResults = [];
    for (const file of files) {
      const result = await uploadToGoogleDrive(file);
      uploadedResults.push(result);
    }

    if (uploadedResults.length === 1) {
      const first = uploadedResults[0];
      return NextResponse.json({
        success: true,
        path: first.url,
        url: first.url,
        pathname: first.id,
        fileId: first.id,
        name: first.name,
      });
    }

    return NextResponse.json({
      success: true,
      files: uploadedResults.map((r) => ({
        path: r.url,
        url: r.url,
        pathname: r.id,
        fileId: r.id,
        name: r.name,
      })),
      path: uploadedResults[0].url,
    });
  } catch (err) {
    console.error("Google Drive Upload Error:", err);
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : "Upload failed",
      },
      { status: 500 }
    );
  }
}

// DELETE — Remove file from Google Drive
export async function DELETE(request: Request) {
  try {
    const { filePath } = await request.json();
    if (!filePath) {
      return NextResponse.json({ error: "Missing file path or ID" }, { status: 400 });
    }

    await deleteFromGoogleDrive(filePath);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Google Drive Delete Error:", err);
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : "Delete failed",
      },
      { status: 500 }
    );
  }
}
