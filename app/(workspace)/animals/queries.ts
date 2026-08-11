import "server-only";

import { and, asc, count, desc, eq, ilike } from "drizzle-orm";

import { animals } from "@/db/schema/animals";
import { db, requireActiveOrganization } from "@/server";

import type { Animal } from "@/db/schema/animals";
import type { AnimalListParams } from "@/domain/animal/list-params";

const pageSize = 10;

type AnimalListResult = {
  pageCount: number;
  rows: Animal[];
  total: number;
};

export async function listOrganizationAnimals(
  params: AnimalListParams,
): Promise<AnimalListResult> {
  const organizationId = await requireActiveOrganization();

  const where = and(
    eq(animals.organizationId, organizationId),
    params.ageGroup ? eq(animals.ageGroup, params.ageGroup) : undefined,
    params.q ? ilike(animals.name, `%${params.q}%`) : undefined,
    params.sex ? eq(animals.sex, params.sex) : undefined,
    params.size ? eq(animals.size, params.size) : undefined,
    params.species ? eq(animals.species, params.species) : undefined,
  );

  const sortColumn = params.sort === "name" ? animals.name : animals.createdAt;
  const direction = params.order === "asc" ? asc : desc;

  const [rows, [totals]] = await Promise.all([
    db
      .select()
      .from(animals)
      .where(where)
      .orderBy(direction(sortColumn), asc(animals.id))
      .limit(pageSize)
      .offset((params.page - 1) * pageSize),
    db.select({ value: count() }).from(animals).where(where),
  ]);

  const total = totals?.value ?? 0;

  return { pageCount: Math.ceil(total / pageSize), rows, total };
}
