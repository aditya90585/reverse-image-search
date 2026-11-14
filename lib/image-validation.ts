import sharp, { type Metadata } from "sharp";

export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
export const SERPAPI_MAX_BYTES = 500 * 1024;

const ACCEPTED_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_INPUT_PIXELS = 40_000_000;

export class ImageValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ImageValidationError";
  }
}

export async function validateAndPrepareImage(file: File): Promise<Buffer> {
  if (!file || file.size === 0) {
    throw new ImageValidationError("Choose an image before starting your search.");
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new ImageValidationError("This image is larger than 10 MB. Choose a smaller image.");
  }
  if (!ACCEPTED_MIME_TYPES.has(file.type)) {
    throw new ImageValidationError("Unsupported format. Upload a JPG, PNG, or WEBP image.");
  }

  const input = Buffer.from(await file.arrayBuffer());

  let metadata: Metadata;
  try {
    metadata = await sharp(input, {
      failOn: "error",
      limitInputPixels: MAX_INPUT_PIXELS,
    }).metadata();
  } catch {
    throw new ImageValidationError("The uploaded file is not a valid image. Try another file.");
  }

  const allowedFormats = new Set(["jpeg", "png", "webp"]);
  if (!metadata.format || !allowedFormats.has(metadata.format)) {
    throw new ImageValidationError("Unsupported image content. Upload a JPG, PNG, or WEBP image.");
  }

  // Avoid aggressively shrinking the image before trying a reasonable JPEG
  // quality. Each attempt starts from the original so quality loss does not
  // accumulate. SerpApi's upload endpoint has a 500 KB image limit.
  const attempts = [
    { size: 2200, quality: 86 },
    { size: 2200, quality: 80 },
    { size: 2000, quality: 78 },
    { size: 1800, quality: 76 },
    { size: 1600, quality: 74 },
    { size: 1400, quality: 70 },
    { size: 1200, quality: 66 },
    { size: 1000, quality: 62 },
    { size: 900, quality: 56 },
    { size: 800, quality: 50 },
  ] as const;

  try {
    for (const attempt of attempts) {
      const output = await sharp(input, {
        failOn: "error",
        limitInputPixels: MAX_INPUT_PIXELS,
      })
        .rotate()
        .resize({
          width: attempt.size,
          height: attempt.size,
          fit: "inside",
          withoutEnlargement: true,
        })
        .jpeg({ quality: attempt.quality, mozjpeg: true })
        .toBuffer();

      if (output.byteLength <= SERPAPI_MAX_BYTES) return output;
    }
  } catch {
    throw new ImageValidationError("The uploaded image could not be processed. Try another JPG, PNG, or WEBP image.");
  }

  throw new ImageValidationError(
    "This image could not be compressed below the search provider's 500 KB limit without excessive quality loss. Try a smaller image or a tighter crop."
  );
}
