# Next.js — cache (Cache Components / PPR) e configuração

## Cache Components — o modelo deste projeto

O Next 16 tem **dois modelos**; qual vale depende de `cacheComponents` no `next.config.ts`.
**Este projeto roda com `cacheComponents: true`** (decidido na CAR-119). Não misture as duas
APIs.

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

Padrão de um read runtime sem request: `await connection()` sob o `<Suspense>` do
`loading.tsx`. A rota fica `◐ Partial Prerender` — shell estático + conteúdo dinâmico em
stream.

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

**Não é o modelo deste projeto** — referência do modelo anterior em
`/docs/app/guides/caching-without-cache-components`.

## Configuração

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

Esse é o conteúdo atual do arquivo no repositório: `cacheComponents` (CAR-119) e
`typedRoutes`.

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

## Mapa da documentação oficial

Quando a skill não cobrir, busque a URL antes de escrever. Prefixo: `https://nextjs.org/docs`.

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
