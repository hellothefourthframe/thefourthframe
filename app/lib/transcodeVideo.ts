import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile, toBlobURL } from "@ffmpeg/util";

let ffmpegInstance: FFmpeg | null = null;

async function getFFmpeg() {
  if (ffmpegInstance) return ffmpegInstance;

  const ffmpeg = new FFmpeg();
  const baseURL = "https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd";

  await ffmpeg.load({
    coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, "text/javascript"),
    wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, "application/wasm"),
  });

  ffmpegInstance = ffmpeg;
  return ffmpeg;
}

/**
 * Converts any video file into browser-safe H.264 + AAC mp4.
 * Falls back to the original file if transcoding fails.
 */
export async function transcodeToH264(
  file: File,
  onProgress?: (ratio: number) => void
): Promise<File> {
  try {
    const ffmpeg = await getFFmpeg();

    if (onProgress) {
      ffmpeg.on("progress", ({ progress }) => onProgress(progress));
    }

    const inputName = "input" + (file.name.match(/\.[a-z0-9]+$/i)?.[0] || ".mp4");
    const outputName = "output.mp4";

    await ffmpeg.writeFile(inputName, await fetchFile(file));

    await ffmpeg.exec([
      "-i", inputName,
      "-c:v", "libx264",
      "-profile:v", "main",
      "-pix_fmt", "yuv420p",
      "-preset", "veryfast",
      "-crf", "26",
      "-c:a", "aac",
      "-movflags", "+faststart",
      outputName,
    ]);

    const data = await ffmpeg.readFile(outputName);

// Ensure it's backed by a plain ArrayBuffer (fixes BlobPart type error)
const uint8Data = new Uint8Array(data as Uint8Array);
const blob = new Blob([uint8Data], { type: "video/mp4" });

return new File([blob], file.name.replace(/\.[a-z0-9]+$/i, ".mp4"), {
  type: "video/mp4",
});
  } catch (err) {
    console.error("Transcode failed, using original file:", err);
    return file; // fallback: original file hi upload ho jayegi
  }
}