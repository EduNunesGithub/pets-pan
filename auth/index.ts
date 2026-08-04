import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { organization } from "better-auth/plugins";

import { db } from "@/db";
import * as schema from "@/db/schema/auth";
import { founderRole } from "@/domain/organization/organization";

export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: "pg", schema }),
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
