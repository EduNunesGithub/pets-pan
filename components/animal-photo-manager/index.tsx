"use client";

import { useMutation } from "@tanstack/react-query";
import Image from "next/image";
import { useRouter } from "next/navigation";

import {
  removeAnimalPhotoAction,
  setAnimalCoverAction,
} from "@/app/(workspace)/animals/[id]/edit/actions";
import { PhotoUploadForm } from "@/components/animal-photo-manager/upload-form";
import { maxPhotosPerAnimal } from "@/domain/animal/photo";

import type { AnimalPhoto } from "@/db/schema/animal-photos";

async function unwrap(result: { error: string } | undefined): Promise<void> {
  if (result?.error) {
    throw new Error(result.error);
  }
}

export function AnimalPhotoManager({
  animalId,
  photos,
}: {
  animalId: string;
  photos: AnimalPhoto[];
}) {
  const router = useRouter();

  const setCover = useMutation({
    mutationFn: async (photoId: string) => {
      await unwrap(await setAnimalCoverAction(photoId));
    },
    onError: (error) => console.error(error),
    onSuccess: () => router.refresh(),
  });

  const remove = useMutation({
    mutationFn: async (photoId: string) => {
      await unwrap(await removeAnimalPhotoAction(photoId));
    },
    onError: (error) => console.error(error),
    onSuccess: () => router.refresh(),
  });

  const atLimit = photos.length >= maxPhotosPerAnimal;
  const busy = setCover.isPending || remove.isPending;

  return (
    <section className="flex flex-col gap-item">
      <header className="flex flex-col gap-pair">
        <span className="eyebrow text-muted">Fotos</span>

        <p className="text-sm text-muted">
          {photos.length} de {maxPhotosPerAnimal}. A capa aparece primeiro no
          marketplace.
        </p>
      </header>

      {photos.length > 0 ? (
        <ul className="grid grid-cols-2 gap-item sm:grid-cols-3">
          {photos.map((photo) => (
            <li
              className="flex flex-col gap-pair rounded-md border border-line p-item"
              key={photo.id}
            >
              <div className="relative aspect-4/3 w-full overflow-hidden rounded-sm">
                <Image
                  alt={photo.alt}
                  className="object-cover"
                  fill
                  sizes="(min-width: 640px) 33vw, 50vw"
                  src={photo.cardUrl}
                />
              </div>

              <div className="flex items-center justify-between gap-pair">
                {photo.isCover ? (
                  <span className="eyebrow text-pine">Capa</span>
                ) : (
                  <button
                    className="text-sm text-muted underline-offset-2 hover:underline disabled:opacity-60"
                    disabled={busy}
                    onClick={() => setCover.mutate(photo.id)}
                    type="button"
                  >
                    Definir capa
                  </button>
                )}

                <button
                  className="text-sm text-danger underline-offset-2 hover:underline disabled:opacity-60"
                  disabled={busy}
                  onClick={() => remove.mutate(photo.id)}
                  type="button"
                >
                  Remover
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : null}

      {atLimit ? null : <PhotoUploadForm animalId={animalId} />}
    </section>
  );
}
