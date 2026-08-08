# Vitest — configuração

## `vitest.config.ts`

O Vitest lê `vite.config.*` por padrão. Este projeto é Next (Turbopack), **não tem vite
config**, então o arquivo `vitest.config.ts` na raiz é obrigatório — e já existe, neste
formato (ESM direto, `"type": "module"`):

```ts
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const rootDir = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      "@": rootDir,
    },
  },
  test: {
    environment: "node",
    include: ["**/*.test.ts"],
  },
});
```

## O alias `@/` é pré-requisito, não enfeite

Import relativo é proibido — todo import é por `@/`. Um teste importa o módulo sob teste,
então **sem o alias no `vitest.config.ts` todo teste de domínio falha na resolução**. O alias
vive em `resolve.alias`, no **topo**, nunca dentro de `test` (isso é Vite, não opção de
teste). `fileURLToPath(new URL(".", import.meta.url))` resolve a raiz — em Node ≥ 20.11 dá
para trocar por `import.meta.dirname`.

Ao mexer, **confirme que pacotes escopados continuam resolvendo** (`@next/env`,
`@neondatabase/serverless`): rode a suíte. Se colidir, use a forma de regex
(`[{ find: /^@\//, replacement: `${rootDir}/` }]`).

A alternativa DRY é o plugin `vite-tsconfig-paths`, que lê o `paths` do `tsconfig`. É
dependência nova **sem skill** — não instale por conta própria; **pare e pergunte**.

## Defaults que valem conhecer

| Opção         | Default                                 | Aqui               |
| ------------- | --------------------------------------- | ------------------ |
| `environment` | `'node'`                                | explícito          |
| `globals`     | `false`                                 | mantido            |
| `include`     | `['**/*.{test,spec}.?(c\|m)[jt]s?(x)']` | `['**/*.test.ts']` |

`globals: false` é o padrão do Vitest e o que este projeto quer: nada de `describe`/`expect`
mágicos no escopo global — importa-se de `vitest`. Por isso **não** se adiciona
`vitest/globals` ao `types` do `tsconfig`.

`environment` fica explícito para deixar a intenção legível: a camada é `node`, de propósito,
não `jsdom`.

`include: ['**/*.test.ts']` (e não `.test.tsx`) é a fronteira com o Playwright: componente e
fluxo de browser não são deste runner.

`vitest.config.ts` mantém o nome convencional com ponto, como `drizzle.config.ts` — não vira
`vitest-config.ts`.
