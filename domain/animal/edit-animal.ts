import type { RegisterAnimalInput } from "@/domain/animal/animal";

export type EditAnimalInput = RegisterAnimalInput;

export type EditAnimalData = EditAnimalInput;

export function editAnimal(input: EditAnimalInput): EditAnimalData {
  return { ...input };
}
