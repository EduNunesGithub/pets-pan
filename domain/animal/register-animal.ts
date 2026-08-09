import type { RegisterAnimalInput } from "@/domain/animal/animal";

export type RegisterAnimalData = RegisterAnimalInput & { published: false };

export function registerAnimal(input: RegisterAnimalInput): RegisterAnimalData {
  return { ...input, published: false };
}
