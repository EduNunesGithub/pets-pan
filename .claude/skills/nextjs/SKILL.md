---
name: nextjs
description: Referência do Next.js 16 App Router usada neste projeto. Use SEMPRE antes de escrever ou alterar qualquer coisa que toque o framework — rotas, page, layout, loading, error, route handler, Server Component, Client Component, `use client`, `use server`, Server Action, fetch de dados, cache, revalidação, metadata, next.config, tipos de rota. Também ao decidir onde um arquivo deve morar dentro de `app/`. Gatilhos: criar página, criar rota, criar layout, criar API, buscar dados, mutar dados, formulário, cache, revalidar, streaming, Suspense, params, searchParams, middleware/proxy.
---

# Next.js 16 — App Router

Versão de referência: **Next.js 16.2.12**, React 19, TypeScript 6. Documentação consultada em
2026-07-28.

Se algo aqui não cobrir sua dúvida, **não escreva de memória** — busque a página no
[mapa de documentação](#mapa-de-documentação) e leia antes.

---

## 1. Estrutura de `app/`

Pastas definem segmentos de URL. Uma rota só fica pública quando ganha um `page` ou um
`route`. Qualquer outro arquivo dentro de `app/` é colocado sem virar rota.

**Arquivos de convenção** (nomes fixos, não renomeie):

| Arquivo        | Extensões           | Papel                               |
| -------------- | ------------------- | ----------------------------------- |
| `default`      | `.js` `.jsx` `.tsx` | Fallback de rota paralela           |
| `error`        | `.js` `.jsx` `.tsx` | Error boundary do segmento          |
| `global-error` | `.js` `.jsx` `.tsx` | Error boundary raiz                 |
| `layout`       | `.js` `.jsx` `.tsx` | UI compartilhada, envolve os filhos |
| `loading`      | `.js` `.jsx` `.tsx` | Suspense boundary do segmento       |
| `not-found`    | `.js` `.jsx` `.tsx` | UI de "não encontrado"              |
| `page`         | `.js` `.jsx` `.tsx` | Rota pública                        |
| `route`        | `.js` `.ts`         | Endpoint HTTP                       |
| `template`     | `.js` `.jsx` `.tsx` | Layout remontado a cada navegação   |

Hierarquia de renderização em cada segmento:
`layout` → `template` → `error` → `loading` → `not-found` → `page` (ou `layout` aninhado).

**Segmentos dinâmicos:**

| Pasta         | Casa com                        |
| ------------- | ------------------------------- |
| `[id]`        | `/animal/123`                   |
| `[...slug]`   | `/docs/a`, `/docs/a/b`          |
| `[[...slug]]` | `/docs`, `/docs/a`, `/docs/a/b` |

**Organização sem afetar a URL:**

- `(grupo)` — route group: some da URL. Serve para separar seções e para dar layouts
  diferentes ao mesmo nível.
- `_pasta` — private folder: sai inteiramente do roteamento.

`layout` raiz é obrigatório e precisa conter `<html>` e `<body>`.

### Conciliação com as convenções do projeto

A skill `write-code` exige `nome-componente/index.tsx`. Isso vale para **componentes**, não
para os arquivos de convenção do Next — `page.tsx`, `layout.tsx` e `route.ts` têm nome fixo e
ficam direto no segmento.

Componentes de UI não são arquivos de rota. Coloque-os fora de `app/` (ex.: `components/`),
seguindo `kebab-case/index.tsx`, e importe por alias `@/`.

---

## 2. Server e Client Components

**Tudo é Server Component por padrão.** `page` e `layout` inclusive.

Use **Client Component** (`'use client'` na primeira linha do arquivo) quando precisar de:
estado, event handler, `useEffect`, hook customizado, ou API de browser (`window`,
`localStorage`).

Use **Server Component** quando precisar de: acesso a banco, segredo/token, redução de
JavaScript no cliente, streaming.

### Semântica de `'use client'`

`'use client'` declara uma **fronteira do grafo de módulos**, não um componente isolado.
A partir dele, tudo que o arquivo **importa** e os componentes que ele **renderiza
diretamente** entram no bundle do cliente. Não é preciso repetir a diretiva em cada
componente abaixo.

A fronteira **não** captura Server Components recebidos como `children` ou outra prop — esses
são renderizados no servidor e chegam já prontos.

```tsx
"use client";

export default function Modal({ children }: { children: React.ReactNode }) {
  return <div>{children}</div>;
}
```

```tsx
export default function Page() {
  return (
    <Modal>
      <Cart />
    </Modal>
  );
}
```

`<Cart />` continua sendo Server Component.

### Regras práticas

- Props passadas de Server para Client precisam ser **serializáveis**.
- React Context **não funciona** em Server Component. Crie um provider `'use client'` que
  aceita `children` e renderize-o o mais fundo possível na árvore.
- Biblioteca de terceiros que usa hooks sem declarar `'use client'`: envolva num arquivo
  próprio com a diretiva e reexporte.
- Só variáveis com prefixo `NEXT_PUBLIC_` vão para o bundle. As demais viram string vazia no
  cliente — o que **não** é proteção suficiente. Para código que nunca pode ir ao cliente,
  importe `server-only` no topo do módulo.

---

## 3. Tipos gerados de rota

O Next gera helpers **globais**, sem import, durante `next dev`, `next build` e
`next typegen`:

```tsx
export default async function Page(props: PageProps<"/animal/[id]">) {
  const { id } = await props.params;
}
```

```tsx
export default function Layout(props: LayoutProps<"/">) {
  return (
    <html lang="pt-BR">
      <body>{props.children}</body>
    </html>
  );
}
```

```ts
export async function GET(
  request: Request,
  context: RouteContext<"/api/animal/[id]">,
) {
  const { id } = await context.params;
}
```

**Não declare tipos locais chamados `PageProps`, `LayoutProps` ou `RouteContext`** — eles
sombreiam os globais e você perde a checagem de rota.

`params` e `searchParams` são **Promise**. Sempre `await`.

---

## 4. Buscar dados

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

---

## 5. Mutar dados — Server Functions

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

---

## 6. Cache

O Next 16 tem **dois modelos**. Qual vale depende de `cacheComponents` no `next.config.ts`.

**Este projeto roda com `cacheComponents: true`** (Cache Components / PPR, decidido na
CAR-119). Nada é cacheado sem `'use cache'` e **não se usa `export const dynamic` nem
`force-dynamic`**. O render é prerenderizado por padrão; uma leitura de dado runtime só vira
**buraco dinâmico** quando fica sob um `<Suspense>` **e** alcança uma API dinâmica — `cookies`,
`headers`, `searchParams`, ou `await connection()` (de `next/server`). Sem esse sinal, o build
tenta prerenderizar e **executa** o read — um read de banco sem request quebra aí. Página
autenticada lê `cookies`, então já é dinâmica; um read de banco cru precisa de `connection()`.
O `<Suspense>` costuma vir do `loading.tsx` do segmento. O marketplace público cacheia com
`'use cache'` + `cacheTag`/`updateTag`.

### Com `cacheComponents: true` (Cache Components / PPR)

```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
};

export default nextConfig;
```

- `'use cache'` no topo de uma função async ou componente cacheia o retorno. Argumentos e
  valores capturados do escopo entram na **chave de cache**.
- `cacheLife('hours')` e `cacheTag('animals')` de `next/cache` controlam vida e invalidação.
- Componente que lê dado runtime (`cookies`, `headers`, `searchParams`, `params` sem
  `generateStaticParams`) **precisa** estar dentro de `<Suspense>`.
- Operação não determinística (`Math.random`, `Date.now`, `crypto.randomUUID`) precisa de
  `await connection()` antes, ou de estar dentro de `'use cache'`.
- Read de banco (ou I/O) **sem** request — sem `cookies`/`headers`/`searchParams` — não é
  dinâmico sozinho: fica sob `<Suspense>` e chama `await connection()` antes, senão o
  prerender executa a query no build.
- Se algo não cacheado ficar fora de `<Suspense>`, o build falha com
  `Uncached data was accessed outside of <Suspense>`.

Padrão de um read runtime sem request (o que o andaime da home usa): `await connection()` sob
o `<Suspense>` do `loading.tsx`. A rota fica `◐ Partial Prerender` — shell estático + conteúdo
dinâmico em stream.

```tsx
import { connection } from "next/server";

import { db } from "@/db";

export default async function Page() {
  await connection();

  const todos = await db.query.todos.findMany();
  return <TodoList todos={todos} />;
}
```

### Sem `cacheComponents`

**Não é o modelo deste projeto** (ver acima) — fica só como referência do modelo anterior:
`/docs/app/guides/caching-without-cache-components`. Não misture as duas APIs.

---

## 7. Configuração

### `next.config.ts`

`package.json` tem `"type": "module"`, então `next.config.ts` aceita sintaxe ESM direta.

```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  typedRoutes: true,
};

export default nextConfig;
```

Esse é o conteúdo atual do arquivo no repositório: `cacheComponents` (CAR-119) e `typedRoutes`.

Opções relevantes: `typedRoutes` (tipa `href` de `next/link` e os métodos de
`next/navigation`), `cacheComponents`, `experimental.typedEnv`, `typescript.tsconfigPath`.

`typescript.ignoreBuildErrors` é proibido neste projeto.

### `tsconfig.json`

- `include` precisa conter `next-env.d.ts`, `.next/types/**/*.ts` e `.next/dev/types/**/*.ts`.
- `paths` define o alias `@/` que a `write-code` exige.
- `strict: true` é pré-requisito para a proibição de `any`.
- Nunca edite `next-env.d.ts` — é gerado. A documentação manda **não versioná-lo**.
- Declaração de tipo customizada vai em arquivo `.d.ts` próprio, adicionado ao `include`.

### Scripts

`next dev` (Turbopack por padrão) · `next build` · `next start` · `eslint`.

A partir do Next 16, `next build` **não roda o linter**. Rode `npm run lint` separado.

---

## 8. Armadilhas comuns

- `await` esquecido em `params`, `searchParams`, `cookies()` e `headers()` — todos são
  Promise.
- `'use client'` posto no `layout` raiz — arrasta a árvore inteira para o cliente. Ponha a
  diretiva na folha interativa.
- Provider de contexto envolvendo `<html>` em vez de só `{children}`.
- Esperar que `fetch` seja cacheado: no Next 16 ele **não** é, por padrão.
- Autorização só na UI, sem checagem dentro da Server Function.
- `redirect()` chamado antes da revalidação.
- Tipo local chamado `PageProps` / `LayoutProps` sombreando o helper global.
- Confundir `refresh()` com `revalidateTag()`.
- Assumir que `<Suspense>` torna um componente dinâmico — ele não torna; trabalho síncrono
  ainda é pré-renderizado.

---

## Mapa de documentação

Quando este arquivo não cobrir, busque a URL antes de escrever. Prefixo:
`https://nextjs.org/docs`.

| Assunto                    | Caminho                                                   |
| -------------------------- | --------------------------------------------------------- |
| Cache / PPR                | `/app/getting-started/caching`                            |
| Cache sem Cache Components | `/app/guides/caching-without-cache-components`            |
| CSS                        | `/app/getting-started/css`                                |
| Error handling             | `/app/getting-started/error-handling`                     |
| Estrutura do projeto       | `/app/getting-started/project-structure`                  |
| Fontes                     | `/app/getting-started/fonts`                              |
| Imagens                    | `/app/getting-started/images`                             |
| Índice completo            | `/llms.txt`                                               |
| Instalação                 | `/app/getting-started/installation`                       |
| Layouts e páginas          | `/app/getting-started/layouts-and-pages`                  |
| Metadata e OG              | `/app/getting-started/metadata-and-og-images`             |
| Mutação de dados           | `/app/getting-started/mutating-data`                      |
| Navegação                  | `/app/getting-started/linking-and-navigating`             |
| `next.config`              | `/app/api-reference/config/next-config-js`                |
| Proxy (ex-middleware)      | `/app/api-reference/file-conventions/proxy`               |
| Revalidação                | `/app/getting-started/revalidating`                       |
| Rotas interceptadas        | `/app/api-reference/file-conventions/intercepting-routes` |
| Rotas paralelas            | `/app/api-reference/file-conventions/parallel-routes`     |
| Route Handlers             | `/app/getting-started/route-handlers`                     |
| Segurança de dados         | `/app/guides/data-security`                               |
| Server e Client Components | `/app/getting-started/server-and-client-components`       |
| Server Actions (detalhes)  | `/app/guides/server-actions`                              |
| TypeScript                 | `/app/api-reference/config/typescript`                    |
| Variáveis de ambiente      | `/app/guides/environment-variables`                       |

---

## Pare e pergunte

- A tarefa pede uma biblioteca de terceiros sem skill no repositório (auth, UI kit, e-mail).
  ORM já tem skill: use a `drizzle`.
- A API necessária não está aqui e a página de documentação não confirma o comportamento na
  versão 16.2.12.
- A solução exigiria `typescript.ignoreBuildErrors`, `eslint` desabilitado ou `any`.
