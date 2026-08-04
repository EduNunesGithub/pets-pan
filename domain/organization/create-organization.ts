import {
  createOrganizationInput,
  toSlug,
} from "@/domain/organization/organization";

import type { CreateOrganizationInput } from "@/domain/organization/organization";

export type CreateOrganizationData = {
  location?: string;
  name: string;
  slug: string;
};

export function createOrganization(
  input: CreateOrganizationInput,
): CreateOrganizationData {
  const { location, name } = createOrganizationInput.parse(input);

  return {
    location: location ? location : undefined,
    name,
    slug: toSlug(name),
  };
}
