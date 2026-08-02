---
name: zod
description: Referência do Zod v4 (validação de dados TypeScript-first) usada neste projeto. Use SEMPRE antes de escrever ou alterar qualquer validação — schema de formulário, parse de entrada de Server Action ou route handler, validação de `searchParams`/`params`, resposta de API externa, variável de ambiente, ou o schema de invariante de uma entidade do domínio. Também ao decidir onde um schema mora e onde o `.parse` acontece. Gatilhos: `z.object`, `z.string`, `z.infer`, `safeParse`, `parse`, `ZodError`, `z.coerce`, `z.email`, validar entrada, schema de form, Standard Schema, mensagem de erro, locale pt.
---

# Zod v4 — validação na fronteira

Versão de referência: **`zod@4.4.3`** (dist-tag `latest` do npm), TypeScript 6. Documentação
consultada em 2026-08-02.

Já está na árvore: `zod@4.4.3` entra transitivo pelo `better-auth` (e por `better-call` e
`zod-validation-error`), **deduplicado** na mesma versão. Promover a dependência direta é de
graça e não muda a versão resolvida.

Se algo aqui não cobrir sua dúvida, **não escreva de memória** — busque a página no
[mapa de documentação](#mapa-de-documentação) e leia antes.

---

## ⚠️ Armadilha de versão — quase todo exemplo na internet é v3

A v4 reescreveu boa parte da API de superfície. Tutorial, resposta de memória e thread de fórum
anteriores a 2025 usam **v3**, e o código roda "quase" — até quebrar num detalhe. Os que mais
aparecem:

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

Além disso: `z.uuid()` agora é estrito (RFC 9562/4122) — para o formato permissivo use
`z.guid()`. `z.coerce.*` tem input `unknown` (não mais o tipo alvo). `default` recebe o tipo de
**saída** e curto-circuita o parse; para o comportamento antigo use `.prefault()`. Não usamos
**Zod Mini** (`zod/mini`): é o pacote tree-shakable com API por função; nossos imports são do
`zod` normal.

---

## 1. Instalação

O repositório fixa versão exata; o `.npmrc` da raiz já tem `legacy-peer-deps=true`:

```bash
npm i zod@4.4.3 --save-exact
```

Import canônico da v4 (namespace):

```ts
import * as z from "zod";
```

---

## 2. Doutrina — validar na fronteira, confiar no tipo pra dentro

Esta é a decisão de arquitetura deste projeto, e ela vale mais que qualquer API abaixo.

Zod entra **onde dado não-confiável cruza para dentro do sistema** — e só aí:

- **Server Actions e route handlers.** São endpoints `POST`/HTTP alcançáveis direto, fora da UI
  (skill `nextjs` §5). Cada um faz `schema.safeParse(input)` **antes** de tocar o domínio — junto
  com auth, authz e o escopo de organização.
- **Formulários** (o mesmo schema do item 8, via `@tanstack/react-form`).
- **`searchParams` / `params`** vindos da URL.
- **Resposta de API externa** e **variáveis de ambiente**.

Zod **não** entra dentro de `domain/`. Ali o contrato é TypeScript + Vitest (skill `vitest`), e
quando o dado chega numa função pura ele **já cruzou uma fronteira validada**. Revalidar em
runtime a cada chamada interna duplica o type system, custa performance e não compra segurança
nenhuma.

> **Parse na borda, confia no tipo pra dentro.** A camada Next valida e orquestra; `domain/`
> recebe o tipo já parseado e confia nele. É o mesmo eixo do `domain/README.md`: o domínio decide
> **o quê**, a camada Next cuida do **como**.

---

## 3. Onde o schema mora

Zod é **sem framework** (não importa `next`/`react`), então pode viver no domínio. A divisão:

- **Schema de invariante da entidade** → no módulo de domínio, em `domain/<entidade>/<entidade>.ts`
  (é "tipos e invariantes da entidade", `domain/README.md`). O tipo **deriva do schema** com
  `z.infer` — uma fonte só.

  ```ts
  import * as z from "zod";

  export const animalSchema = z.object({
    id: z.uuid(),
    name: z.string().min(1),
    status: z.enum(["active", "archived", "closed"]),
  });

  export type Animal = z.infer<typeof animalSchema>;
  ```

- **Schema de entrada de um endpoint** (payload de um form ou de uma action específica, que quase
  sempre é um subconjunto da entidade) → **junto da Server Action / do form**, na camada Next. É
  daquele endpoint, não da entidade.

- **O `.parse` / `.safeParse`** acontece **sempre na camada Next**, nunca dentro de função pura de
  `domain/`. A função de domínio recebe o `Animal` já validado.

---

## 4. API essencial

```ts
const result = animalSchema.safeParse(input);
if (!result.success) {
  result.error;
} else {
  result.data;
}
```

- **`.parse(input)`** — devolve um clone tipado; **lança `ZodError`** se inválido.
- **`.safeParse(input)`** — devolve `{ success: true; data } | { success: false; error }`. **Numa
  Server Action, prefira `safeParse`** e devolva os erros ao form, em vez de deixar `parse` lançar.
- **`.parseAsync` / `.safeParseAsync`** — para schema com refinement assíncrono.
- **`ZodError.issues`** — array; cada issue tem `code`, `path`, `message`, `expected`, `input`.
- **Tipos:** `z.infer<typeof S>` (saída), `z.input<typeof S>`, `z.output<typeof S>`.

---

## 5. `FormData` e coerção

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

`z.coerce.number()`, `z.coerce.boolean()`, `z.coerce.date()` resolvem os campos de `FormData`. Na
v4 o input de um `z.coerce.*` é `unknown` — é o esperado ao ler de `FormData`.

---

## 6. Mensagens de erro e português

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

Rode isso no bootstrap de cada runtime que faz parse (o servidor das actions e o cliente dos
forms) — um módulo de efeito colateral importado onde os schemas são usados resolve. A colocação
exata é decisão de setup; alinhe antes de espalhar.

---

## 7. Formatar o erro para a UI

Do `ZodError`, escolha a forma conforme o consumidor:

- **`z.flattenError(err)`** → `{ formErrors, fieldErrors }`. Ideal para form plano — casa com
  `fieldErrors[campo]`. (Substitui o `.flatten()` da v3.)
- **`z.treeifyError(err)`** → árvore aninhada (`errors`/`properties`/`items`), para objeto
  aninhado. (Substitui o `.format()` da v3.)
- **`z.prettifyError(err)`** → string legível com `→ at <path>`, boa para **log**, não para a UI.
- `z.formatError()` está **depreciado** — use `treeifyError`.

---

## 8. Standard Schema — a ponte entre as três libs

Zod expõe a interface **Standard Schema**, então o **mesmo schema** alimenta qualquer lib que a
consome. É o que amarra o nosso stack: um schema Zod dirige a validação do **`@tanstack/react-form`**
e do **`Field` do Base UI**, no cliente, e o mesmíssimo schema valida a Server Action, no servidor.

A **mecânica** dessa ponte (como o schema é passado ao TanStack Form e como o erro chega ao
`Field.Error` do Base UI) é da skill **`tanstack-form`**. Aqui, só saiba que o schema é único e
serve os dois lados.

---

## 9. Conciliação com `write-code`

- **Chaves de `z.object` em ordem alfabética** — é objeto literal (`write-code` §1). Mesmo para
  membros de `z.enum` quando não houver ordem semântica; se a ordem for um funil, comente a quebra.
- **Sem `any`.** O tipo sai de `z.infer`/`z.input`/`z.output`; a entrada de `parse` é `unknown` e
  o Zod estreita.
- **`kebab-case`.** Schema de entidade em `<entidade>.ts`; schema de endpoint junto do arquivo da
  action/form. Nada de `Schemas.ts`.
- **Import por alias**, grupo externo (`import * as z from "zod"`), alfabético.
- **Sem comentário** — nome do schema e da mensagem explica.

---

## 10. Armadilhas

- **API v3 de memória.** `.email()`, `{ message }`, `.format()`, `errorMap`, `z.nativeEnum`,
  `.merge`, `.strict()` — todos mudaram (ver a tabela do topo). É o erro nº 1.
- **`parse` numa Server Action.** Lança e vira erro 500; use `safeParse` e devolva `fieldErrors`.
- **Validar dentro de `domain/`.** Quebra a doutrina (§2): o dado já cruzou a fronteira. Schema é
  invariante; o `.parse` é da camada Next.
- **`default` com tipo de entrada.** Na v4 o `default` é o tipo de **saída** e curto-circuita o
  parse; para o comportamento antigo, `.prefault()`.
- **`z.coerce` esperando o tipo alvo no input.** O input é `unknown` na v4 — de propósito, para ler
  `FormData`.
- **Zod Mini.** `zod/mini` é outra API (por função). Não é o que usamos; importe de `zod`.

---

## Mapa de documentação

Quando este arquivo não cobrir, busque a URL antes de escrever. Prefixo: `https://zod.dev`.

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

---

## Pare e pergunte

- A API que um exemplo mostra usa `.email()`, `{ message }`, `.format()` ou `errorMap` — é **v3**;
  traduza pela tabela do topo, não copie.
- A API que você precisa **não está** aqui e a página da doc não confirma o comportamento na
  `4.4.3`.
- **Onde um schema mora** parece contradizer `domain/README.md` — o README é a autoridade de
  colocação; alinhe.
- A ponte **Standard Schema ↔ `@tanstack/react-form` ↔ Base UI `Field`** — a mecânica é da skill
  `tanstack-form`; se ela ainda não cobre, pergunte em vez de inventar.
