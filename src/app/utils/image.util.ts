export interface ImageDimensions {
  width: number;
  height: number;
}

export function buildImageAlt(make: string, model: string, year?: number): string {
  return [year, make, model].filter(Boolean).join(' ');
}

export function isSupportedImageType(type: string): boolean {
  return ['image/jpeg', 'image/png', 'image/webp', 'image/avif'].includes(type);
}

export function aspectRatio({ width, height }: ImageDimensions): string {
  return height === 0 ? '1 / 1' : `${width} / ${height}`;
}
