# TanStack Query — provider, useMutation e a fiação com o form

## O provider no App Router — `getQueryClient` com `isServer`

No servidor, **cada request precisa do seu QueryClient** (senão dois usuários compartilham
cache); no navegador, um **singleton** basta. O padrão oficial — já implementado em
`components/query-provider`:

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

Montado no layout, **dentro** do `<body>`, envolvendo `children` — o `layout` continua
Server Component. Sem o provider acima na árvore, `useMutation` quebra em runtime.

## `useMutation` — o básico

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

- **`mutation.isPending`** — fonte do "Entrando…" e do `disabled`.
- **`mutation.error`** — o `Error` lançado pela `mutationFn` (ou `null`).
- **`mutation.mutate(value)`** — dispara e **não lança**; erros caem em
  `onError`/`mutation.error`.
- **`mutation.mutateAsync(value)`** — devolve Promise que **rejeita** (exige `try/catch`).
- **`mutation.reset()`** — limpa `error`/`data`.
- Callbacks: `onSuccess`, `onError`, `onSettled`.

> **A `mutationFn` precisa lançar em falha.** O `authClient` devolve `{ data, error }` e
> **não lança**; a Server Action pode devolver `{ error }`. Para o React Query enxergar a
> falha, a `mutationFn` tem que **`throw`** quando esse `error` existe — senão a mutação
> vira sucesso silencioso.

## Casamento com o TanStack Form — quem é dono de quê

O form é dono do **valor** e da **validação** (`canSubmit`); a mutação é dona do **pending**
e do **erro**. Use **`mutate`** dentro do `onSubmit` (não `mutateAsync`):

```tsx
const form = useAppForm({
  defaultValues: { email: "", password: "" },
  onSubmit: ({ value }) => {
    mutation.mutate(value);
  },
  validators: { onChange: signInInput },
});

<form.Subscribe selector={(state) => state.canSubmit}>
  {(canSubmit) => (
    <button disabled={!canSubmit || mutation.isPending} type="submit">
      {mutation.isPending ? "Entrando…" : "Entrar"}
    </button>
  )}
</form.Subscribe>;
```

O erro de submit é `mutation.error?.message` — o par `useState`/`setSubmitError` **saiu**.
Um novo `mutate` limpa o erro anterior automaticamente no início da corrida.

## Server Action com `useMutation` — o gotcha do `redirect()`

Se a action fizer **`redirect()`** no servidor, ele lança `NEXT_REDIRECT` — que a
`mutationFn` propaga como **erro**, disparando `onError` num caminho de sucesso. Então:

- A Server Action usada por `useMutation` **retorna resultado** (`{ error }` ou sucesso) —
  **não** `redirect()`.
- A navegação acontece no **cliente**, no `onSuccess` (`router.push(...)`).
- A action **continua** revalidando sessão/authz no servidor; só o redirect migra.

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

## Mapa da documentação oficial

Prefixo: `https://tanstack.com/query/latest/docs/framework/react`.

| Assunto                      | Caminho                  |
| ---------------------------- | ------------------------ |
| Visão geral                  | `/overview`              |
| Instalação                   | `/installation`          |
| Mutações (`useMutation`)     | `/guides/mutations`      |
| Setup Next.js / SSR avançado | `/guides/advanced-ssr`   |
| Queries (`useQuery`)         | `/guides/queries`        |
| `QueryClient` (referência)   | `/reference/QueryClient` |
| `useMutation` (referência)   | `/reference/useMutation` |
