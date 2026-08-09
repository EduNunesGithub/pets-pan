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
import {
  ageGroups,
  sexes,
  sizes,
  species as speciesValues,
} from "@/domain/animal/animal";

export const ageGroup = pgEnum("age_group", ageGroups);

export const sex = pgEnum("sex", sexes);

export const size = pgEnum("size", sizes);

export const species = pgEnum("species", speciesValues);

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
