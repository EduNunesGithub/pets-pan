# Drizzle — ler, gravar e transações

## Relational Query Builder (RQB v2)

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

## Query builder SQL

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

## Gravar dados

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

## Transações

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
