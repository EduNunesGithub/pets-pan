import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { organization } from "better-auth/plugins";

import { db } from "@/db";
import * as schema from "@/db/schema/auth";
import { founderRole } from "@/domain/organization/organization";

export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: "pg", schema }),
  databaseHooks: {
    session: {
      create: {
        before: async (session) => {
          const membership = await db.query.member.findFirst({
            columns: { organizationId: true },
            orderBy: { createdAt: "asc" },
            where: { userId: session.userId },
          });

          return {
            data: {
              ...session,
              activeOrganizationId: membership?.organizationId ?? null,
            },
          };
        },
      },
    },
  },
  emailAndPassword: { enabled: true },
  plugins: [
    organization({
      creatorRole: founderRole,
      schema: {
        organization: {
          additionalFields: {
            location: { input: true, required: false, type: "string" },
          },
        },
      },
    }),
    /* nextCookies precisa vir por último para setar o cookie de sessão */
    nextCookies(),
  ],
});
