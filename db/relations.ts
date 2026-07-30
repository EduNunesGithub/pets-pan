import { defineRelations } from "drizzle-orm";

import { todos } from "@/db/schema/todos";

export const relations = defineRelations({ todos });
