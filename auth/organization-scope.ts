import "server-only";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { db } from "@/db";

import type { OrganizationScope } from "@/db/organization-scope";

export async function requireActiveOrganization(): Promise<OrganizationScope> {
  const authSession = await auth.api.getSession({ headers: await headers() });

  if (!authSession) {
    redirect("/sign-in");
  }

  const activeOrganizationId = authSession.session.activeOrganizationId;

  if (!activeOrganizationId) {
    redirect("/organizations/new");
  }

  const membership = await db.query.member.findFirst({
    columns: { id: true },
    where: {
      organizationId: activeOrganizationId,
      userId: authSession.user.id,
    },
  });

  if (!membership) {
    redirect("/organizations/new");
  }

  return activeOrganizationId as OrganizationScope;
}
