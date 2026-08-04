import * as z from "zod";

import type { Role } from "@/domain/member/role";

export const createOrganizationInput = z.object({
  location: z
    .string()
    .trim()
    .max(120, "A localização pode ter no máximo 120 caracteres."),
  name: z
    .string()
    .trim()
    .min(1, "Informe o nome da organização.")
    .max(120, "O nome pode ter no máximo 120 caracteres."),
});

export type CreateOrganizationInput = z.infer<typeof createOrganizationInput>;

export const founderRole: Role = "admin";

export function toSlug(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
