---
name: drizzle
description: Referência do Drizzle ORM v1 com Neon Postgres usada neste projeto. Use SEMPRE antes de escrever ou alterar qualquer coisa que toque o banco — schema, tabela, coluna, relação, query, insert, update, delete, transação, migração, `drizzle.config`, conexão, seed. Também ao decidir onde um arquivo de banco deve morar. Gatilhos: criar tabela, criar entidade, alterar coluna, adicionar índice, adicionar chave estrangeira, buscar do banco, gravar no banco, transação, migração, `drizzle-kit`, conectar no Neon, tipar modelo, `$inferSelect`.
---

# Drizzle ORM v1 — Neon Postgres

Versões de referência: **`drizzle-orm@1.0.0-rc.4`**, **`drizzle-kit@1.0.0-rc.4`**,
**`@neondatabase/serverless@1.1.0`**. Documentação consultada em 2026-07-29.

**Atenção:** a tag `latest` do npm ainda aponta para a `0.45.2`, que tem **outra API** de
relações e de query. Este projeto usa a linha **v1 (`@rc`)**, que é a documentada em
`orm.drizzle.team`. Nunca instale sem o sufixo `@rc` e nunca copie exemplo de tutorial que
use `relations(table, ({ one, many }) => …)` — isso é v0 e foi removido.

Se algo aqui não cobrir sua dúvida, **não escreva de memória** — busque a página no
[mapa de documentação](#mapa-de-documentação) e leia antes.

---

## 1. Instalação e layout de arquivos

```bash
npm i drizzle-orm@rc @neondatabase/serverless ws bufferutil
npm i -D drizzle-kit@rc
```

`ws` e `bufferutil` existem porque o driver escolhido é o de **WebSockets** e o Node não tem
`WebSocket` global (§2).

O alias `@/` deste projeto aponta para a raiz, então o banco mora em `db/` na raiz:

```
📦 <raiz>
 ├ 📂 app
 ├ 📂 db
 │  ├ 📂 schema
 │  │  ├ 📜 animals.ts
 │  │  ├ 📜 cases.ts
 │  │  └ 📜 organizations.ts
 │  ├ 📜 index.ts
 │  └ 📜 relations.ts
 ├ 📂 drizzle
 ├ 📜 .env.development.local
 └ 📜 drizzle.config.ts
```

- `db/schema/` — uma tabela por arquivo, `kebab-case`, tudo exportado (o `drizzle-kit`
  importa esses módulos para gerar migração; o que não é exportado não existe para ele).
- `db/relations.ts` — o `defineRelations` (§4).
- `db/index.ts` — a instância `db`. Único ponto do repositório que abre conexão.
- `drizzle/` — migrações geradas. **Versionado.** Nunca no `.gitignore`.

`db/` não é camada de domínio. A regra da arquitetura é que a lógica de domínio não importa
`next`; ela **pode** depender do repositório de dados. Mas regra de negócio não vai dentro de
query — as 17 regras de `docs/domain.md` vivem em módulo puro, e o `db/` só persiste.

---

## 2. Conexão

O projeto usa **`neon-serverless`** (WebSockets), não `neon-http`.

| Driver               | Import                        | Transação interativa |
| -------------------- | ----------------------------- | -------------------- |
| `neon-http`          | `drizzle-orm/neon-http`       | **não**              |
| `neon-serverless`    | `drizzle-orm/neon-serverless` | sim                  |
| `node-postgres` / pg | `drizzle-orm/node-postgres`   | sim                  |

A escolha é do motor de pipeline: avançar etapa grava em várias tabelas de uma vez
(regra 15), e isso exige `db.transaction`. `neon-http` é mais rápido para query única em
serverless, mas **não suporta transação interativa** — não use.

```ts
import "server-only";

import { neonConfig, Pool } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";

import { relations } from "@/db/relations";

neonConfig.webSocketConstructor = ws;

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export const db = drizzle({ client: pool, relations });
```

`server-only` no topo é obrigatório: sem ele, um import acidental num Client Component
arrasta a `DATABASE_URL` para o bundle.

A forma curta `drizzle(process.env.DATABASE_URL!)` também existe e cria o pool internamente,
mas aqui o `Pool` é explícito porque o `neonConfig.webSocketConstructor` precisa ser atribuído
antes de qualquer conexão.

### Em `next dev`

O módulo é reavaliado a cada HMR, e cada reavaliação abre um `Pool` novo. Em desenvolvimento,
guarde a instância no `globalThis`:

```ts
const globalForDb = globalThis as unknown as { pool?: Pool };

const pool =
  globalForDb.pool ?? new Pool({ connectionString: process.env.DATABASE_URL });

if (process.env.NODE_ENV !== "production") {
  globalForDb.pool = pool;
}
```

---

## 3. Schema

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

---

## 4. Relações

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

---

## 5. Ler dados

### Relational Query Builder (RQB v2)

Preferível quando o resultado é uma árvore de entidades. Só funciona se `relations` foi
passado ao `drizzle()`.

```ts
const list = await db.query.animals.findMany({
  columns: { id: true, name: true },
  limit: 20,
  offset: 0,
  orderBy: { createdAt: "desc" },
  where: { status: "active" },
  with: { cases: true },
});
```

```ts
const animal = await db.query.animals.findFirst({
  where: { id: animalId },
  with: { cases: { with: { stages: true } } },
});
```

`where` na v1 é **objeto**, não callback: `{ id: 1 }`, `{ id: { gt: 10 } }`,
`{ name: { like: "M%" } }`. Filtro em relação aninhada entra no mesmo objeto:

```ts
const withOpenCases = await db.query.animals.findMany({
  where: {
    cases: { status: { eq: "open" } },
    status: "active",
  },
});
```

`orderBy` aceita objeto (`{ id: "asc" }`) ou callback (`(t, { desc }) => desc(t.id)`).
`extras` é sempre callback:

```ts
extras: {
  loweredName: (table) => sql`lower(${table.name})`;
}
```

Quando usar callback, **referencie a coluna pelo parâmetro do callback, não pela tabela
importada.**

### Query builder SQL

Para agregação, join manual e projeção que não é entidade.

```ts
import { and, count, desc, eq } from "drizzle-orm";

const perStatus = await db
  .select({ status: animals.status, total: count(animals.id) })
  .from(animals)
  .where(
    and(
      eq(animals.organizationId, organizationId),
      eq(animals.published, true),
    ),
  )
  .groupBy(animals.status)
  .orderBy(desc(count(animals.id)))
  .limit(10);
```

Operadores de `drizzle-orm`: `eq`, `ne`, `gt`, `gte`, `lt`, `lte`, `isNull`, `isNotNull`,
`inArray`, `notInArray`, `exists`, `notExists`, `between`, `notBetween`, `like`, `notLike`,
`ilike`, `notIlike`, `not`, `and`, `or`, `arrayContains`, `arrayContained`, `arrayOverlaps`.

Subquery: `const sq = db.select().from(users).as('sq')`, depois `db.select().from(sq)`.

Toda query é parametrizada automaticamente.

---

## 6. Gravar dados

```ts
await db.insert(animals).values({ name: "Rex", organizationId });

const [created] = await db.insert(animals).values({ name: "Rex" }).returning();

await db.insert(animals).values([{ name: "Rex" }, { name: "Mel" }]);
```

```ts
await db
  .update(animals)
  .set({ status: "closed" })
  .where(eq(animals.id, animalId));

await db.delete(animals).where(eq(animals.id, animalId));
```

Conflito:

```ts
await db
  .insert(animals)
  .values({ id, name: "Rex" })
  .onConflictDoNothing({ target: animals.id });

await db
  .insert(animals)
  .values({ id, name: "Rex" })
  .onConflictDoUpdate({ set: { name: "Rex" }, target: animals.id });
```

`onConflictDoUpdate` aceita `targetWhere`, `setWhere` e `target` composto
(`target: [t.a, t.b]`). `insert().select(…)` insere a partir de um select. `db.$with('x')`
monta CTE.

---

## 7. Transações

```ts
await db.transaction(async (tx) => {
  await tx
    .update(cases)
    .set({ currentStageId: nextStageId })
    .where(eq(cases.id, caseId));
  await tx.insert(caseEvents).values({ caseId, kind: "stage_advanced" });
});
```

- Transação aninhada cria savepoint.
- `tx.rollback()` desfaz tudo.
- O callback pode retornar valor, e o `await db.transaction(…)` devolve esse valor.
- **Use `tx`, nunca `db`, dentro do callback.** Uma chamada em `db` sai da transação e não
  volta atrás no rollback.
- Postgres aceita nível de isolamento e modo de acesso como opções.

Toda operação de domínio que grava em mais de uma tabela vai numa transação. Regra 4 (fechar
animal encerra o case ativo) e regra 5 (fechar despublica) são um único `db.transaction` — não
duas chamadas soltas.

---

## 8. Migrações

### `drizzle.config.ts`

O projeto guarda a URL em `.env.development.local`, e `dotenv/config` só lê `.env`. Use o
carregador do próprio Next, que respeita a ordem de precedência
(`.env.$(NODE_ENV).local` → `.env.local` → `.env.$(NODE_ENV)` → `.env`):

```bash
npm i -D @next/env
```

A assinatura é `loadEnvConfig(dir, dev?, log?, forceReload?)`, e **`dev` tem default `false`**.
Com `false` ele carrega a lista de produção (`.env.production.local` → `.env.local` →
`.env.production` → `.env`) e **ignora o `.env.development.local`** — a `DATABASE_URL` chega
como `undefined` e o `drizzle-kit` falha com `[x] url: undefined`. Passe o segundo argumento:

```ts
import { loadEnvConfig } from "@next/env";
import { defineConfig } from "drizzle-kit";

loadEnvConfig(process.cwd(), process.env.NODE_ENV !== "production");

export default defineConfig({
  dbCredentials: { url: process.env.DATABASE_URL! },
  dialect: "postgresql",
  out: "./drizzle",
  schema: "./db/schema",
});
```

Outras opções: `migrations` (default
`{ schema: "drizzle", table: "__drizzle_migrations" }`), `tablesFilter`, `schemaFilter`,
`extensionsFilters`, `entities.roles` (aceita `'neon'`), `verbose`, `breakpoints` (default
`true`), `introspect.casing`.

Na v1 o `schemaFilter` **inverteu o default**: antes gerenciava só `public`, agora gerencia
todos os schemas.

### Fluxo

O fluxo do projeto é **`generate` + `migrate`** — migração versionada em SQL, revisável em PR.

```bash
npx drizzle-kit generate --name=init
npx drizzle-kit migrate
```

Estrutura gerada (v1, formato de pasta v3):

```
📂 drizzle
└ 📂 20242409125510_premium_mister_fear
  ├ 📜 migration.sql
  └ 📜 snapshot.json
```

Sem `journal.json` — cada migração é uma pasta isolada, o que reduz conflito de merge.
`drizzle-kit drop` não existe mais; para reverter, gere uma migração nova.

`drizzle-kit push` aplica o schema direto, sem arquivo SQL. Serve para prototipar contra um
branch descartável do Neon. **Não use no banco compartilhado nem em produção** — sem arquivo
versionado, ninguém revisa o `DROP COLUMN`. Se usar: `--explain` para simular, `--force` para
aceitar perda de dados (o antigo `--strict` foi removido; o prompt de segurança agora é o
padrão).

Flags úteis de `generate`: `--name`, `--custom` (SQL vazio para migração escrita à mão),
`--config`, `--out`, `--ignore-conflicts`.

Para aplicar migração em runtime existe a função `migrate()`, importada de um submódulo do
driver. **Confirme o caminho exato na página `/docs/drizzle-kit-migrate` antes de usar** — ele
varia por driver e não está fixado aqui.

### Scripts sugeridos

```json
"db:generate": "drizzle-kit generate",
"db:migrate": "drizzle-kit migrate",
"db:studio": "drizzle-kit studio"
```

---

## 9. Conciliação com `write-code`

**Ordem das colunas: alfabética.** A ordem física de coluna no Postgres não carrega
significado — a exceção de "ordem semântica" da `write-code` não se aplica. Isso inclui a
coluna `id`, que fica na posição alfabética dela. Se você quiser `id` no topo, é quebra
consciente da ordem e **exige o comentário de justificativa**.

Membros de `pgEnum` são um caso diferente: quando os valores têm sequência (etapas de funil),
a ordem sequencial vence e leva comentário. Motivos de fechamento não têm sequência — ficam
alfabéticos.

Demais pontos:

- Arquivos de `db/schema/` em `kebab-case`. O nome do arquivo é o plural da tabela
  (`animals.ts`), não o do símbolo.
- Nenhum import relativo dentro de `db/`. Uma tabela que referencia outra importa por
  `@/db/schema/animals`.
- Tabela não é componente React — **não** vale a regra `nome/index.tsx`.
- `.$type<T>()` nunca recebe `any`. Se o JSON é desconhecido, `unknown` e estreite.
- Zero comentário no schema. Constraint com nome explícito (`check("stage_not_empty", …)`)
  documenta melhor que comentário.

---

## 10. Uso na camada Next

- `db` só é importado em Server Component, Server Action ou route handler. `server-only` no
  `db/index.ts` transforma violação em erro de build.
- Server Action é endpoint `POST` público. **Toda query filtra por `organizationId` do usuário
  autenticado** (regra 1). Escopo de organização é `where`, não decoração de UI.
- `db.select()` num Server Component `async` funciona direto — não precisa de `fetch`.
- **Query de banco não torna a rota dinâmica.** Sem `cacheComponents`, o Next pré-renderiza a
  página no `next build` e roda a query ali — o build precisa da `DATABASE_URL` (e só carrega
  `.env.local`, não `.env.development.local`) e as linhas ficam congeladas no HTML estático. Se
  a página deve ler o banco a cada request, declare `export const dynamic = "force-dynamic"` no
  `page.tsx`. O sintoma é `Error occurred prerendering page` com
  `No database host or connection string was set` no build, enquanto o `next dev` funciona.
- `fetch` não é cacheado no Next 16, e query de ORM **nunca** foi. Cache é decisão explícita
  via `revalidateTag` / `'use cache'` — veja a skill `nextjs`.
- Duas queries independentes no mesmo componente vão em `Promise.all`, não em `await`
  sequencial.
- Depois de mutar, `revalidatePath` / `revalidateTag` **antes** do `redirect`.

---

## 11. Armadilhas

- Instalar sem `@rc` e cair na `0.45.2` — a API de relações é outra e o erro é de tipo, não de
  runtime.
- Copiar exemplo com `relations(table, ({ one, many }) => …)`: removido na v1.
- `where` do RQB escrito como callback (`(t, { eq }) => …`): na v1 é objeto.
- `db.transaction` com driver `neon-http`: não suporta transação interativa.
- Esquecer `neonConfig.webSocketConstructor = ws` no Node — falha só ao abrir conexão.
- Usar `db` em vez de `tx` dentro da transação.
- `Pool` novo a cada HMR em `next dev`, esgotando conexão do Neon.
- Tabela não exportada de `db/schema/` — o `drizzle-kit` não a vê e a migração sai incompleta.
- `drizzle/` no `.gitignore`.
- Esperar que `defineRelations` crie chave estrangeira: não cria.
- `dotenv/config` no `drizzle.config.ts` não lê `.env.development.local`.
- `loadEnvConfig(process.cwd())` sem o segundo argumento também não lê — `dev` default `false`
  cai na lista de produção.
- Server Component que só faz query e não declara `force-dynamic`: vira página estática com
  dado de build.
- `getTableColumns` renomeado para `getColumns` na v1.
- Pacotes de validação: use `drizzle-orm/zod`, não `drizzle-zod` (consolidados na v1).

---

## Mapa de documentação

Quando este arquivo não cobrir, busque a URL antes de escrever. Prefixo:
`https://orm.drizzle.team/docs`.

| Assunto                      | Caminho                   |
| ---------------------------- | ------------------------- |
| Breaking changes v0 → v1     | `/v0-v1-changes`          |
| Colunas Postgres             | `/column-types/pg`        |
| Conexão com Neon             | `/connect-neon`           |
| Constraints e índices        | `/indexes-constraints`    |
| `delete`                     | `/delete`                 |
| `drizzle.config`             | `/drizzle-config-file`    |
| `drizzle-kit generate`       | `/drizzle-kit-generate`   |
| `drizzle-kit migrate`        | `/drizzle-kit-migrate`    |
| `drizzle-kit pull`           | `/drizzle-kit-pull`       |
| `drizzle-kit push`           | `/drizzle-kit-push`       |
| `drizzle-kit studio`         | `/drizzle-kit-studio`     |
| Estratégias de migração      | `/migrations`             |
| Guia inicial Neon            | `/get-started/neon-new`   |
| `insert`                     | `/insert`                 |
| Operadores de filtro         | `/operators`              |
| Queries relacionais (RQB)    | `/rqb`                    |
| Relações (`defineRelations`) | `/relations-v2`           |
| `select` e joins             | `/select`                 |
| Declaração de schema         | `/sql-schema-declaration` |
| Transações                   | `/transactions`           |
| `update`                     | `/update`                 |
| Upgrade para v1              | `/upgrade-v1`             |
| Utilidades e tipagem         | `/goodies`                |

---

## Pare e pergunte

- A tarefa pede um pacote do ecossistema sem skill no repositório (`drizzle-seed`, adaptador
  de auth, camada de cache).
- A API necessária não está aqui e a página de documentação não confirma o comportamento na
  `1.0.0-rc.4`.
- A modelagem exigida contradiz `docs/domain.md` — em especial as regras 2, 15 e 16, que são
  regra de negócio e **não** devem virar constraint de schema.
- A solução exigiria `any`, `@ts-ignore` ou `drizzle-kit push --force` em banco compartilhado.
