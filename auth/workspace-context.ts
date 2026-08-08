import "server-only";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { db } from "@/db";

import type { Role } from "@/domain/member/role";

type WorkspaceOrganization = {
  id: string;
  location: string | null;
  name: string;
};

export type WorkspaceContext = {
  activeOrganization: WorkspaceOrganization;
  organizations: WorkspaceOrganization[];
  role: Role;
  user: {
    email: string;
    name: string;
  };
};

export async function resolveWorkspaceContext(): Promise<WorkspaceContext> {
  const requestHeaders = await headers();
  const session = await auth.api.getSession({ headers: requestHeaders });

  if (!session) {
    redirect("/sign-in");
  }

  const activeOrganizationId = session.session.activeOrganizationId;

  if (!activeOrganizationId) {
    redirect("/organizations");
  }

  const membership = await db.query.member.findFirst({
    columns: { role: true },
    where: {
      organizationId: activeOrganizationId,
      userId: session.user.id,
    },
  });

  if (!membership) {
    redirect("/organizations");
  }

  const organizations = await auth.api.listOrganizations({
    headers: requestHeaders,
  });

  const activeOrganization = organizations.find(
    (organization) => organization.id === activeOrganizationId,
  );

  if (!activeOrganization) {
    redirect("/organizations");
  }

  return {
    activeOrganization: {
      id: activeOrganization.id,
      location: activeOrganization.location ?? null,
      name: activeOrganization.name,
    },
    organizations: organizations.map((organization) => ({
      id: organization.id,
      location: organization.location ?? null,
      name: organization.name,
    })),
    role: membership.role === "admin" ? "admin" : "volunteer",
    user: {
      email: session.user.email,
      name: session.user.name,
    },
  };
}
