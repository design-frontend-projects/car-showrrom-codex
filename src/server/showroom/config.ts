import { join } from 'node:path';

const DEFAULT_MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const DEFAULT_MAX_IMAGES_PER_LISTING = 12;

export const showroomConfig = {
  uploadRoot: process.env['UPLOAD_ROOT'] ?? join(process.cwd(), '.data', 'uploads'),
  maxImageBytes: readPositiveInt(process.env['SHOWROOM_MAX_IMAGE_BYTES'], DEFAULT_MAX_IMAGE_BYTES),
  maxImagesPerListing: readPositiveInt(
    process.env['SHOWROOM_MAX_IMAGES_PER_LISTING'],
    DEFAULT_MAX_IMAGES_PER_LISTING,
  ),
  mediaUrlBase: process.env['SHOWROOM_MEDIA_URL_BASE'] ?? '/media/listings',
  allowedImageMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
  allowedImageExtensions: ['.jpg', '.jpeg', '.png', '.webp'],
};

function readPositiveInt(value: string | undefined, fallback: number): number {
  if (!value) {
    return fallback;
  }

  const parsed = Number.parseInt(value, 10);

  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}
