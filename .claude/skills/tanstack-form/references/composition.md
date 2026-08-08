# TanStack Form — composição, Server Actions e os forms de auth

## Reaproveitar os campos do design system — `createFormHook`

Para não repetir a fiação `useFieldContext`/erro em cada campo, registre **componentes de
campo** uma vez e use `useAppForm`. É aqui que o campo do form encontra o **`Field` do Base
UI** (skill `base-ui`) e os nossos tokens.

**O módulo do form-hook** (uma vez, client) — no projeto, `components/app-form`:

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

**O componente de campo**, ligando estado (TanStack) + acessibilidade e pele (Base UI
`Field` + tokens). Ele lê o field do contexto — nada de prop-drilling:

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

**Usando:** `useAppForm` no lugar de `useForm`, `form.AppField` no lugar de `form.Field`, e
o campo registrado sai por `field.TextField`:

```tsx
const form = useAppForm({ defaultValues: { email: "" } });

<form.AppField name="email">
  {(field) => <field.TextField label="E-mail" />}
</form.AppField>;
```

Para quebrar um form grande em pedaços tipados, há o **`withForm`** (HOC que recebe a
instância do form + props) — ver o guia de composição.

## Formulário que é Server Action

Quando o mutation é uma **Server Action** (entidade de domínio, não o Better Auth), dá para
rodar o **mesmo schema no servidor** com aprimoramento progressivo, via
`@tanstack/react-form-nextjs`:

- **`formOptions({ defaultValues })`** num módulo compartilhado (cliente + action) fixa a
  forma.
- **`createServerValidate({ ...formOpts, onServerValidate })`** valida na action; em falha
  lança **`ServerValidateError`**. O `onServerValidate` é onde o **Zod** roda no servidor —
  a autoridade da doutrina "parse na borda" — junto com auth, authz e escopo de organização.
- A action captura o erro e devolve `error.formState`.
- No cliente, **`initialFormState`** + `useActionState` + `useTransform(mergeForm, state)`
  mesclam o erro do servidor de volta ao form.

A mecânica completa está no guia de SSR — leia antes de escrever, é API específica do pacote
do Next. O ponto de arquitetura: **client valida para UX, a Server Action valida como
autoridade, com o mesmo schema Zod**.

## Os formulários de auth (Better Auth)

Sign-in/sign-up **não** são Server Action — chamam o `authClient` (skill `better-auth`).
São **client-only**: `useForm` + validação Zod. A **mutação** (a chamada ao Better Auth) é
dona do `isPending` e do `error` via **`useMutation`** (skill `tanstack-react-query`); o
`onSubmit` do form só dispara a mutação.

```tsx
const mutation = useMutation({
  mutationFn: async (value: SignInValue) => {
    const { error } = await authClient.signIn.email(value);
    if (error) {
      throw new Error(error.message ?? "Não foi possível entrar.");
    }
  },
  onSuccess: () => {
    form.reset();
    router.push(redirectTo);
  },
});

const form = useForm({
  defaultValues: { email: "", password: "" },
  onSubmit: ({ value }) => {
    mutation.mutate(value);
  },
  validators: { onChange: signInInput },
});
```

A validação de campo é do Zod-via-TanStack (`canSubmit`); o erro **de submit** do Better
Auth (ex.: credencial inválida) é `mutation.error`, num aviso de nível de form, e o
`disabled`/label do botão lê `mutation.isPending`. **Não** use os helpers de
`@tanstack/react-form-nextjs` aqui — não há Server Action nesse fluxo.

**`form.reset()` no `onSuccess` é obrigatório**: o estado do form sobrevive à navegação
soft do App Router — sem o reset, voltar à tela de login mostra a senha digitada.
