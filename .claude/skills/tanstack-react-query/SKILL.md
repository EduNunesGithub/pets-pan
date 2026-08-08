---
name: tanstack-react-query
description: TanStack Query v5 (React Query) — estado de mutação no cliente. Use antes de escrever ou alterar qualquer `useMutation` (submit que chama `authClient` ou Server Action) ou o `QueryClientProvider`. NÃO é necessária para mudança puramente visual num componente que usa mutação, e leitura de server state NÃO passa por aqui (é Server Component). Gatilhos: `useMutation`, `QueryClient`, `getQueryClient`, `isServer`, `mutationFn`, `isPending`, `mutation.error`, estado de submit, provider.
---

# TanStack Query v5 — React Query

Versão: **`@tanstack/react-query@5.101.4`** (fixada exata). React 19, Next 16 App Router com
Cache Components. Documentação consultada em 2026-08-03.

Aqui o React Query cumpre **um** papel: dono do estado de uma **mutação de cliente** —
`isPending`, `error`, callbacks — aposentando o `useState` + `try/catch` manual dos forms. O
TanStack Form continua dono do **valor** e da **validação**.

## ⚠️ A fronteira com Cache Components

Leitura de server state mora no **servidor** (Server Component com `'use cache'` ou read
runtime sob `<Suspense>`) — **não** troque por `useQuery`, que busca no cliente, joga fora o
prerender do PPR e obriga hidratação.

- **Ler** dado do servidor → Server Component (skill `nextjs`), não `useQuery`.
- **Mutar** por interação (submit, botão) → `useMutation`. **É só isto que usamos.**

`useQuery` e o setup de hidratação SSR **não estão adotados**. Necessidade real (busca
incremental, infinite scroll)? **Pare e pergunte** — é decisão de arquitetura.

## Referências desta skill

| Preciso de                                                                                                    | Leia                  |
| ------------------------------------------------------------------------------------------------------------- | --------------------- |
| Provider (`getQueryClient`/`isServer`), `useMutation`, fiação com o form, gotcha do `redirect()`, mapa da doc | `references/usage.md` |

## Decisões fixas do projeto

- **Provider já existe**: `components/query-provider`, montado no layout dentro do `<body>`.
- **`isServer` é boolean** (`if (isServer)`), não método — verificado contra o pacote
  instalado. Pacote é `@tanstack/react-query`; `react-query` é a v3.
- **`mutate` no `onSubmit`** (não `mutateAsync`) — nada rejeita para fora do
  `handleSubmit`.
- **Server Action sob `useMutation` retorna resultado, não `redirect()`** — o redirect vira
  `NEXT_REDIRECT`-como-erro; navegue no cliente, no `onSuccess`.

## Armadilhas

- **`mutationFn` que não lança** — `{ error }` do `authClient`/action não vira erro sozinho;
  precisa de `throw`, senão sucesso silencioso.
- **`mutateAsync` sem `try/catch`** — unhandled rejection; prefira `mutate`.
- **`redirect()` em action sob `useMutation`** — dispara `onError` no caminho feliz.
- **Provider ausente** — `useMutation` quebra em runtime.
- **`useQuery` para server state** — não; leitura fica no servidor.
- **`environmentManager.isServer()`** — não existe na v5; exemplo de outra versão.

## Pare e pergunte

- Surgiu necessidade de `useQuery`/leitura client-side — decisão de arquitetura sob Cache
  Components; o setup de hidratação entra junto.
- A action precisa mesmo de `redirect()` no servidor — alinhe antes; muda a fiação.
- A API necessária não está na referência e a doc não confirma o comportamento na `5.101.4`.
