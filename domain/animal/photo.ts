import * as z from "zod";

export const acceptedPhotoMimeTypes = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export const maxPhotosPerAnimal = 8;

export const maxUploadBytes = 4_500_000;

export const photoFormat = "webp";

export const photoQuality = 75;

export const photoVariants = {
  card: { height: 480, width: 640 },
  full: { height: 1200, width: 1600 },
} as const;

export const uploadPhotoInput = z.object({
  alt: z
    .string()
    .trim()
    .min(1, { error: "Descreva a foto para acessibilidade." })
    .max(160, { error: "A descrição pode ter no máximo 160 caracteres." }),
});

export type PhotoVariant = keyof typeof photoVariants;

export type UploadPhotoFields = z.infer<typeof uploadPhotoInput>;
