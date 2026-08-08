import { MemberMenu } from "@/components/member-menu";
import { OrganizationSwitcher } from "@/components/organization-switcher";
import { WorkspaceNav } from "@/components/workspace-nav";
import { resolveWorkspaceContext } from "@/server";

export async function WorkspaceSidebar() {
  const { activeOrganization, organizations, role, user } =
    await resolveWorkspaceContext();

  return (
    <>
      <OrganizationSwitcher
        activeOrganization={activeOrganization}
        organizations={organizations}
      />

      <WorkspaceNav canGovern={role === "admin"} />

      <MemberMenu email={user.email} name={user.name} role={role} />
    </>
  );
}
