import * as z from "zod";

import { ageGroups, sexes, sizes, species } from "@/domain/animal/animal";

const sortKeys = ["createdAt", "name"] as const;

const sortOrders = ["asc", "desc"] as const;

export const animalListParams = z.object({
  ageGroup: z.enum(ageGroups).optional().catch(undefined),
  order: z.enum(sortOrders).catch("desc"),
  page: z.coerce.number().int().min(1).catch(1),
  q: z.string().trim().min(1).optional().catch(undefined),
  sex: z.enum(sexes).optional().catch(undefined),
  size: z.enum(sizes).optional().catch(undefined),
  sort: z.enum(sortKeys).catch("createdAt"),
  species: z.enum(species).optional().catch(undefined),
});

export type AnimalListParams = z.infer<typeof animalListParams>;

export type AnimalSortKey = (typeof sortKeys)[number];

export function serializeAnimalListParams(
  params: AnimalListParams,
): URLSearchParams {
  const search = new URLSearchParams();

  if (params.q) {
    search.set("q", params.q);
  }

  if (params.species) {
    search.set("species", params.species);
  }

  if (params.sex) {
    search.set("sex", params.sex);
  }

  if (params.size) {
    search.set("size", params.size);
  }

  if (params.ageGroup) {
    search.set("ageGroup", params.ageGroup);
  }

  if (params.sort !== "createdAt") {
    search.set("sort", params.sort);
  }

  if (params.order !== "desc") {
    search.set("order", params.order);
  }

  if (params.page > 1) {
    search.set("page", String(params.page));
  }

  return search;
}
