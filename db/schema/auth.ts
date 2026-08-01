import {
  boolean,
  index,
  snakeCase,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

export const account = snakeCase.table(
  "account",
  {
    accessToken: text(),
    accessTokenExpiresAt: timestamp({ withTimezone: true }),
    accountId: text().notNull(),
    createdAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
    id: text().primaryKey(),
    idToken: text(),
    password: text(),
    providerId: text().notNull(),
    refreshToken: text(),
    refreshTokenExpiresAt: timestamp({ withTimezone: true }),
    scope: text(),
    updatedAt: timestamp({ withTimezone: true })
      .$onUpdate(() => new Date())
      .notNull(),
    userId: text()
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
  },
  (table) => [index("account_user_id_idx").on(table.userId)],
);

export const invitation = snakeCase.table(
  "invitation",
  {
    createdAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
    email: text().notNull(),
    expiresAt: timestamp({ withTimezone: true }).notNull(),
    id: text().primaryKey(),
    inviterId: text()
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    organizationId: text()
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    role: text(),
    status: text().default("pending").notNull(),
  },
  (table) => [
    index("invitation_email_idx").on(table.email),
    index("invitation_organization_id_idx").on(table.organizationId),
  ],
);

export const member = snakeCase.table(
  "member",
  {
    createdAt: timestamp({ withTimezone: true }).notNull(),
    id: text().primaryKey(),
    organizationId: text()
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    role: text().default("member").notNull(),
    userId: text()
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
  },
  (table) => [
    index("member_organization_id_idx").on(table.organizationId),
    index("member_user_id_idx").on(table.userId),
  ],
);

export const organization = snakeCase.table("organization", {
  createdAt: timestamp({ withTimezone: true }).notNull(),
  id: text().primaryKey(),
  location: text(),
  logo: text(),
  metadata: text(),
  name: text().notNull(),
  slug: text().notNull().unique(),
});

export const session = snakeCase.table(
  "session",
  {
    activeOrganizationId: text(),
    createdAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
    expiresAt: timestamp({ withTimezone: true }).notNull(),
    id: text().primaryKey(),
    ipAddress: text(),
    token: text().notNull().unique(),
    updatedAt: timestamp({ withTimezone: true })
      .$onUpdate(() => new Date())
      .notNull(),
    userAgent: text(),
    userId: text()
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
  },
  (table) => [index("session_user_id_idx").on(table.userId)],
);

export const user = snakeCase.table("user", {
  createdAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
  email: text().notNull().unique(),
  emailVerified: boolean().default(false).notNull(),
  id: text().primaryKey(),
  image: text(),
  name: text().notNull(),
  updatedAt: timestamp({ withTimezone: true })
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

export const verification = snakeCase.table(
  "verification",
  {
    createdAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
    expiresAt: timestamp({ withTimezone: true }).notNull(),
    id: text().primaryKey(),
    identifier: text().notNull(),
    updatedAt: timestamp({ withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
    value: text().notNull(),
  },
  (table) => [index("verification_identifier_idx").on(table.identifier)],
);

export type Account = typeof account.$inferSelect;
export type Invitation = typeof invitation.$inferSelect;
export type Member = typeof member.$inferSelect;
export type NewAccount = typeof account.$inferInsert;
export type NewInvitation = typeof invitation.$inferInsert;
export type NewMember = typeof member.$inferInsert;
export type NewOrganization = typeof organization.$inferInsert;
export type NewSession = typeof session.$inferInsert;
export type NewUser = typeof user.$inferInsert;
export type NewVerification = typeof verification.$inferInsert;
export type Organization = typeof organization.$inferSelect;
export type Session = typeof session.$inferSelect;
export type User = typeof user.$inferSelect;
export type Verification = typeof verification.$inferSelect;
