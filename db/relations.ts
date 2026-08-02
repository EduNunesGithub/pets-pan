import { defineRelations } from "drizzle-orm";

import {
  account,
  invitation,
  member,
  organization,
  session,
  user,
  verification,
} from "@/db/schema/auth";

export const relations = defineRelations(
  {
    account,
    invitation,
    member,
    organization,
    session,
    user,
    verification,
  },
  (r) => ({
    account: {
      user: r.one.user({ from: r.account.userId, to: r.user.id }),
    },
    invitation: {
      organization: r.one.organization({
        from: r.invitation.organizationId,
        to: r.organization.id,
      }),
      user: r.one.user({ from: r.invitation.inviterId, to: r.user.id }),
    },
    member: {
      organization: r.one.organization({
        from: r.member.organizationId,
        to: r.organization.id,
      }),
      user: r.one.user({ from: r.member.userId, to: r.user.id }),
    },
    organization: {
      invitations: r.many.invitation(),
      members: r.many.member(),
    },
    session: {
      user: r.one.user({ from: r.session.userId, to: r.user.id }),
    },
    user: {
      accounts: r.many.account(),
      invitations: r.many.invitation(),
      members: r.many.member(),
      sessions: r.many.session(),
    },
  }),
);
