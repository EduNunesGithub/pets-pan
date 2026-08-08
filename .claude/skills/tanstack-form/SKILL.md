---
name: tanstack-form
description: TanStack Form v1 — estado de formulário type-safe. Use antes de escrever ou alterar qualquer formulário com estado — `useForm`, `form.Field`, validação por schema, `createFormHook`/`useAppForm`, submit. NÃO é necessária para mudança puramente visual num formulário existente (classe, tipografia, espaçamento). Gatilhos: formulário, form, campo, `useForm`, `validators`, `field.state.meta.errors`, `useAppForm`, `createServerValidate`, submit.
---

# TanStack Form v1 — estado de formulário

Versões: **`@tanstack/react-form@1.33.3`** e, só para formulário que é Server Action,
**`@tanstack/react-form-nextjs@1.33.3`**. React 19. Documentação consultada em 2026-08-02.

**⚠️ Armadilha de versão:** na v1 o adapter do Zod **não existe mais** — o schema Zod passa
**direto** em `validators` (Standard Schema). Exemplo com `zodValidator`,
`@tanstack/zod-form-adapter` ou `validatorAdapter` é pré-v1: não copie. E o Next entra pelo
**pacote separado** `@tanstack/react-form-nextjs`, nunca por subpath.

## Referências desta skill

| Preciso de                                                                           | Leia                        |
| ------------------------------------------------------------------------------------ | --------------------------- |
| `useForm`, `form.Field`, `Subscribe`, validação Zod, mapa da doc                     | `references/basics.md`      |
| `createFormHook`/`useAppForm`, campos do design system, Server Action, forms de auth | `references/composition.md` |

Se nada disso cobrir, **não escreva de memória** — o mapa da documentação oficial está no
fim de `references/basics.md`.

## Decisões fixas do projeto

- **Todo formulário é Client Component** (`useForm` é hook) — `'use client'` na primeira
  linha, isolado numa folha `components/<nome>-form/index.tsx`; a diretiva não sobe para
  layout/page.
- **Campos do design system via `createFormHook`** — o módulo é `components/app-form`
  (`useAppForm`, `useFieldContext`), e cada campo registrado une TanStack (estado) + Base UI
  `Field` (acessibilidade) + tokens (pele).
- **Sign-in/sign-up não são Server Action** — chamam `authClient`; a mutação vive em
  `useMutation` (skill `tanstack-react-query`), dona de `isPending`/`error`. Sem
  `createServerValidate` nesse fluxo.
- **`form.reset()` no `onSuccess`** — o estado do form sobrevive à navegação soft do App
  Router; sem reset, voltar à tela mostra o que foi digitado (senha inclusive).
- **Um schema, dois guardas**: o mesmo Zod valida no cliente (UX) e na Server Action
  (autoridade) — doutrina da skill `zod`.

## Armadilhas

- **Adapter do Zod (pré-v1)** — não existe; schema direto em `validators`.
- **`errors` como string** — com Zod são objetos de issue; use `.map((e) => e.message)`,
  senão a tela imprime `[object Object]`.
- **Submit sem `preventDefault`** — `event.preventDefault()` + `event.stopPropagation()`
  antes de `form.handleSubmit()`, senão o navegador navega.
- **`'use client'` esquecido** — hook em Server Component quebra.
- **Erro de form sobrescrito** pela validação específica de campo — ver o guia de validação.
- **Pacote do Next no fluxo de auth** — não há Server Action ali.
- **Esquecer o `form.reset()` no sucesso** — estado vaza entre navegações soft.

## Pare e pergunte

- Exemplo com `zodValidator`/`validatorAdapter` — pré-v1; desconfie do resto dele também.
- A API necessária não está nas referências e a doc não confirma o comportamento na `1.33.3`.
- Formulário Server Action com aprimoramento progressivo fora do que o guia de SSR cobre —
  pergunte antes de inventar a fiação de `mergeForm`/`createServerValidate`.
