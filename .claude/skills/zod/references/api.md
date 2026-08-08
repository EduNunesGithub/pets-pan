# Zod v4 — API, FormData, mensagens e erro

## API essencial

```ts
const result = animalSchema.safeParse(input);
if (!result.success) {
  result.error;
} else {
  result.data;
}
```

- **`.parse(input)`** — devolve um clone tipado; **lança `ZodError`** se inválido.
- **`.safeParse(input)`** — devolve `{ success: true; data } | { success: false; error }`.
  **Numa Server Action, prefira `safeParse`** e devolva os erros ao form.
- **`.parseAsync` / `.safeParseAsync`** — para refinement assíncrono.
- **`ZodError.issues`** — array; cada issue tem `code`, `path`, `message`, `expected`,
  `input`.
- **Tipos:** `z.infer<typeof S>` (saída), `z.input<typeof S>`, `z.output<typeof S>`.

## Schema de invariante da entidade

```ts
import * as z from "zod";

export const animalSchema = z.object({
  id: z.uuid(),
  name: z.string().min(1),
  status: z.enum(["active", "archived", "closed"]),
});

export type Animal = z.infer<typeof animalSchema>;
```

O tipo **deriva do schema** com `z.infer` — uma fonte só.

## `FormData` e coerção

Server Action recebe `FormData`, onde **tudo é string**. Converta e coaja no schema:

```ts
"use server";

import * as z from "zod";

const createAnimalInput = z.object({
  intakeWeightKg: z.coerce.number().positive(),
  name: z.string().min(1),
});

export async function createAnimal(formData: FormData) {
  const parsed = createAnimalInput.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: z.flattenError(parsed.error).fieldErrors };
  }
}
```

`z.coerce.number()`, `z.coerce.boolean()`, `z.coerce.date()` resolvem os campos de
`FormData`. Na v4 o input de um `z.coerce.*` é `unknown` — o esperado ao ler de `FormData`.

## Mensagens de erro e português

A v4 unificou a customização num parâmetro **`error`** (string ou função):

```ts
z.string().min(5, { error: "Mínimo de 5 caracteres." });
z.string({
  error: (iss) =>
    iss.input === undefined ? "Campo obrigatório." : "Valor inválido.",
});
```

Precedência (maior → menor): erro no schema → erro por-parse → error map global → locale.

Para as mensagens padrão saírem em **pt-BR**, configure o locale global uma vez por runtime:

```ts
import * as z from "zod";

z.config(z.locales.pt());
```

Rode no bootstrap de cada runtime que faz parse (servidor das actions e cliente dos forms) —
um módulo de efeito colateral importado onde os schemas são usados resolve. A colocação
exata é decisão de setup; alinhe antes de espalhar.

## Formatar o erro para a UI

Do `ZodError`, escolha a forma conforme o consumidor:

- **`z.flattenError(err)`** → `{ formErrors, fieldErrors }`. Ideal para form plano.
  (Substitui o `.flatten()` da v3.)
- **`z.treeifyError(err)`** → árvore aninhada, para objeto aninhado. (Substitui o
  `.format()` da v3.)
- **`z.prettifyError(err)`** → string legível com `→ at <path>`, boa para **log**.
- `z.formatError()` está **depreciado** — use `treeifyError`.

## Standard Schema — a ponte entre as três libs

Zod expõe a interface **Standard Schema**: o **mesmo schema** dirige a validação do
`@tanstack/react-form` e do `Field` do Base UI no cliente, e valida a Server Action no
servidor. A mecânica da ponte é da skill `tanstack-form`.

## Mapa da documentação oficial

Prefixo: `https://zod.dev`.

| Assunto                         | Caminho                |
| ------------------------------- | ---------------------- |
| Uso básico (parse/infer/erro)   | `/basics`              |
| Definir schemas (API completa)  | `/api`                 |
| Customização de erro / i18n     | `/error-customization` |
| Formatação de erro              | `/error-formatting`    |
| Codecs (transform bidirecional) | `/codecs`              |
| Metadata e registries           | `/metadata`            |
| JSON Schema                     | `/json-schema`         |
| Para autores de lib             | `/library-authors`     |
| Changelog v3 → v4               | `/v4/changelog`        |
| Release notes v4                | `/v4`                  |
| Índice completo                 | `/llms.txt`            |
