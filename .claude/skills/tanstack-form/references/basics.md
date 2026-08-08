# TanStack Form — básico e validação

## O básico

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
- **`form.Subscribe`** com `selector` para reagir a fatia do estado (`canSubmit`,
  `isSubmitting`) sem re-renderizar o form inteiro.

## Validação com Zod (Standard Schema)

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

> **Armadilha do erro-objeto.** Com validador de Standard Schema,
> `field.state.meta.errors` guarda **issues** (objetos com `.message`), não strings. Leia
> `field.state.meta.errors.map((e) => e.message).join(", ")` — um `errors.join(", ")` cru
> imprime `[object Object]`.

O schema vem do **módulo de domínio** quando descreve uma entidade, ou fica junto do form
quando é o payload daquele endpoint — a regra de colocação e a doutrina "parse na borda"
estão na skill `zod`. Um schema, dois guardas: no cliente (UX) e de novo na Server Action
(autoridade).

## Mapa da documentação oficial

Prefixo: `https://tanstack.com/form/latest/docs`.

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
