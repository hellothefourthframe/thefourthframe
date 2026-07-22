// import { NextResponse } from "next/server";
// import { writeFile, unlink, mkdir } from "fs/promises";
// import { existsSync } from "fs";
// import path from "path";
// import { getAdminFromCookies } from "@/app/lib/auth";

// const PUBLIC_DIR = path.join(process.cwd(), "public");
// const UPLOAD_DIR = path.join(PUBLIC_DIR, "uploads");

// const imageExtensions: Record<string, string> = {
//   "image/jpeg": ".jpg",
//   "image/jpg": ".jpg",
//   "image/png": ".png",
//   "image/webp": ".webp",
// };

// // Ensure upload directory exists
// async function ensureUploadDir() {
//   if (!existsSync(UPLOAD_DIR)) {
//     await mkdir(UPLOAD_DIR, { recursive: true });
//     console.log("Upload directory created:", UPLOAD_DIR);
//   }
// }

// // POST — Upload a file (admin only)
// export async function POST(request: Request) {
//   try {
//     const admin = await getAdminFromCookies();
//     if (!admin) {
//       return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
//     }

//     // Create upload folder if it doesn't exist
//     await ensureUploadDir();

//     const formData = await request.formData();
//     const file = formData.get("file") as File | null;
//     const type = formData.get("type") as string | null;

//     if (!file) {
//       return NextResponse.json(
//         { error: "No file provided" },
//         { status: 400 }
//       );
//     }

//     // Validate file type
//     if (type === "image") {
//       if (!imageExtensions[file.type]) {
//         return NextResponse.json(
//           { error: "Only JPG, PNG, or WEBP images are allowed" },
//           { status: 400 }
//         );
//       }
//     } else if (type === "video") {
//       if (file.type !== "video/mp4") {
//         return NextResponse.json(
//           { error: "Only MP4 videos are allowed" },
//           { status: 400 }
//         );
//       }
//     } else {
//       return NextResponse.json(
//         { error: "Invalid file type. Must be 'image' or 'video'" },
//         { status: 400 }
//       );
//     }

//     // Generate unique filename
//     const ext = type === "image" ? imageExtensions[file.type] : ".mp4";
//     const uniqueName = `${Date.now()}-${Math.random()
//       .toString(36)
//       .slice(2, 8)}${ext}`;

//     const filePath = path.join(UPLOAD_DIR, uniqueName);

//     // Save file
//     const bytes = await file.arrayBuffer();
//     const buffer = Buffer.from(bytes);

//     await writeFile(filePath, buffer);

//     return NextResponse.json({
//       success: true,
//       path: `/uploads/${uniqueName}`,
//     });
//   } catch (error) {
//     console.error("Upload error:", error);

//     return NextResponse.json(
//       { error: "Internal server error" },
//       { status: 500 }
//     );
//   }
// }

// // DELETE — Remove an uploaded file (admin only)
// export async function DELETE(request: Request) {
//   try {
//     const admin = await getAdminFromCookies();
//     if (!admin) {
//       return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
//     }

//     const { filePath } = await request.json();

//     if (!filePath || !filePath.startsWith("/uploads/")) {
//       return NextResponse.json(
//         { error: "Invalid file path" },
//         { status: 400 }
//       );
//     }

//     const fullPath = path.join(PUBLIC_DIR, filePath);

//     if (existsSync(fullPath)) {
//       await unlink(fullPath);
//     }

//     return NextResponse.json({ success: true });
//   } catch (error) {
//     console.error("Delete file error:", error);

//     return NextResponse.json(
//       { error: "Internal server error" },
//       { status: 500 }
//     );
//   }
// }


import { NextResponse } from "next/server";
import { put, del } from "@vercel/blob";
import { existsSync } from "fs";
import { unlink } from "fs/promises";
import path from "path";
import { getAdminFromCookies } from "@/app/lib/auth";

const PUBLIC_DIR = path.join(process.cwd(), "public");
const UPLOAD_DIR = path.join(PUBLIC_DIR, "uploads");

const imageExtensions: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/jpg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};

function isLocalUploadPath(filePath: string) {
  return filePath.startsWith("/uploads/") && !filePath.includes("..");
}

function isBlobUrl(filePath: string) {
  try {
    const url = new URL(filePath);
    return url.protocol === "https:" && url.hostname.endsWith(".public.blob.vercel-storage.com");
  } catch {
    return false;
  }
}

function isBlobPathname(filePath: string) {
  return Boolean(filePath) && !filePath.startsWith("/") && !filePath.includes("://") && !filePath.includes("..");
}

async function deleteLocalUpload(filePath: string) {
  const relativePath = filePath.split("/").filter(Boolean).slice(1);
  const fullPath = path.resolve(UPLOAD_DIR, ...relativePath);

  if (!fullPath.startsWith(UPLOAD_DIR + path.sep)) {
    throw new Error("Invalid file path");
  }

  if (existsSync(fullPath)) {
    await unlink(fullPath);
  }
}

// POST — Upload a file (admin only)
export async function POST(request: Request) {
  try {
    const admin = await getAdminFromCookies();

    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();

    const file = formData.get("file") as File | null;
    const type = formData.get("type") as string | null;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    // Validate file type
    if (type === "image") {
      if (!imageExtensions[file.type]) {
        return NextResponse.json(
          { error: "Only JPG, PNG or WEBP images are allowed" },
          { status: 400 }
        );
      }
    } else if (type === "video") {
      if (file.type !== "video/mp4") {
        return NextResponse.json(
          { error: "Only MP4 videos are allowed" },
          { status: 400 }
        );
      }
    } else {
      return NextResponse.json(
        { error: "Invalid file type. Must be 'image' or 'video'" },
        { status: 400 }
      );
    }

    // Generate unique filename
    const ext = type === "image" ? imageExtensions[file.type] : ".mp4";

    const uniqueName = `${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 8)}${ext}`;

    // Upload to Vercel Blob
    const blob = await put(uniqueName, file, {
      access: "public",
      addRandomSuffix: false,
    });

    return NextResponse.json({
      success: true,
      path: blob.url,
      pathname: blob.pathname,
    });
  } catch (error) {
    console.error("Upload error:", error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}

// DELETE — Remove uploaded file (admin only)
export async function DELETE(request: Request) {
  try {
    const admin = await getAdminFromCookies();

    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { filePath, pathname } = (await request.json()) as {
      filePath?: string;
      pathname?: string;
    };
    const deleteTarget = filePath || pathname;

    if (!deleteTarget) {
      return NextResponse.json(
        { error: "File path is required" },
        { status: 400 }
      );
    }

    if (isLocalUploadPath(deleteTarget)) {
      await deleteLocalUpload(deleteTarget);
    } else if (isBlobUrl(deleteTarget) || isBlobPathname(deleteTarget)) {
      await del(deleteTarget);
    } else {
      return NextResponse.json(
        { error: "Invalid file path" },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete file error:", error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}
