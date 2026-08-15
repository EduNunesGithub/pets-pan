import "server-only";

import { del, put } from "@vercel/blob";
import sharp from "sharp";

import {
  acceptedPhotoMimeTypes,
  photoQuality,
  photoVariants,
} from "@/domain/animal/photo";

import type { OrganizationScope } from "@/db/organization-scope";
import type { OutputInfo, Sharp } from "sharp";

type ProcessedPhoto = {
  cardPathname: string;
  cardUrl: string;
  fullHeight: number;
  fullPathname: string;
  fullUrl: string;
  fullWidth: number;
};

const acceptedFormats = new Set(["jpeg", "png", "webp"]);

async function renderVariant(
  source: Sharp,
  variant: { height: number; width: number },
): Promise<{ data: Buffer; info: OutputInfo }> {
  return source
    .clone()
    .resize(variant.width, variant.height, {
      fit: "cover",
      withoutEnlargement: true,
    })
    .webp({ quality: photoQuality })
    .toBuffer({ resolveWithObject: true });
}

export async function deleteAnimalPhotoBlobs(
  pathnames: string[],
): Promise<void> {
  await del(pathnames);
}

export async function processAndUploadPhoto(
  file: File,
  scope: { animalId: string; organizationId: OrganizationScope },
): Promise<ProcessedPhoto> {
  const buffer = Buffer.from(await file.arrayBuffer());

  const source = sharp(buffer, { failOn: "error" }).autoOrient();

  const { format } = await source.metadata();

  if (!format || !acceptedFormats.has(format)) {
    throw new Error("Formato de imagem não suportado.");
  }

  const [card, full] = await Promise.all([
    renderVariant(source, photoVariants.card),
    renderVariant(source, photoVariants.full),
  ]);

  const prefix = `animals/${scope.organizationId}/${scope.animalId}`;

  const [cardBlob, fullBlob] = await Promise.all([
    put(`${prefix}/card.webp`, card.data, {
      access: "public",
      addRandomSuffix: true,
      contentType: "image/webp",
    }),
    put(`${prefix}/full.webp`, full.data, {
      access: "public",
      addRandomSuffix: true,
      contentType: "image/webp",
    }),
  ]);

  return {
    cardPathname: cardBlob.pathname,
    cardUrl: cardBlob.url,
    fullHeight: full.info.height,
    fullPathname: fullBlob.pathname,
    fullUrl: fullBlob.url,
    fullWidth: full.info.width,
  };
}

export function isAcceptedPhotoType(type: string): boolean {
  return (acceptedPhotoMimeTypes as readonly string[]).includes(type);
}
