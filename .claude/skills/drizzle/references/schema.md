# Drizzle — schema e relações

## Tabelas

Tabela é `pgTable` de `drizzle-orm/pg-core`. A chave TypeScript vira o nome da coluna; o
segundo argumento da função de coluna sobrescreve.

```ts
import { integer, pgTable, varchar } from "drizzle-orm/pg-core";

export const usersTable = pgTable("users", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  name: varchar({ length: 255 }).notNull(),
});
```

### `snakeCase` — o padrão deste projeto

Identificadores em TypeScript são `camelCase`; colunas em Postgres são `snake_case`. Em vez de
escrever o nome duas vezes em cada coluna, use o builder:

```ts
import { snakeCase, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const animals = snakeCase.table("animals", {
  closedAt: timestamp({ withTimezone: true }),
  createdAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
  id: uuid().defaultRandom().primaryKey(),
  name: text().notNull(),
});
```

`closedAt` → `closed_at`, `createdAt` → `created_at`. Disponível em `table`, `view`,
`materializedView` e `schema`.

**Na v1, `drizzle({ casing: 'camelCase' })` não existe mais** — foi removido em favor deste
builder. Exemplo com `casing` na conexão é v0.

### Tipos de coluna

| Tipo                   | Exemplo                                           |
| ---------------------- | ------------------------------------------------- |
| `bigint`               | `bigint({ mode: 'number' })`                      |
| `boolean`              | `boolean()`                                       |
| `bytea`                | `bytea()`                                         |
| `char`                 | `char({ length: 10 })`                            |
| `date`                 | `date({ mode: 'date' })`                          |
| `doublePrecision`      | `doublePrecision()`                               |
| `integer` / `smallint` | `integer()`                                       |
| `interval`             | `interval({ fields: 'day to second' })`           |
| `json` / `jsonb`       | `jsonb().$type<{ foo: string }>()`                |
| `numeric` / `decimal`  | `numeric({ precision: 10, scale: 2 })`            |
| `real`                 | `real()`                                          |
| `serial` / `bigserial` | `serial()`                                        |
| `text`                 | `text({ enum: ["a", "b"] })`                      |
| `time`                 | `time({ precision: 6, withTimezone: true })`      |
| `timestamp`            | `timestamp({ mode: 'date', withTimezone: true })` |
| `uuid`                 | `uuid().defaultRandom()`                          |
| `varchar`              | `varchar({ length: 255 })`                        |

Também existem `point`, `line`, `inet`, `cidr`, `macaddr`, `macaddr8`.

Modificadores: `.notNull()`, `.unique()`, `.primaryKey()`, `.default(v)`, `.defaultNow()`,
`.defaultRandom()`, `.$defaultFn(() => …)` (default em runtime), `.$onUpdate(() => new Date())`,
`.$type<T>()` (tipagem em tempo de compilação, **sem validação em runtime**),
`.generatedAlwaysAsIdentity({ startWith: 1000 })`.

Array multidimensional na v1 é `column.array('[][]')` — `.array().array()` foi removido.
Coluna gerada só aceita `sql`: `.generatedAlwaysAs(sql\`…\`)`, nunca string crua.

### Enum

Os motivos de fechamento da regra 6 são valores fixos — `pgEnum` serve:

```ts
import { pgEnum } from "drizzle-orm/pg-core";

export const closingReason = pgEnum("closing_reason", [
  "adopted",
  "died",
  "lost",
  "returned_to_owner",
  "transferred",
]);
```

### Constraints e índices

O terceiro argumento do `pgTable` é um callback que **retorna array**.

```ts
import { sql } from "drizzle-orm";
import {
  check,
  foreignKey,
  index,
  integer,
  pgTable,
  primaryKey,
  text,
  unique,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const applications = pgTable(
  "applications",
  {
    adopterId: integer(),
    animalId: integer(),
    stage: text(),
  },
  (table) => [
    primaryKey({ columns: [table.animalId, table.adopterId] }),
    unique().on(table.animalId, table.adopterId),
    index("applications_animal_idx").on(table.animalId),
    check("stage_not_empty", sql`${table.stage} <> ''`),
  ],
);
```

Chave estrangeira inline é `.references(() => animals.id)`. Auto-referência precisa do tipo
explícito:

```ts
import {
  integer,
  pgTable,
  serial,
  type AnyPgColumn,
} from "drizzle-orm/pg-core";

export const user = pgTable("user", {
  id: serial().primaryKey(),
  parentId: integer().references((): AnyPgColumn => user.id),
});
```

`foreignKey({ columns, foreignColumns, name })` no array cobre chave composta e nome
customizado. Índice aceita `.using('btree')`, `.where(…)`, `.concurrently()`, `.asc()`,
`.nullsFirst()`.

### Colunas repetidas

```ts
export const timestamps = {
  createdAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
  deletedAt: timestamp({ withTimezone: true }),
  updatedAt: timestamp({ withTimezone: true }),
};
```

```ts
export const animals = snakeCase.table("animals", {
  id: uuid().defaultRandom().primaryKey(),
  ...timestamps,
});
```

### Tipos inferidos

```ts
export type Animal = typeof animals.$inferSelect;
export type NewAnimal = typeof animals.$inferInsert;
```

`InferSelectModel<T>` e `InferInsertModel<T>` de `drizzle-orm` fazem o mesmo em posição de
tipo. **Nunca escreva à mão um tipo que espelha a tabela** — ele sai de sincronia na primeira
migração.

## Relações

Relações são declaradas **fora** das tabelas, com `defineRelations`, e passadas ao `drizzle()`.
São abstração de aplicação: **não criam constraint no banco**. Chave estrangeira de verdade
continua sendo `.references()` no schema.

```ts
import { defineRelations } from "drizzle-orm";

import { animals } from "@/db/schema/animals";
import { cases } from "@/db/schema/cases";

export const relations = defineRelations({ animals, cases }, (r) => ({
  animals: {
    cases: r.many.cases(),
  },
  cases: {
    animal: r.one.animals({
      from: r.cases.animalId,
      to: r.animals.id,
    }),
  },
}));
```

`r.one.<tabela>({ from, to, optional, alias, where })` e `r.many.<tabela>({ … })`. O lado
`many` inverso pode ficar sem argumento quando o `one` já declarou `from`/`to`.

Muitos-para-muitos usa `.through()` na tabela de junção:

```ts
groups: r.many.groups({
  from: r.users.id.through(r.usersToGroups.userId),
  to: r.groups.id.through(r.usersToGroups.groupId),
});
```

Para dividir em arquivos, use `defineRelationsPart` e espalhe — **as relações principais vêm
primeiro na ordem do spread**.

Índice em coluna de chave estrangeira não é opcional aqui: sem ele, todo `with` vira scan.

## Convenções do projeto no schema

- **Ordem das colunas: alfabética.** A ordem física de coluna no Postgres não carrega
  significado — a exceção de "ordem semântica" não se aplica. Isso inclui a coluna `id`, que
  fica na posição alfabética dela; `id` no topo exige justificativa (`order:`).
- Membros de `pgEnum` com sequência real (etapas de funil) ficam em ordem sequencial com
  justificativa; sem sequência (motivos de fechamento), alfabéticos.
- Arquivos de `db/schema/` em `kebab-case`, nome no plural da tabela (`animals.ts`).
- Tabela não é componente React — **não** vale a regra `nome/index.tsx`.
- `.$type<T>()` nunca recebe `any`. Se o JSON é desconhecido, `unknown` e estreite.
- Constraint com nome explícito (`check("stage_not_empty", …)`) documenta melhor que
  comentário.
