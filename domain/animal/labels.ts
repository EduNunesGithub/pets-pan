import type { AgeGroup, Sex, Size, Species } from "@/domain/animal/animal";

export const ageGroupOptions: readonly { label: string; value: AgeGroup }[] = [
  /* order: crescente por faixa etária */
  { label: "Filhote", value: "baby" },
  { label: "Adulto", value: "adult" },
  { label: "Idoso", value: "senior" },
];

export const sexOptions: readonly { label: string; value: Sex }[] = [
  { label: "Fêmea", value: "female" },
  { label: "Macho", value: "male" },
];

export const sizeOptions: readonly { label: string; value: Size }[] = [
  /* order: crescente por porte */
  { label: "Pequeno", value: "small" },
  { label: "Médio", value: "medium" },
  { label: "Grande", value: "large" },
];

export const speciesOptions: readonly { label: string; value: Species }[] = [
  /* order: espécies mais comuns primeiro */
  { label: "Cão", value: "dog" },
  { label: "Gato", value: "cat" },
  { label: "Outro", value: "other" },
];
