import { boolean, snakeCase, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const todos = snakeCase.table("todos", {
  completed: boolean().default(false).notNull(),
  createdAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
  id: uuid().defaultRandom().primaryKey(),
  title: text().notNull(),
});

export type NewTodo = typeof todos.$inferInsert;
export type Todo = typeof todos.$inferSelect;
