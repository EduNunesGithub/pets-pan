---
name: tanstack-form
description: Referência do TanStack Form v1 (estado de formulário type-safe) usada neste projeto. Use SEMPRE antes de escrever ou alterar qualquer formulário — login, cadastro, criação/edição de entidade, qualquer `<form>` com estado. Cobre `useForm`, `form.Field`, a API do field, validação com schema Zod via Standard Schema, o binding do design system com `createFormHook`/`useAppForm`, e formulário como Server Action (`@tanstack/react-form-nextjs`). Gatilhos: formulário, form, campo, input controlado, `useForm`, `form.Field`, `field.handleChange`, `validators`, `field.state.meta.errors`, `createFormHook`, `useAppForm`, `createServerValidate`, submit, estado de submit.
---

# TanStack Form v1 — estado de formulário

Versões de referência: **`@tanstack/react-form@1.33.3`** e, só para formulário que é Server
Action, **`@tanstack/react-form-nextjs@1.33.3`** (dist-tag `latest` do npm). React 19,
TypeScript 6. Documentação consultada em 2026-08-02.

Substitui o `useState` manual dos formulários: dono do valor, do estado de submit/erro e da
validação, tipado a partir de `defaultValues`. Consome um schema **Zod** direto (Standard Schema),
então o mesmo schema valida o form no cliente e a Server Action no servidor.

Se algo aqui não cobrir sua dúvida, **não escreva de memória** — busque a página no
[mapa de documentação](#mapa-de-documentação) e leia antes.

---

## ⚠️ Armadilha de versão — o adapter do Zod sumiu na v1

Antes da v1, ligar o Zod exigia um **adapter** (`@tanstack/zod-form-adapter`, `zodValidator`).
Na v1 isso **não existe mais**: o TanStack Form implementa **Standard Schema** e você passa o
schema Zod **direto** em `validators`. Qualquer exemplo que importe `zodValidator` ou
`@tanstack/zod-form-adapter`, ou que faça `validatorAdapter: zodValidator`, é **pré-v1** — não
copie. E o Next entra por um **pacote separado** (`@tanstack/react-form-nextjs`), nunca por um
subpath `@tanstack/react-form/nextjs`.

---

## 1. Instalação

O repositório fixa versão exata; o `.npmrc` da raiz já tem `legacy-peer-deps=true`:

```bash
npm i @tanstack/react-form@1.33.3 --save-exact
```

O pacote do Next só entra quando um formulário for **Server Action com aprimoramento progressivo**
(§6). Não instale por antecipação:

```bash
npm i @tanstack/react-form-nextjs@1.33.3 --save-exact
```

Peer é só `react` (`^17 || ^18 || ^19`) — o 19 que já temos.

---

## 2. Fronteira Server/Client (skill `nextjs`)

`useForm` é hook: **todo formulário é Client Component**. O arquivo leva `'use client'` na
primeira linha. Isole o form numa folha (`components/<nome>-form/index.tsx`); não suba a diretiva
para o layout ou para a `page`.

---

## 3. O básico

```tsx
"use client";

import { useForm } from "@tanstack/react-form";

export function ExampleForm() {
  const form = useForm({
    defaultValues: { name: "" },
    onSubmit: async ({ value }) => {
      await save(value);
    },
  });

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        event.stopPropagation();
        void form.handleSubmit();
      }}
    >
      <form.Field name="name">
        {(field) => (
          <input
            name={field.name}
            onBlur={field.handleBlur}
            onChange={(event) => field.handleChange(event.target.value)}
            value={field.state.value}
          />
        )}
      </form.Field>

      <form.Subscribe
        selector={(state) => [state.canSubmit, state.isSubmitting]}
      >
        {([canSubmit, isSubmitting]) => (
          <button disabled={!canSubmit} type="submit">
            {isSubmitting ? "Salvando…" : "Salvar"}
          </button>
        )}
      </form.Subscribe>
    </form>
  );
}
```

- **`useForm({ defaultValues, onSubmit, validators })`** — `defaultValues` fixa os tipos.
- **`form.Field`** com render prop — o `field` traz `field.name`, `field.state.value`,
  `field.handleChange(v)`, `field.handleBlur()`, `field.state.meta` (`errors`, `isValid`,
  `errorMap`, `isTouched`…).
- **`form.handleSubmit()`** dispara o submit; chame após `preventDefault`/`stopPropagation`.
- **`form.Subscribe`** com `selector` para reagir a fatia do estado (`canSubmit`, `isSubmitting`)
  sem re-renderizar o form inteiro.

---

## 4. Validação com Zod (Standard Schema)

Passe o schema Zod **direto** no `validators` — sem adapter. Escolha o momento (`onChange`,
`onBlur`, `onSubmit`, e as versões `…Async` com `asyncDebounceMs`).

**Nível de formulário** (o objeto inteiro):

```tsx
import { useForm } from "@tanstack/react-form";
import { z } from "zod";

const signInInput = z.object({
  email: z.email("E-mail inválido."),
  password: z.string().min(1, "Informe a senha."),
});

const form = useForm({
  defaultValues: { email: "", password: "" },
  validators: { onChange: signInInput },
});
```

**Nível de campo** (só aquele campo):

```tsx
<form.Field name="email" validators={{ onBlur: z.email("E-mail inválido.") }}>
  {(field) => <input {}/>}
</form.Field>
```

> **Armadilha do erro-objeto.** Com validador de Standard Schema, `field.state.meta.errors` guarda
> **issues** (objetos com `.message`), não strings. Leia `field.state.meta.errors.map((e) =>
e.message).join(", ")` — um `errors.join(", ")` cru imprime `[object Object]`.

O schema vem do **módulo de domínio** quando descreve uma entidade, ou fica junto do form quando é
o payload daquele endpoint — a regra de colocação e a doutrina "parse na borda" estão na skill
`zod` (§2–3). Um schema, dois guardas: aqui no cliente (UX), e de novo na Server Action (autoridade).

---

## 5. Reaproveitar os campos do design system — `createFormHook`

Para não repetir a fiação `useFieldContext`/erro em cada campo, registre **componentes de campo**
uma vez e use `useAppForm`. É aqui que o campo do form encontra o **`Field` do Base UI** (skill
`base-ui` §6) e os nossos tokens.

**O módulo do form-hook** (uma vez, client):

```tsx
"use client";

import { createFormHook, createFormHookContexts } from "@tanstack/react-form";

import { TextField } from "@/components/text-field";

export const { fieldContext, formContext, useFieldContext } =
  createFormHookContexts();

export const { useAppForm } = createFormHook({
  fieldComponents: { TextField },
  fieldContext,
  formComponents: {},
  formContext,
});
```

**O componente de campo**, ligando estado (TanStack) + acessibilidade e pele (Base UI `Field` +
tokens). Ele lê o field do contexto — nada de prop-drilling:

```tsx
"use client";

import { Field } from "@base-ui/react/field";

import { useFieldContext } from "@/components/app-form";

export function TextField({ label }: { label: string }) {
  const field = useFieldContext<string>();

  return (
    <Field.Root className="flex flex-col gap-pair" name={field.name}>
      <Field.Label className="font-mono text-muted text-xs tracking-widest uppercase">
        {label}
      </Field.Label>
      <Field.Control
        className="bg-transparent border-b border-line h-control outline-none text-base text-ink w-full focus:border-pine"
        onBlur={field.handleBlur}
        onChange={(event) => field.handleChange(event.target.value)}
        value={field.state.value}
      />
      {field.state.meta.isValid ? null : (
        <Field.Error className="text-danger text-sm">
          {field.state.meta.errors.map((error) => error.message).join(", ")}
        </Field.Error>
      )}
    </Field.Root>
  );
}
```

**Usando:** `useAppForm` no lugar de `useForm`, `form.AppField` no lugar de `form.Field`, e o
campo registrado sai por `field.TextField`:

```tsx
const form = useAppForm({ defaultValues: { email: "" } });

<form.AppField name="email">
  {(field) => <field.TextField label="E-mail" />}
</form.AppField>;
```

Para quebrar um form grande em pedaços tipados, há o **`withForm`** (HOC que recebe a instância do
form + props) — ver o guia de composição.

> Onde moram o módulo do form-hook e os campos: seguem a `write-code` — um por pasta,
> `components/<nome>/index.tsx` (o hook/contexto pode ser `.ts` sem JSX). A pasta exata (`app-form`,
> `form/…`) é decisão de setup; alinhe antes de espalhar.

---

## 6. Formulário que é Server Action

Quando o mutation é uma **Server Action** (entidade de domínio, não o Better Auth), dá para rodar
o **mesmo schema no servidor** com aprimoramento progressivo, via `@tanstack/react-form-nextjs`:

- **`formOptions({ defaultValues })`** num módulo compartilhado (cliente + action) fixa a forma.
- **`createServerValidate({ ...formOpts, onServerValidate })`** valida na action; em falha lança
  **`ServerValidateError`**. O `onServerValidate` é onde o **Zod** roda no servidor — a autoridade
  da doutrina "parse na borda" (skill `zod` §2) — junto com auth, authz e escopo de organização.
- A action captura o erro e devolve `error.formState`.
- No cliente, **`initialFormState`** + `useActionState` + `useTransform(mergeForm, state)` mesclam
  o erro do servidor de volta ao form.

A mecânica completa está no guia de SSR — leia antes de escrever, é API específica do pacote do
Next. O ponto de arquitetura: **client valida para UX, a Server Action valida como autoridade, com
o mesmo schema Zod**.

---

## 7. Nossos formulários de auth (Better Auth)

Sign-in/sign-up **não** são Server Action — chamam o `authClient` (skill `better-auth`). Então
são **client-only**: `useForm` + validação Zod, e no `onSubmit` a chamada ao Better Auth.

```tsx
const form = useForm({
  defaultValues: { email: "", password: "" },
  onSubmit: async ({ value }) => {
    const { error } = await authClient.signIn.email(value);
    if (error) {
      setSubmitError(error.message ?? "Não foi possível entrar.");
      return;
    }
    router.push("/");
  },
  validators: { onChange: signInInput },
});
```

A validação de campo passou a ser do Zod-via-TanStack; o erro **de submit** do Better Auth (ex.:
credencial inválida) fica num aviso de nível de form. **Não** use os helpers de
`@tanstack/react-form-nextjs` aqui — não há Server Action nesse fluxo.

---

## 8. Conciliação com `write-code`

- **`'use client'`** em todo arquivo de form e nos componentes de campo.
- **Um componente por arquivo**, `components/<nome>/index.tsx`; cada campo registrado em sua pasta.
- **Props em JSX alfabéticas** (`name` antes de `onBlur` antes de `onChange` antes de `value`). A
  ordem dos `validators` (`onChange`/`onBlur`/`onSubmit`) é semântica — não alfabetize dentro dela.
- **Sem `any`.** `useFieldContext<string>()` é tipado; `useForm` infere de `defaultValues`.
- **Sem comentário** — nome de campo, de schema e de componente já explicam.

---

## 9. Armadilhas

- **Adapter do Zod (pré-v1).** `zodValidator` / `@tanstack/zod-form-adapter` não existem na v1 —
  passe o schema direto.
- **Pacote do Next errado.** É `@tanstack/react-form-nextjs` (separado), não um subpath.
- **`errors` como string.** Com Zod, são objetos de issue — use `.map((e) => e.message)`.
- **Submit sem `preventDefault`.** Chame `event.preventDefault()` e `event.stopPropagation()`
  antes de `form.handleSubmit()`, senão o navegador navega.
- **`'use client'` esquecido.** `useForm` é hook; sem a diretiva, quebra no Server Component.
- **Erro de form sobrescrito.** Um erro de validação de **formulário** pode ser sobrescrito pela
  validação **específica de campo** — ver o guia de validação.
- **Forçar o pacote do Next no auth.** Sign-in/sign-up são `authClient`, client-only — sem
  `createServerValidate`.

---

## Mapa de documentação

Quando este arquivo não cobrir, busque a URL antes de escrever. Prefixo:
`https://tanstack.com/form/latest/docs`.

| Assunto                         | Caminho                                    |
| ------------------------------- | ------------------------------------------ |
| Visão geral                     | `/overview`                                |
| Instalação                      | `/framework/react/installation`            |
| Quick start                     | `/framework/react/quick-start`             |
| Conceitos básicos               | `/framework/react/guides/basic-concepts`   |
| Validação (Zod/Standard Schema) | `/framework/react/guides/validation`       |
| Composição (`createFormHook`)   | `/framework/react/guides/form-composition` |
| SSR / Next / Server Actions     | `/framework/react/guides/ssr`              |
| Arrays de campos                | `/framework/react/guides/arrays`           |
| Campos ligados                  | `/framework/react/guides/linked-fields`    |
| Listeners                       | `/framework/react/guides/listeners`        |
| Reatividade                     | `/framework/react/guides/reactivity`       |
| API — `FormApi`                 | `/reference/classes/FormApi`               |

---

## Pare e pergunte

- Um exemplo usa `zodValidator` ou `@tanstack/zod-form-adapter`, ou `validatorAdapter` — é
  **pré-v1**; passe o schema direto e desconfie do resto.
- A API que você precisa **não está** aqui e a doc não confirma o comportamento na `1.33.3`.
- O formulário precisa ser **Server Action com aprimoramento progressivo** e o guia de SSR não
  cobre o seu caso — pergunte antes de inventar a fiação de `mergeForm`/`createServerValidate`.
- **Onde** moram o módulo do form-hook e os campos registrados, se colidir com uma convenção já
  combinada — alinhe.
