
import sharp, { type Sharp, type Metadata } from "sharp";

export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
export const SERPAPI_MAX_BYTES = 500 * 1024;

const ACCEPTED_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export class ImageValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ImageValidationError";
  }
}

export async function validateAndPrepareImage(file: File): Promise<Buffer> {
  if (!file || file.size === 0) {
    throw new ImageValidationError(
      "Choose an image before starting your search."
    );
  }

  if (file.size > MAX_UPLOAD_BYTES) {
    throw new ImageValidationError(
      "This image is larger than 10 MB. Choose a smaller image."
    );
  }

  if (!ACCEPTED_MIME_TYPES.has(file.type)) {
    throw new ImageValidationError(
      "Unsupported format. Upload a JPG, PNG, or WEBP image."
    );
  }

  const input = Buffer.from(await file.arrayBuffer());

  let pipeline: Sharp;
  let metadata: Metadata;

  try {
    pipeline = sharp(input, {
      failOn: "error",
      limitInputPixels: 40_000_000,
    });

    metadata = await pipeline.metadata();
  } catch {
    throw new ImageValidationError(
      "The uploaded file is not a valid image. Try another file."
    );
  }

  const allowedFormats = new Set(["jpeg", "png", "webp"]);

  if (!metadata.format || !allowedFormats.has(metadata.format)) {
    throw new ImageValidationError(
      "Unsupported image content. Upload a JPG, PNG, or WEBP image."
    );
  }

  // Normalize to JPEG and progressively reduce dimensions/quality
  // so the provider receives an image within its 500 KB limit.
  const base = sharp(input, {
    failOn: "error",
    limitInputPixels: 40_000_000,
  })
    .rotate()
    .resize({
      width: 1600,
      height: 1600,
      fit: "inside",
      withoutEnlargement: true,
    });

  for (const quality of [82, 74, 66, 58, 50, 42]) {
    const output = await base
      .clone()
      .jpeg({ quality, mozjpeg: true })
      .toBuffer();

    if (output.byteLength <= SERPAPI_MAX_BYTES) {
      return output;
    }
  }

  const smaller = await sharp(input, {
    failOn: "error",
    limitInputPixels: 40_000_000,
  })
    .rotate()
    .resize({
      width: 900,
      height: 900,
      fit: "inside",
      withoutEnlargement: true,
    })
    .jpeg({ quality: 38, mozjpeg: true })
    .toBuffer();

  if (smaller.byteLength > SERPAPI_MAX_BYTES) {
    throw new ImageValidationError(
      "This image could not be compressed enough for reverse search. Try a smaller or simpler image."
    );
  }

  return smaller;
}
