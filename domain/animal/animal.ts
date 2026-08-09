import * as z from "zod";

export const ageGroups = [
  /* order: crescente por faixa etária */
  "baby",
  "adult",
  "senior",
] as const;

export const sexes = ["female", "male"] as const;

export const sizes = [
  /* order: crescente por porte */
  "small",
  "medium",
  "large",
] as const;

export const species = ["cat", "dog", "other"] as const;

export type AgeGroup = (typeof ageGroups)[number];

export type Sex = (typeof sexes)[number];

export type Size = (typeof sizes)[number];

export type Species = (typeof species)[number];

function blankToUndefined<TValue extends string>(
  value: "" | TValue,
): TValue | undefined {
  return value === "" ? undefined : value;
}

export const registerAnimalInput = z.object({
  ageGroup: z.enum(ageGroups).or(z.literal("")).transform(blankToUndefined),
  description: z
    .string()
    .trim()
    .max(2000, { error: "A descrição pode ter no máximo 2000 caracteres." })
    .transform(blankToUndefined),
  name: z
    .string()
    .trim()
    .max(120, { error: "O nome pode ter no máximo 120 caracteres." })
    .transform(blankToUndefined),
  sex: z.enum(sexes).or(z.literal("")).transform(blankToUndefined),
  size: z.enum(sizes).or(z.literal("")).transform(blankToUndefined),
  species: z.enum(species).or(z.literal("")).transform(blankToUndefined),
  temperament: z
    .string()
    .trim()
    .max(120, { error: "O temperamento pode ter no máximo 120 caracteres." })
    .transform(blankToUndefined),
});

export type RegisterAnimalInput = Partial<z.infer<typeof registerAnimalInput>>;

export type RegisterAnimalFields = Record<keyof RegisterAnimalInput, string>;
