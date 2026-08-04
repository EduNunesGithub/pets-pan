"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { createOrganization } from "@/domain/organization/create-organization";
import { auth } from "@/server";

import type { CreateOrganizationInput } from "@/domain/organization/organization";

export async function createOrganizationAction(
  input: CreateOrganizationInput,
): Promise<{ error: string; unauthenticated?: boolean } | undefined> {
  const requestHeaders = await headers();
  const session = await auth.api.getSession({ headers: requestHeaders });

  if (!session) {
    return {
      error: "Sua sessão expirou. Entre novamente.",
      unauthenticated: true,
    };
  }

  try {
    const data = createOrganization(input);

    await auth.api.createOrganization({
      body: { location: data.location, name: data.name, slug: data.slug },
      headers: requestHeaders,
    });
  } catch {
    return { error: "Não foi possível criar a organização. Tente outro nome." };
  }

  redirect("/");
}
