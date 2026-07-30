export function uploadFile(
  file: File,
  type: "image" | "video",
  handleUploadUrl: string = "/api/upload",
  onProgress?: (ratio: number) => void
): Promise<{ success: boolean; path: string; pathname: string }> {
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