import {
  boolean,
  index,
  pgEnum,
  snakeCase,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

import { organization } from "@/db/schema/auth";

export const ageGroup = pgEnum("age_group", [
  /* order: crescente por faixa etária */
  "baby",
  "adult",
  "senior",
]);

export const sex = pgEnum("sex", ["female", "male"]);

export const size = pgEnum("size", [
  /* order: crescente por porte */
  "small",
  "medium",
  "large",
]);

export const species = pgEnum("species", ["cat", "dog", "other"]);

export const animals = snakeCase.table(
  "animals",
  {
    ageGroup: ageGroup(),
    createdAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
    description: text(),
    id: uuid().defaultRandom().primaryKey(),
    name: text(),
    neutered: boolean(),
    organizationId: text()
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    published: boolean().default(false).notNull(),
    sex: sex(),
    size: size(),
    species: species(),
    temperament: text(),
    updatedAt: timestamp({ withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
    vaccinated: boolean(),
  },
  (table) => [index("animals_organization_id_idx").on(table.organizationId)],
);

export type Animal = typeof animals.$inferSelect;
export type NewAnimal = typeof animals.$inferInsert;
