import { headers } from "next/headers";
import Link from "next/link";

import { OrganizationSelector } from "@/components/organization-selector";
import { auth } from "@/server";

export async function OrganizationList() {
  const organizations = await auth.api.listOrganizations({
    headers: await headers(),
  });

  if (organizations.length === 0) {
    return (
      <div className="flex flex-col gap-block">
        <p className="text-muted text-sm">
          Você ainda não faz parte de nenhuma organização.
        </p>

        <Link
          className="bg-pine flex font-medium h-control items-center justify-center px-item rounded-md text-paper text-sm transition-colors w-full hover:bg-pine-strong"
          href="/organizations/new"
        >
          Criar organização
        </Link>
      </div>
    );
  }

  return (
    <OrganizationSelector
      organizations={organizations.map((organization) => ({
        id: organization.id,
        location: organization.location ?? null,
        name: organization.name,
      }))}
    />
  );
}
