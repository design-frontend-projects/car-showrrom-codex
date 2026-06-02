import type { Request, Response } from 'express';
import { createReadStream } from 'node:fs';
import { mkdir, stat, unlink, writeFile } from 'node:fs/promises';
import { extname, join, normalize, resolve } from 'node:path';
import { randomUUID } from 'node:crypto';
import multer from 'multer';
import { prisma } from '../db/prisma';
import { showroomConfig } from './config';
import { ShowroomHttpError } from './errors';

export const listingImageUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: showroomConfig.maxImageBytes,
    files: 1,
  },
});

export interface AcceptedImageFile {
  storageKey: string;
  originalName: string;
  mimeType: string;
  byteSize: number;
}

export async function storeListingImageFile(file: Express.Multer.File): Promise<AcceptedImageFile> {
  validateImageFile(file);

  const extension = normalizeExtension(extname(file.originalname));
  const storageKey = `${randomUUID()}${extension}`;
  const uploadDir = resolve(showroomConfig.uploadRoot, 'listings');
  const targetPath = resolve(uploadDir, storageKey);

  if (!targetPath.startsWith(`${uploadDir}${process.platform === 'win32' ? '\\' : '/'}`)) {
    throw new ShowroomHttpError(400, 'showroom.error.invalidMediaPath');
  }

  await mkdir(uploadDir, { recursive: true });
  await writeFile(targetPath, file.buffer);

  return {
    storageKey,
    originalName: file.originalname,
    mimeType: file.mimetype,
    byteSize: file.size,
  };
}

export async function deleteStoredListingImage(storageKey: string): Promise<void> {
  const path = resolveMediaPath(storageKey);

  try {
    await unlink(path);
  } catch {
    // Metadata delete is authoritative; missing local files should not break cleanup.
  }
}

export async function serveListingImage(request: Request, response: Response): Promise<void> {
  const storageKey = request.params['storageKey'];

  if (typeof storageKey !== 'string' || !isSafeStorageKey(storageKey)) {
    throw new ShowroomHttpError(404, 'showroom.error.mediaNotFound');
  }

  const image = await prisma.carListingImage.findUnique({
    where: {
      storageKey,
    },
  });

  if (!image) {
    throw new ShowroomHttpError(404, 'showroom.error.mediaNotFound');
  }

  const listing = await prisma.carListing.findUnique({
    where: {
      tenantId_id: {
        tenantId: image.tenantId,
        id: image.listingId,
      },
    },
    select: {
      status: true,
    },
  });

  if (listing?.status !== 'ACTIVE') {
    throw new ShowroomHttpError(404, 'showroom.error.mediaNotFound');
  }

  const path = resolveMediaPath(storageKey);
  try {
    await stat(path);
  } catch {
    throw new ShowroomHttpError(404, 'showroom.error.mediaNotFound');
  }

  response.type(image.mimeType);
  createReadStream(path).pipe(response);
}

function validateImageFile(file: Express.Multer.File): void {
  const extension = normalizeExtension(extname(file.originalname));

  if (!showroomConfig.allowedImageExtensions.includes(extension)) {
    throw new ShowroomHttpError(400, 'showroom.error.invalidImageType', {
      image: 'showroom.error.invalidImageType',
    });
  }

  if (!showroomConfig.allowedImageMimeTypes.includes(file.mimetype)) {
    throw new ShowroomHttpError(400, 'showroom.error.invalidImageType', {
      image: 'showroom.error.invalidImageType',
    });
  }

  if (file.size > showroomConfig.maxImageBytes) {
    throw new ShowroomHttpError(400, 'showroom.error.imageTooLarge', {
      image: 'showroom.error.imageTooLarge',
    });
  }

  if (!hasValidSignature(file.buffer, file.mimetype)) {
    throw new ShowroomHttpError(400, 'showroom.error.invalidImageSignature', {
      image: 'showroom.error.invalidImageSignature',
    });
  }
}

function hasValidSignature(buffer: Buffer, mimeType: string): boolean {
  if (mimeType === 'image/jpeg') {
    return buffer.length > 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  }

  if (mimeType === 'image/png') {
    return buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  }

  if (mimeType === 'image/webp') {
    return buffer.subarray(0, 4).toString('ascii') === 'RIFF' && buffer.subarray(8, 12).toString('ascii') === 'WEBP';
  }

  return false;
}

function resolveMediaPath(storageKey: string): string {
  if (!isSafeStorageKey(storageKey)) {
    throw new ShowroomHttpError(404, 'showroom.error.mediaNotFound');
  }

  const uploadDir = resolve(showroomConfig.uploadRoot, 'listings');
  const path = resolve(uploadDir, storageKey);
  const normalized = normalize(path);

  if (!normalized.startsWith(`${uploadDir}${process.platform === 'win32' ? '\\' : '/'}`)) {
    throw new ShowroomHttpError(404, 'showroom.error.mediaNotFound');
  }

  return normalized;
}

function isSafeStorageKey(storageKey: string): boolean {
  return /^[a-f0-9-]+\.(jpg|jpeg|png|webp)$/i.test(storageKey);
}

function normalizeExtension(extension: string): '.jpg' | '.jpeg' | '.png' | '.webp' {
  const normalizedExtension = extension.toLowerCase();

  if (showroomConfig.allowedImageExtensions.includes(normalizedExtension)) {
    return normalizedExtension as '.jpg' | '.jpeg' | '.png' | '.webp';
  }

  return '.jpg';
}
