# Next.js — buscar e mutar dados

## Buscar dados

### Server Component

Componente `async` + `await`. Qualquer I/O serve: `fetch`, ORM, driver de banco.

```tsx
export default async function Page() {
  const animals = await db.select().from(animalsTable);
  return <AnimalList animals={animals} />;
}
```

- `fetch` idêntico na mesma árvore é memoizado por requisição.
- **`fetch` não é cacheado por padrão no Next 16** e bloqueia a renderização até resolver.
- `React.cache` memoiza uma função por requisição (não entre requisições).
- Query de banco neste projeto passa pela skill `drizzle` — o `db` só é importável em Server
  Component, Server Action ou route handler.

### Streaming

Duas formas:

1. `loading.tsx` no segmento — envolve o `page` inteiro num `<Suspense>`.
2. `<Suspense>` explícito — granularidade fina, preferível quando o dado runtime está num
   pedaço só.

Atenção: um `layout` que acessa dado runtime (`cookies()`, `headers()`, fetch não cacheado)
**não** cai no `loading.tsx` do mesmo segmento — ele bloqueia a navegação. Envolva o acesso
num `<Suspense>` próprio ou mova o fetch para o `page`.

### Client Component

Passe a **promise** sem `await` do servidor e resolva com `use()` dentro de `<Suspense>`:

```tsx
export default function Page() {
  const animals = getAnimals();
  return (
    <Suspense fallback={<AnimalListSkeleton />}>
      <AnimalList animals={animals} />
    </Suspense>
  );
}
```

```tsx
"use client";

import { use } from "react";

export default function AnimalList({
  animals,
}: {
  animals: Promise<Animal[]>;
}) {
  const list = use(animals);
}
```

### Paralelo vs sequencial

Dentro de um mesmo componente, `await` seguido de `await` é sequencial. Dispare as chamadas
antes e junte com `Promise.all`:

```tsx
const animalData = getAnimal(id);
const casesData = getCases(id);
const [animal, cases] = await Promise.all([animalData, casesData]);
```

`Promise.all` falha inteiro se uma falhar — use `Promise.allSettled` quando a falha parcial
for aceitável.

## Mutar dados — Server Functions

Função `async` marcada com `'use server'`. Chamada de "Server Action" quando usada em
`action` / `formAction`.

Duas formas de declarar:

```ts
"use server";

export async function createAnimal(formData: FormData) {}
```

```tsx
export default function Page() {
  async function createAnimal(formData: FormData) {
    "use server";
  }
  return <form action={createAnimal} />;
}
```

**Não é possível definir Server Function dentro de Client Component** — só importar de um
arquivo com `'use server'` no topo.

### Segurança — não negociável

Server Functions são endpoints `POST` alcançáveis diretamente, fora da UI. **Autentique e
autorize dentro de cada função**, sempre. Nunca confie no fato de o botão estar escondido.

Neste projeto isso inclui o escopo de organização: toda ação precisa checar que o recurso
pertence à organização do usuário.

### Invocação

- `<form action={fn}>` — recebe `FormData` automaticamente; funciona sem JS em Server
  Component.
- `<button formAction={fn}>`.
- Event handler em Client Component (`onClick`).
- `useActionState(fn, initial)` → `[state, action, pending]` para estado pendente.
- `useEffect` + `startTransition` para disparo automático.

As chamadas são despachadas **uma por vez** pelo cliente. Não use Server Function para busca
paralela de dados.

### Depois da mutação

```ts
import { redirect } from "next/navigation";
import { revalidatePath, revalidateTag } from "next/cache";
```

- `refresh()` (de `next/cache`) — atualiza o router do cliente; **não** revalida tag.
- `revalidatePath(path)` / `revalidateTag(tag)` — invalidam o cache.
- `updateTag(tag)` — expira imediatamente (usado com Cache Components).
- `redirect(path)` — lança exceção de controle de fluxo; **nada depois dele executa**. Chame
  a revalidação antes.
- `cookies()` de `next/headers` é `async` — `await cookies()`. Escrever cookie numa Server
  Action re-renderiza a página no servidor.
