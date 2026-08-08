---
name: zod
description: Zod v4 — validação na fronteira. Use antes de escrever ou alterar qualquer validação — schema de form, parse de Server Action/route, `searchParams`, env, invariante de entidade — e ao decidir onde um schema mora. NÃO é necessária para mudança que não toca schema nem parse. Gatilhos: `z.object`, `z.infer`, `safeParse`, `ZodError`, `z.coerce`, validar entrada, Standard Schema, mensagem de erro, locale pt.
---

# Zod v4 — validação na fronteira

Versão de referência: **`zod@4.4.3`** (fixada exata). Documentação consultada em 2026-08-02.
Import canônico: `import * as z from "zod"`. Não usamos **Zod Mini** (`zod/mini`).

## ⚠️ Armadilha de versão — quase todo exemplo na internet é v3

A v4 reescreveu a API de superfície. Tutorial e resposta de memória anteriores a 2025 usam
v3 e quebram num detalhe:

| v3 (não use)                                | v4 (use)                                         |
| ------------------------------------------- | ------------------------------------------------ |
| `z.string().email()` / `.uuid()` / `.url()` | `z.email()` / `z.uuid()` / `z.url()` (top-level) |
| `{ message: "..." }`                        | `{ error: "..." }`                               |
| `required_error` / `invalid_type_error`     | `{ error: (iss) => ... }` (função)               |
| `errorMap: ...`                             | `error: ...`                                     |
| `err.format()`                              | `z.treeifyError(err)`                            |
| `err.flatten()`                             | `z.flattenError(err)`                            |
| `z.nativeEnum(E)`                           | `z.enum(E)`                                      |
| `.merge(other)`                             | `.extend(other.shape)`                           |
| `schema.strict()` / `.passthrough()`        | `z.strictObject(...)` / `z.looseObject(...)`     |
| `.nonempty()` → tupla                       | `.nonempty()` ≡ `.min(1)`, retorna `T[]`         |

Além disso: `z.uuid()` agora é estrito (RFC 9562/4122; permissivo é `z.guid()`).
`z.coerce.*` tem input `unknown`. `default` recebe o tipo de **saída** e curto-circuita o
parse — o comportamento antigo é `.prefault()`.

## Referências desta skill

| Preciso de                                                                                                                   | Leia                |
| ---------------------------------------------------------------------------------------------------------------------------- | ------------------- |
| API (`parse`/`safeParse`/`infer`), `FormData`/coerção, mensagens/locale pt, formatação de erro, Standard Schema, mapa da doc | `references/api.md` |

## Doutrina — validar na fronteira, confiar no tipo pra dentro

Vale mais que qualquer API. Zod entra **onde dado não-confiável cruza para dentro** — e só
aí:

- **Server Actions e route handlers** — `safeParse` **antes** de tocar o domínio, junto com
  auth, authz e escopo de organização.
- **Formulários** (o mesmo schema, via TanStack Form).
- **`searchParams`/`params`**, **resposta de API externa**, **env**.

Zod **não** entra dentro de `domain/`: ali o contrato é TypeScript + Vitest; o dado que
chega numa função pura **já cruzou uma fronteira validada**. Revalidar dentro duplica o type
system e não compra segurança.

**Onde o schema mora:**

- Invariante da entidade → `domain/<entidade>/<entidade>.ts`, tipo via `z.infer` (uma fonte
  só).
- Entrada de um endpoint (payload de form/action) → junto da Server Action / do form.
- O `.parse`/`.safeParse` acontece **sempre na camada Next**, nunca dentro de `domain/`.

## Armadilhas

- **API v3 de memória** — a tabela do topo é o erro nº 1.
- **`parse` numa Server Action** — lança e vira 500; use `safeParse` e devolva
  `fieldErrors`.
- **Validar dentro de `domain/`** — quebra a doutrina.
- **`default` com tipo de entrada** — na v4 é o de saída; comportamento antigo é
  `.prefault()`.
- **Zod Mini** — outra API; importe de `zod`.

## Pare e pergunte

- Exemplo com `.email()`, `{ message }`, `.format()` ou `errorMap` — é v3; traduza pela
  tabela, não copie.
- A API necessária não está na referência e a doc não confirma o comportamento na `4.4.3`.
- Onde um schema mora parece contradizer `domain/README.md` — o README é a autoridade.
