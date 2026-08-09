"use server";

import { revalidatePath } from "next/cache";

import { animals } from "@/db/schema/animals";
import { registerAnimalInput } from "@/domain/animal/animal";
import { registerAnimal } from "@/domain/animal/register-animal";
import { db, requireActiveOrganization } from "@/server";

import type { RegisterAnimalFields } from "@/domain/animal/animal";

export async function registerAnimalAction(
  fields: RegisterAnimalFields,
): Promise<{ error: string } | undefined> {
  const organizationId = await requireActiveOrganization();

  const parsed = registerAnimalInput.safeParse(fields);

  if (!parsed.success) {
    return { error: "Confira os campos do formulário e tente novamente." };
  }

  try {
    const data = registerAnimal(parsed.data);

    await db.insert(animals).values({ ...data, organizationId });
  } catch {
    return { error: "Não foi possível cadastrar o animal. Tente novamente." };
  }

  revalidatePath("/animals");

  return undefined;
}
