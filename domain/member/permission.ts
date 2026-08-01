import { createAccessControl } from "better-auth/plugins/access";

import type { Role } from "@/domain/member/role";
import type { RoleAuthorizeRequest } from "better-auth/plugins/access";

export const statement = {
  animal: [
    "archive",
    "close",
    "create",
    "publish",
    "unarchive",
    "unpublish",
    "update",
  ],
  application: ["select", "triage"],
  case: ["cancel", "close", "move", "open"],
  member: ["invite", "remove", "setRole"],
  organization: ["read", "update"],
  pipeline: ["configure"],
  task: ["complete", "reopen"],
} as const;

export type Resource = keyof typeof statement;

export const accessControl = createAccessControl(statement);

export const admin = accessControl.newRole(statement);

export const volunteer = accessControl.newRole({
  animal: statement.animal,
  application: statement.application,
  case: statement.case,
  organization: ["read"] as const,
  task: statement.task,
});

const accessByRole = { admin, volunteer };

export function can<TResource extends Resource>(
  role: Role,
  resource: TResource,
  action: (typeof statement)[TResource][number],
): boolean {
  const request: RoleAuthorizeRequest<typeof statement> = {
    [resource]: [action],
  };

  return accessByRole[role].authorize(request).success;
}
