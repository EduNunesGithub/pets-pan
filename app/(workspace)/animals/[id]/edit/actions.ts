"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import * as z from "zod";

import {
  deleteAnimalPhotoBlobs,
  processAndUploadPhoto,
} from "@/app/(workspace)/animals/photos";
import { animalPhotos } from "@/db/schema/animal-photos";
import { animals } from "@/db/schema/animals";
import { registerAnimalInput } from "@/domain/animal/animal";
import { editAnimal } from "@/domain/animal/edit-animal";
import {
  maxPhotosPerAnimal,
  maxUploadBytes,
  uploadPhotoInput,
} from "@/domain/animal/photo";
import { db, requireActiveOrganization } from "@/server";

import type { RegisterAnimalFields } from "@/domain/animal/animal";

type ActionResult = { error: string } | undefined;

async function requireOwnedAnimal(
  animalId: string,
  organizationId: string,
): Promise<boolean> {
  const parsedId = z.uuid().safeParse(animalId);

  if (!parsedId.success) {
    return false;
  }

  const owned = await db.query.animals.findFirst({
    columns: { id: true },
    where: { id: parsedId.data, organizationId },
  });

  return Boolean(owned);
}

export async function editAnimalAction(
  id: string,
  fields: RegisterAnimalFields,
): Promise<ActionResult> {
  const organizationId = await requireActiveOrganization();

  if (!(await requireOwnedAnimal(id, organizationId))) {
    return { error: "Animal não encontrado." };
  }

  const parsed = registerAnimalInput.safeParse(fields);

  if (!parsed.success) {
    return { error: "Confira os campos do formulário e tente novamente." };
  }

  const data = editAnimal(parsed.data);

  await db
    .update(animals)
    .set(data)
    .where(and(eq(animals.id, id), eq(animals.organizationId, organizationId)));

  revalidatePath(`/animals/${id}`);
  revalidatePath(`/animals/${id}/edit`);

  return undefined;
}

export async function removeAnimalPhotoAction(
  photoId: string,
): Promise<ActionResult> {
  const organizationId = await requireActiveOrganization();

  const parsedId = z.uuid().safeParse(photoId);

  if (!parsedId.success) {
    return { error: "Foto não encontrada." };
  }

  const photo = await db.query.animalPhotos.findFirst({
    where: { animal: { organizationId }, id: parsedId.data },
  });

  if (!photo) {
    return { error: "Foto não encontrada." };
  }

  await db.transaction(async (tx) => {
    await tx.delete(animalPhotos).where(eq(animalPhotos.id, photo.id));

    if (photo.isCover) {
      const next = await tx.query.animalPhotos.findFirst({
        columns: { id: true },
        orderBy: { createdAt: "asc", position: "asc" },
        where: { animalId: photo.animalId },
      });

      if (next) {
        await tx
          .update(animalPhotos)
          .set({ isCover: true })
          .where(eq(animalPhotos.id, next.id));
      }
    }
  });

  await deleteAnimalPhotoBlobs([photo.cardPathname, photo.fullPathname]);

  revalidatePath(`/animals/${photo.animalId}`);
  revalidatePath(`/animals/${photo.animalId}/edit`);

  return undefined;
}

export async function setAnimalCoverAction(
  photoId: string,
): Promise<ActionResult> {
  const organizationId = await requireActiveOrganization();

  const parsedId = z.uuid().safeParse(photoId);

  if (!parsedId.success) {
    return { error: "Foto não encontrada." };
  }

  const photo = await db.query.animalPhotos.findFirst({
    columns: { animalId: true, id: true },
    where: { animal: { organizationId }, id: parsedId.data },
  });

  if (!photo) {
    return { error: "Foto não encontrada." };
  }

  await db.transaction(async (tx) => {
    await tx
      .update(animalPhotos)
      .set({ isCover: false })
      .where(
        and(
          eq(animalPhotos.animalId, photo.animalId),
          eq(animalPhotos.isCover, true),
        ),
      );

    await tx
      .update(animalPhotos)
      .set({ isCover: true })
      .where(eq(animalPhotos.id, photo.id));
  });

  revalidatePath(`/animals/${photo.animalId}`);
  revalidatePath(`/animals/${photo.animalId}/edit`);

  return undefined;
}

export async function uploadAnimalPhotoAction(
  animalId: string,
  formData: FormData,
): Promise<ActionResult> {
  const organizationId = await requireActiveOrganization();

  if (!(await requireOwnedAnimal(animalId, organizationId))) {
    return { error: "Animal não encontrado." };
  }

  const file = formData.get("file");

  if (!(file instanceof File) || file.size === 0) {
    return { error: "Selecione uma imagem." };
  }

  if (file.size > maxUploadBytes) {
    return {
      error: "A imagem é muito grande. Reduza o tamanho e tente novamente.",
    };
  }

  const parsedAlt = uploadPhotoInput.safeParse({ alt: formData.get("alt") });

  if (!parsedAlt.success) {
    return {
      error: parsedAlt.error.issues[0]?.message ?? "Descrição inválida.",
    };
  }

  const existing = await db.query.animalPhotos.findMany({
    columns: { position: true },
    where: { animalId },
  });

  if (existing.length >= maxPhotosPerAnimal) {
    return {
      error: `Cada animal pode ter no máximo ${maxPhotosPerAnimal} fotos.`,
    };
  }

  const processed = await processAndUploadPhoto(file, {
    animalId,
    organizationId,
  });

  try {
    const nextPosition = existing.reduce(
      (max, photo) => Math.max(max, photo.position + 1),
      0,
    );

    await db.insert(animalPhotos).values({
      ...processed,
      alt: parsedAlt.data.alt,
      animalId,
      isCover: existing.length === 0,
      position: nextPosition,
    });
  } catch (error) {
    await deleteAnimalPhotoBlobs([
      processed.cardPathname,
      processed.fullPathname,
    ]);

    throw error;
  }

  revalidatePath(`/animals/${animalId}`);
  revalidatePath(`/animals/${animalId}/edit`);

  return undefined;
}
