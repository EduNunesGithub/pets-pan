---
name: nextjs
description: Next.js 16 App Router. Use antes de escrever ou alterar qualquer coisa que MUDE o framework — rota, page/layout/route handler, fronteira Server/Client, Server Action, fetch de dados, cache/revalidação, next.config. NÃO é necessária para mudança puramente visual (classe, tipografia, espaçamento) num componente existente. Gatilhos: criar página, criar rota, criar API, buscar dados, mutar dados, cache, revalidar, streaming, Suspense, params, searchParams, use client.
---

# Next.js 16 — App Router

Versão de referência: **Next.js 16.2.12**, React 19, TypeScript 6. Documentação consultada
em 2026-07-28.

## Referências desta skill

Carregue **só** o tópico que a tarefa toca:

| Preciso de                                                                         | Leia                    |
| ---------------------------------------------------------------------------------- | ----------------------- |
| Estrutura de `app/`, arquivos de convenção, tipos de rota, fronteira Server/Client | `references/routing.md` |
| Buscar dados, streaming, Server Functions, pós-mutação                             | `references/data.md`    |
| Cache Components/PPR, `next.config`, `tsconfig`, mapa da doc oficial               | `references/caching.md` |

Se nada disso cobrir, **não escreva de memória** — o mapa da documentação oficial está no
fim de `references/caching.md`.

## Decisões fixas do projeto

- **Cache Components (`cacheComponents: true`)** — nada é cacheado sem `'use cache'` e
  **não se usa `export const dynamic` nem `force-dynamic`**. Uma leitura de dado runtime
  vira buraco dinâmico quando fica sob `<Suspense>` **e** alcança API dinâmica (`cookies`,
  `headers`, `searchParams`, ou `await connection()` num read sem request). Sem esse sinal,
  o build tenta prerenderizar e executa o read. Detalhes e padrão em
  `references/caching.md`.
- **`typedRoutes: true`** — use os helpers globais `PageProps`/`LayoutProps`/`RouteContext`;
  nunca declare tipos locais com esses nomes.
- **`typescript.ignoreBuildErrors` é proibido.**
- `page.tsx`/`layout.tsx`/`route.ts` têm nome fixo e ficam direto no segmento — a regra
  `nome/index.tsx` vale para **componentes**, que moram fora de `app/` (`components/`) e
  entram por alias `@/`.
- Server Function é endpoint `POST` público: **autentique e autorize dentro de cada função**,
  incluindo o escopo de organização (skill `drizzle`).

## Armadilhas

- `await` esquecido em `params`, `searchParams`, `cookies()` e `headers()` — todos são
  Promise.
- `'use client'` no `layout` raiz — arrasta a árvore inteira para o cliente. Ponha a
  diretiva na folha interativa.
- Provider de contexto envolvendo `<html>` em vez de só `{children}`.
- Esperar que `fetch` seja cacheado: no Next 16 ele **não** é, por padrão.
- Autorização só na UI, sem checagem dentro da Server Function.
- `redirect()` chamado antes da revalidação — nada depois dele executa.
- Tipo local chamado `PageProps` / `LayoutProps` sombreando o helper global.
- Confundir `refresh()` com `revalidateTag()`.
- Assumir que `<Suspense>` torna um componente dinâmico — não torna; trabalho síncrono ainda
  é pré-renderizado.
- `layout` que lê dado runtime não cai no `loading.tsx` do próprio segmento — bloqueia a
  navegação (ver `references/data.md`).

## Pare e pergunte

- A tarefa pede biblioteca de terceiros sem skill no repositório (e-mail, upload, UI kit).
- A API necessária não está nas referências e a documentação não confirma o comportamento na
  16.2.12.
- A solução exigiria `typescript.ignoreBuildErrors`, lint desabilitado ou `any`.
