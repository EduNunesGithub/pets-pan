import { sql } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  snakeCase,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import { animals } from "@/db/schema/animals";

export const animalPhotos = snakeCase.table(
  "animal_photos",
  {
    alt: text().notNull(),
    animalId: uuid()
      .notNull()
      .references(() => animals.id, { onDelete: "cascade" }),
    cardPathname: text().notNull(),
    cardUrl: text().notNull(),
    createdAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
    fullHeight: integer().notNull(),
    fullPathname: text().notNull(),
    fullUrl: text().notNull(),
    fullWidth: integer().notNull(),
    id: uuid().defaultRandom().primaryKey(),
    isCover: boolean().default(false).notNull(),
    position: integer().default(0).notNull(),
  },
  (table) => [
    index("animal_photos_animal_id_idx").on(table.animalId),
    uniqueIndex("animal_photos_one_cover_per_animal_idx")
      .on(table.animalId)
      .where(sql`${table.isCover}`),
  ],
);

export type AnimalPhoto = typeof animalPhotos.$inferSelect;
export type NewAnimalPhoto = typeof animalPhotos.$inferInsert;
