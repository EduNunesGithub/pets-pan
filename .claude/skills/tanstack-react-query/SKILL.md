---
name: tanstack-react-query
description: Referência do TanStack Query v5 (React Query — estado assíncrono e mutação no cliente) usada neste projeto. Use SEMPRE antes de escrever ou alterar qualquer mutação de cliente — submit de form que chama `authClient` ou uma Server Action, qualquer `useMutation` — ou o provider (`QueryClientProvider`). Cobre o setup do provider no App Router com `isServer`/`getQueryClient`, `useMutation` (estado `isPending`/`error`, `mutate` vs `mutateAsync`), o casamento com o TanStack Form, o gotcha do `redirect()` de Server Action, e a fronteira com Cache Components (o que NÃO buscar por aqui). Gatilhos: `useMutation`, `QueryClient`, `QueryClientProvider`, `getQueryClient`, `isServer`, `mutationFn`, `mutation.isPending`, `mutation.error`, `mutate`, `mutateAsync`, `onSuccess`, React Query, estado de submit, provider.
---

# TanStack Query v5 — React Query

Versão de referência: **`@tanstack/react-query@5.101.4`** (dist-tag `latest`, fixada exata). React 19,
TypeScript 6, Next.js 16 App Router com **Cache Components**. Documentação consultada em 2026-08-03.

Aqui o React Query cumpre **um** papel: dono do estado de uma **mutação de cliente** — o submit de
form que chama o `authClient` (skill `better-auth`) ou uma Server Action. Ele carrega `isPending`,
`error`, `isSuccess` e os callbacks de ciclo de vida, aposentando o par `useState` +
`try/catch` manual que os forms tinham. O TanStack Form (skill `tanstack-form`) continua dono do
**valor** e da **validação**; o React Query passa a ser dono do **pending** e do **erro** da mutação.

Se algo aqui não cobrir sua dúvida, **não escreva de memória** — busque a página no
[mapa de documentação](#mapa-de-documentação) e leia antes.

---

## ⚠️ O que NÃO é trabalho do React Query aqui — a fronteira com Cache Components

Este app é **`cacheComponents: true`** (PPR — skill `nextjs`). Leitura de **server state** mora no
servidor: Server Component com `'use cache'`, ou um read runtime sob `<Suspense>`. **Não** troque
isso por `useQuery` no cliente. `useQuery` faz o dado ser buscado **no cliente** (dynamic, sem o
prerender do PPR), joga fora o cache do servidor e obriga hidratação. Regra prática:

- **Ler** dado do servidor para exibir → Server Component (skill `nextjs`), **não** `useQuery`.
- **Mutar** por interação do cliente (submit, botão) → `useMutation`. **É só isto que usamos.**

`useQuery` e o setup de hidratação SSR **não** estão adotados. Se aparecer necessidade real de
`useQuery` (ex.: busca incremental client-side, infinite scroll), **pare e pergunte** — é decisão de
arquitetura, não de implementação, e o guia de SSR/hidratação entra junto.

---

## ⚠️ Armadilha de versão — `isServer` é boolean, não método

O helper do provider no App Router usa o export **`isServer`** de `@tanstack/react-query`, que é um
**boolean** (`if (isServer)`), não `environmentManager.isServer()` nem `isServer()`. Qualquer exemplo
que chame algo como `environmentManager.isServer()` está errado para a `5.101.4` — verificado contra
o pacote instalado. Na v5 o pacote é **`@tanstack/react-query`** (não `react-query`, que era a v3).

---

## 1. Instalação

O repositório fixa versão exata; o `.npmrc` da raiz já tem `legacy-peer-deps=true`:

```bash
npm i @tanstack/react-query@5.101.4 --save-exact
```

Peer é só `react` (`^18 || ^19`) — o 19 que já temos. O `@tanstack/eslint-plugin-query` é opcional e
**não** está instalado; não adicione sem alinhar (mexe no flat config do ESLint).

---

## 2. Fronteira Server/Client (skill `nextjs`)

`QueryClientProvider`, `useMutation` e `useQuery` são hooks/Context: **cliente**. O provider leva
`'use client'`; o `layout.tsx` (Server Component) só o **monta** em volta de `children`. Um provider
client pode envolver filhos server passados por `children` — o `layout` continua server.

---

## 3. O provider no App Router — `getQueryClient` com `isServer`

No servidor, **cada request precisa do seu QueryClient** (senão dois usuários compartilham cache); no
navegador, um **singleton** basta (não recriar a cada suspensão de render). O padrão oficial:

```tsx
"use client";

import {
  isServer,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";

import type { ReactNode } from "react";

function makeQueryClient() {
  return new QueryClient();
}

let browserQueryClient: QueryClient | undefined;

function getQueryClient() {
  if (isServer) {
    return makeQueryClient();
  }

  browserQueryClient ??= makeQueryClient();
  return browserQueryClient;
}

export function QueryProvider({ children }: { children: ReactNode }) {
  const queryClient = getQueryClient();

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
```

Montado no layout, **dentro** do `<body>`, envolvendo `children`. É o `Context` que todo `useMutation`
precisa: sem o provider acima na árvore, `useMutation` quebra em runtime.

---

## 4. `useMutation` — o básico

```tsx
"use client";

import { useMutation } from "@tanstack/react-query";

const mutation = useMutation({
  mutationFn: async (value: SignInValue) => {
    const { error } = await authClient.signIn.email(value);
    if (error) {
      throw new Error(error.message ?? "Não foi possível entrar.");
    }
  },
  onSuccess: () => {
    router.push(redirectTo);
  },
});
```

Estado e métodos que usamos:

- **`mutation.isPending`** — a mutação está rodando. É a fonte do "Entrando…" e do `disabled`.
- **`mutation.error`** — o `Error` lançado pela `mutationFn` (ou `null`). É a fonte do aviso de erro.
- **`mutation.mutate(value)`** — dispara e **não lança**; erros caem em `onError`/`mutation.error`.
- **`mutation.mutateAsync(value)`** — devolve Promise que **rejeita** em erro (precisa de `try/catch`).
- **`mutation.reset()`** — limpa `error`/`data`.
- Callbacks: **`onSuccess`**, **`onError`**, **`onSettled`**.

> **A `mutationFn` precisa lançar em falha.** O `authClient` devolve `{ data, error }` e **não lança**;
> a Server Action pode devolver `{ error }`. Para o React Query enxergar a falha (setar `error`,
> chamar `onError`), a `mutationFn` tem que **`throw`** quando esse `error` existe. Se não lançar, a
> mutação vira sucesso silencioso.

---

## 5. Casamento com o TanStack Form — quem é dono de quê

O form (skill `tanstack-form`) continua dono do **valor** e da **validação** (`canSubmit`); a mutação
vira dona do **pending** e do **erro**. Use **`mutate`** dentro do `onSubmit` (não `mutateAsync`) —
assim nada rejeita para fora do `handleSubmit`, e o botão lê `mutation.isPending` direto:

```tsx
const form = useAppForm({
  defaultValues: { email: "", password: "" },
  onSubmit: ({ value }) => {
    mutation.mutate(value);
  },
  validators: { onChange: signInInput },
});

// erro de submit: mutation.error?.message
// botão:
<form.Subscribe selector={(state) => state.canSubmit}>
  {(canSubmit) => (
    <button disabled={!canSubmit || mutation.isPending} type="submit">
      {mutation.isPending ? "Entrando…" : "Entrar"}
    </button>
  )}
</form.Subscribe>;
```

O `useState<string | null>(submitError)` e o `setSubmitError` **saem** — o erro é `mutation.error`. Um
novo `mutate` limpa o erro anterior automaticamente no início da corrida, então não é preciso `reset`
manual no fluxo comum.

---

## 6. Server Action com `useMutation` — o gotcha do `redirect()`

Uma `mutationFn` pode chamar uma **Server Action**. Mas se a action fizer **`redirect()`** no servidor,
o `redirect()` lança `NEXT_REDIRECT` — que a `mutationFn` propaga como **erro**, disparando `onError`
mesmo num caminho de sucesso. Então:

- A Server Action usada por `useMutation` **retorna resultado** (`{ error }` ou sucesso) — **não**
  `redirect()`.
- A navegação acontece no **cliente**, no `onSuccess` (`router.push(...)`).
- A action **continua** revalidando sessão/authz no servidor (autoridade — skill `better-auth`); só o
  **redirect** é que migra para o cliente.

```tsx
const mutation = useMutation({
  mutationFn: async (value: CreateOrganizationInput) => {
    const result = await createOrganizationAction(value);
    if (result?.unauthenticated) {
      router.push("/sign-in?redirect=/organizations/new");
      return;
    }
    if (result?.error) {
      throw new Error(result.error);
    }
  },
  onSuccess: () => {
    router.push("/");
  },
});
```

---

## 7. Conciliação com `write-code`

- **`'use client'`** no provider e em todo arquivo com `useMutation`.
- **Um componente por arquivo**, `components/<nome>/index.tsx`.
- **Chaves de objeto e imports em ordem alfabética** (`isServer`, `QueryClient`, `QueryClientProvider`).
- **Sem `any`.** Tipe a variável da `mutationFn` (`SignInValue`, `CreateOrganizationInput`); o retorno é
  inferido.
- **Sem comentário** — `mutationFn`/`onSuccess`/`isPending` já se explicam.

---

## 8. Armadilhas

- **`isServer` como função.** É boolean: `if (isServer)`. `environmentManager.isServer()` não existe na v5.
- **Pacote da v3.** É `@tanstack/react-query`, não `react-query`.
- **`mutationFn` que não lança.** `{ error }` do `authClient`/action não vira erro sozinho — precisa de `throw`.
- **`mutateAsync` sem `try/catch`.** Rejeita; sem captura vira unhandled rejection. Prefira `mutate` no `onSubmit`.
- **`redirect()` em action sob `useMutation`.** Vira `NEXT_REDIRECT`-como-erro. Retorne e navegue no cliente (§6).
- **Provider ausente.** `useMutation` sem `QueryClientProvider` acima na árvore quebra em runtime.
- **`useQuery` para server state.** Não. Leitura fica no servidor sob Cache Components (§ topo).

---

## Mapa de documentação

Quando este arquivo não cobrir, busque a URL antes de escrever. Prefixo:
`https://tanstack.com/query/latest/docs/framework/react`.

| Assunto                      | Caminho                  |
| ---------------------------- | ------------------------ |
| Visão geral                  | `/overview`              |
| Instalação                   | `/installation`          |
| Mutações (`useMutation`)     | `/guides/mutations`      |
| Setup Next.js / SSR avançado | `/guides/advanced-ssr`   |
| Queries (`useQuery`)         | `/guides/queries`        |
| `QueryClient` (referência)   | `/reference/QueryClient` |
| `useMutation` (referência)   | `/reference/useMutation` |

---

## Pare e pergunte

- Surgiu necessidade de **`useQuery`** / leitura client-side de server state — é decisão de arquitetura
  sob Cache Components; o setup de hidratação SSR entra junto. Não improvise.
- Um exemplo usa `react-query` (v3), `environmentManager.isServer()`, ou um adapter — é de outra versão.
- A Server Action que a mutação chama **precisa** de `redirect()` no servidor e não dá para retornar —
  alinhe antes; o gotcha de §6 muda a fiação.
- A API que você precisa **não está** aqui e a doc não confirma o comportamento na `5.101.4`.
