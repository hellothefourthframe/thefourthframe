export function uploadFile(
  file: File,
  type: "image" | "video",
  handleUploadUrl: string = "/api/upload",
  onProgress?: (ratio: number) => void
): Promise<{ success: boolean; path: string; pathname: string }> {
  // 3 MB chunk size to stay safely under Vercel's 4.5MB request payload limit
  const CHUNK_SIZE = 3 * 1024 * 1024;

  if (file.size > CHUNK_SIZE) {
    return uploadFileInChunks(file, handleUploadUrl, onProgress);
  }

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const formData = new FormData();
    formData.append("file", file);
    formData.append("type", type);

    if (onProgress && xhr.upload) {
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable && event.total > 0) {
          onProgress(event.loaded / event.total);
        }
      };
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const data = JSON.parse(xhr.responseText);
          if (data.success && (data.path || data.url)) {
            resolve({
              success: true,
              path: data.path || data.url,
              pathname: data.pathname || data.fileId || "",
            });
          } else {
            reject(new Error(data.error || "Upload failed"));
          }
        } catch {
          reject(new Error("Invalid server response"));
        }
      } else {
        try {
          const data = JSON.parse(xhr.responseText);
          reject(new Error(data.error || `Upload failed with status ${xhr.status}`));
        } catch {
          reject(new Error(`Upload failed with status ${xhr.status}`));
        }
      }
    };

    xhr.onerror = () => reject(new Error("Network error during file upload"));
    xhr.open("POST", handleUploadUrl, true);
    xhr.send(formData);
  });
}

async function uploadFileInChunks(
  file: File,
  handleUploadUrl: string,
  onProgress?: (ratio: number) => void
): Promise<{ success: boolean; path: string; pathname: string }> {
  const CHUNK_SIZE = 3 * 1024 * 1024;
  const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
  const uploadId = `upload_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

  // Determine chunk endpoint based on whether this is an admin upload or public upload
  const chunkEndpoint = handleUploadUrl.includes("/admin")
    ? "/api/admin/upload-chunk"
    : "/api/upload-chunk";

  for (let i = 0; i < totalChunks; i++) {
    const start = i * CHUNK_SIZE;
    const end = Math.min(file.size, start + CHUNK_SIZE);
    const chunk = file.slice(start, end);

    const formData = new FormData();
    formData.append("chunk", chunk, file.name);
    formData.append("uploadId", uploadId);
    formData.append("chunkIndex", i.toString());
    formData.append("totalChunks", totalChunks.toString());
    formData.append("fileName", file.name);
    formData.append("fileType", file.type || "application/octet-stream");

    const res = await fetch(chunkEndpoint, {
      method: "POST",
      body: formData,
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(
        errData.error || `Chunk upload failed (${res.status}): chunk ${i + 1}/${totalChunks}`
      );
    }

    const data = await res.json();

    if (onProgress) {
      onProgress((i + 1) / totalChunks);
    }

    if (i === totalChunks - 1) {
      if (data.success && (data.path || data.url)) {
        return {
          success: true,
          path: data.path || data.url,
          pathname: data.pathname || data.fileId || "",
        };
      } else {
        throw new Error(data.error || "Failed to assemble uploaded file chunks");
      }
    }
  }

  throw new Error("Upload did not complete");
}