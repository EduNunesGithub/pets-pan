---
name: vitest
description: Referência do Vitest 4 usada neste projeto para testar a camada de domínio sem framework. Use SEMPRE antes de escrever ou alterar qualquer coisa que toque teste — `vitest.config`, arquivo `.test.ts`, `describe`/`it`/`expect`, mock/spy com `vi`, fake timers, cobertura, script de teste. Também ao decidir onde um teste deve morar. Gatilhos: escrever teste, testar regra de negócio, testar módulo de domínio, `vitest.config`, `describe`, `expect`, mock, spy, `vi.fn`, fake timer, cobertura, `npm test`, TDD.
---

# Vitest 4 — camada de domínio

Versão de referência: **`vitest@4.1.10`** (dist-tag `latest` do npm). Requer **Node ≥ 20**
(`^20 || ^22 || >=24`) e traz **Vite ≥ 6** embutido. Documentação consultada em 2026-07-30.

**Atenção:** a linha estável saltou para a **v4**. A `3.2.7` ficou congelada sob a dist-tag
`V3` e a `5.0.0` ainda é `beta`. Boa parte de tutorial e de resposta de memória descreve a
**v3**, que tem **outra assinatura de `test()`**, outras opções de config (`workspace`,
`poolOptions`, `environmentMatchGlobs`, `maxThreads`) e outro pacote de browser. Nunca copie
exemplo que use essas opções — é v3 e foi removido (§9).

Fixe a versão exata, como o resto do projeto faz com o Drizzle:

```bash
npm i -D vitest@4.1.10 --save-exact
```

O Vitest transpila TypeScript sozinho (esbuild) — não precisa de `ts-node` nem de build
prévio. Não precisa de `jsdom`: a camada de domínio roda em `node` (§3).

Se algo aqui não cobrir sua dúvida, **não escreva de memória** — busque a página no
[mapa de documentação](#mapa-de-documentação) e leia antes.

---

## 1. Papel do Vitest neste projeto

O Vitest cobre **só a camada de domínio** — o motor de pipeline, o ciclo de vida do animal e
as 17 regras de `docs/domain.md`. É a razão de a arquitetura manter essa lógica em módulo
puro (zero import de `next`, zero React): regra de negócio em função pura se testa em
milissegundos, sem servidor e sem mock de framework.

O que **não** é do Vitest:

- Componente React, `page`, `layout`, Server Action, route handler → são a camada Next, fina,
  coberta por **Playwright** (`CAR-120`). Por isso o `include` fica em `.test.ts`, não
  `.test.tsx` (§3).
- Query real no banco → o `db` só é importável em Server Component/Action/route; teste de
  domínio não abre conexão. A lógica que decide _o que_ gravar é pura e testável; o `db/` só
  persiste.

Regra prática: se o teste precisa de `render`, de um browser ou de `DATABASE_URL`, ele não é
um teste de domínio e não é deste runner — **pare e pergunte** (Playwright é outra skill).

---

## 2. `vitest.config.ts`

O Vitest lê `vite.config.*` por padrão. Este projeto é Next (Turbopack), **não tem vite
config**, então o arquivo `vitest.config.ts` na raiz é obrigatório. Como o `package.json` tem
`"type": "module"`, o arquivo é ESM direto.

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

### O alias `@/` é pré-requisito, não enfeite

A `write-code` §2 **proíbe import relativo** — todo import é por `@/`. Um teste importa o
módulo sob teste, então **sem o alias no `vitest.config.ts` todo teste de domínio falha na
resolução**. O alias vive em `resolve.alias`, no **topo**, nunca dentro de `test` (isso é Vite,
não opção de teste). `fileURLToPath(new URL(".", import.meta.url))` resolve a raiz do repo —
em Node ≥ 20.11 dá para trocar por `import.meta.dirname`.

Ao configurar, **confirme que pacotes escopados continuam resolvendo** (`@next/env`,
`@neondatabase/serverless`): rode a suíte e veja se algum import quebrou. Se colidir, use a
forma de regex (`[{ find: /^@\//, replacement: `${rootDir}/` }]`).

A alternativa DRY é o plugin `vite-tsconfig-paths`, que lê o `paths` do `tsconfig` e evita
repetir o alias. É dependência nova **sem skill** — não instale por conta própria; **pare e
pergunte**.

### Defaults que valem conhecer

| Opção         | Default                                 | Aqui               |
| ------------- | --------------------------------------- | ------------------ |
| `environment` | `'node'`                                | explícito          |
| `globals`     | `false`                                 | mantido            |
| `include`     | `['**/*.{test,spec}.?(c\|m)[jt]s?(x)']` | `['**/*.test.ts']` |

`globals: false` é o padrão do Vitest e o que este projeto quer: nada de `describe`/`expect`
mágicos no escopo global. Importa-se de `vitest` (§4). Por isso **não** se adiciona
`vitest/globals` ao `types` do `tsconfig` — isso só é necessário com `globals: true`.

`environment` fica explícito para deixar a intenção legível: a camada é `node`, de propósito,
não `jsdom`.

---

## 3. Escrever teste

`globals` está desligado, então **importe as APIs de `vitest`**. O import fica no grupo de
externos, alfabético dentro do `import`:

```ts
import { describe, expect, it } from "vitest";

import { closeAnimal } from "@/domain/animal/close-animal";
```

```ts
import { describe, expect, it } from "vitest";

import { closeAnimal } from "@/domain/animal/close-animal";

describe("closeAnimal", () => {
  it("fecha o animal com um motivo válido (regra 6)", () => {
    const animal = closeAnimal(activeAnimal, "adopted");

    expect(animal.status).toBe("closed");
    expect(animal.closingReason).toBe("adopted");
  });

  it("recusa fechar sem motivo (regra 6)", () => {
    expect(() => closeAnimal(activeAnimal, null)).toThrow();
  });
});
```

`test` e `it` são a mesma função — o projeto usa **`it`** dentro de `describe`, lendo como
frase. A string do `it`/`describe` é a documentação do comportamento: a `write-code` §6
proíbe comentário, e é o **nome do teste** que ocupa esse lugar. Escreva a descrição em
**português** (é prosa de comportamento, costuma citar a regra do domínio pelo número); só
identificadores e nome de arquivo ficam em inglês.

### Opções do teste — mudaram na v4

As opções (`retry`, `timeout`, `skip`, `only`, `concurrent`) agora são o **2º argumento**, não
o 3º:

```ts
it("caso lento", { retry: 2, timeout: 10_000 }, async () => {
  await expect(slowThing()).resolves.toBeDefined();
});
```

`it("nome", () => {}, { retry: 2 })` é a forma **v3** e foi removida.

### Assíncrono

```ts
await expect(promise).resolves.toEqual(value);
await expect(promise).rejects.toThrow(DomainError);
```

### Tabela de casos

`it.each` cobre variações sem repetir corpo — bom para os motivos de fechamento (regra 6) ou
para as etapas de um funil:

```ts
it.each([
  ["adopted"],
  ["died"],
  ["lost"],
  ["returned_to_owner"],
  ["transferred"],
])("aceita o motivo de fechamento %s", (reason) => {
  expect(() => closeAnimal(activeAnimal, reason)).not.toThrow();
});
```

### Matchers mais usados

`toBe` (identidade), `toEqual` / `toStrictEqual` (estrutura), `toThrow`, `toContain`,
`toHaveLength`, `toMatchObject`, `toBeNull` / `toBeUndefined`, `toBeCloseTo`, `resolves` /
`rejects`. Lista completa em `/api/expect`.

### Onde o teste mora

Ao lado do módulo, mesmo nome + `.test.ts`, em `kebab-case` (`write-code` §3/§4):

```
domain/animal/
├─ close-animal.ts
└─ close-animal.test.ts
```

Um arquivo por unidade sob teste. `describe` externo com o nome da unidade.

---

## 4. Rodar

`vitest` sem argumento entra em **watch** no terminal interativo e roda **uma vez** em CI ou
terminal não interativo. `vitest run` roda uma vez e sai sempre — é o determinístico.

Scripts (inseridos em ordem alfabética no `package.json`):

```json
"test": "vitest run",
"test:watch": "vitest"
```

`test` usa `vitest run` para fechar em menos de um segundo e nunca travar em CI. `test:watch`
é o modo de desenvolvimento. Alvo de `CAR-117`: `npm test` verde em < 1s.

- Um arquivo: `npx vitest run domain/animal/close-animal.test.ts`.
- Por nome: `npx vitest run -t "regra 6"`.
- No `lint-staged`, use `vitest related --run` — o `--run` garante que o processo termina em
  vez de abrir watch no commit.

Cobertura (`@vitest/coverage-v8`, `vitest run --coverage`) fica **fora** do `CAR-117`. O
provider (`v8` × `istanbul`) é decisão à parte — **pare e pergunte**.

---

## 5. Mock, spy e tempo

A camada de domínio é pura por projeto, então a maioria dos testes **não precisa de mock** —
passe as dependências como argumento e o teste fica trivial. Quando precisar, é o objeto `vi`:

```ts
import { expect, it, vi } from "vitest";

it("notifica os não selecionados", () => {
  const notify = vi.fn();

  selectApplication(application, { notify });

  expect(notify).toHaveBeenCalledWith(losingApplicants);
});
```

`vi.spyOn(obj, "method")`, `vi.mock("@/modulo")` (hoisted para o topo), `vi.fn()`.

### Tempo — regra 7 (arquivar após N dias)

Prefira **injetar o instante** na função de domínio (`archiveIfDue(animal, { now })`) — fica
pura e o teste não precisa de timer. Quando o tempo é lido por dentro, use fake timers:

```ts
import { afterEach, beforeEach, expect, it, vi } from "vitest";

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-01-01T00:00:00Z"));
});

afterEach(() => {
  vi.useRealTimers();
});
```

**Mudou na v4:** `vi.restoreAllMocks()` não reseta mais automocks; `mock.invocationCallOrder`
começa em `1`; spy de construtor exige `function`/`class` (arrow falha). Confirme na doc de
`/api/vi` antes de depender desses detalhes.

---

## 6. Conciliação com `write-code`

- **Imports por alias.** É o motivo de o alias `@/` existir na config (§2). Grupos: externos
  (`vitest`, builtins `node:*`) → alias `@/` → type-only, alfabético dentro de cada grupo.
- **Nome do arquivo em `kebab-case`**, espelhando o módulo: `close-animal.test.ts`.
- **Zero comentário.** A string do `it`/`describe` documenta o caso; não há comentário no
  corpo. Se sentir vontade de comentar, o nome do teste está fraco.
- **Sem `any`.** Fixture desconhecida é `unknown` e se estreita; para tipar dado de teste, use
  o tipo real do domínio (`Animal`, `NewAnimal`), nunca `as any`. `@ts-expect-error` só com a
  justificativa da linha anterior — útil para asserção de que uma chamada inválida não
  compila.
- **Ordem alfabética** em imports, chaves de objeto de config e arrays sem sequência. Um
  `it.each` cuja ordem tem significado (etapas de funil) é quebra consciente e leva o
  comentário justificando.
- **Nome do arquivo de config.** `vitest.config.ts` mantém o nome convencional com ponto,
  como `drizzle.config.ts` e `next.config.ts` — não vira `vitest-config.ts`.
- Teste **não** é componente React: a regra `nome/index.tsx` não se aplica. O teste convive ao
  lado do módulo (`write-code` §4).

---

## 7. Testar as 17 regras

`docs/domain.md` §10 é a fonte. Cada uma das 17 regras tem issue própria no Linear e ganha
teste isolado — não enterre uma regra dentro do teste de CRUD.

- Regras que são invariante puro (2, 6, 11, 12) → função de domínio + teste direto.
- Regras que gravam em várias tabelas numa transação (4, 5, 15) → a **decisão** é pura e
  testável aqui; a persistência é da skill `drizzle`. Teste o que a função decide, não o SQL.
- Regra 16 tem issue de teste dedicada (`CAR-152`): a instância copia a definição e sobrevive
  à edição do molde. É um teste de regressão da genericidade do motor.
- Regra 7 (arquivar após N dias) → injete o `now` (§5).

Ao concluir qualquer teste que toque entidade do domínio, rode o agent `domain-reviewer`
antes de reportar pronto (regra do `CLAUDE.md`).

---

## 8. Armadilhas

- Copiar config v3: `workspace` (agora `projects`), `poolOptions` (achatado no topo),
  `environmentMatchGlobs` / `poolMatchGlobs` (removidos, use `projects`), `maxThreads` /
  `maxForks` (agora `maxWorkers`). O erro é de config, aparece no start.
- Opções de `test()` no 3º argumento — na v4 é o 2º.
- Esquecer o alias `@/` na config: todo import de domínio quebra com "cannot find module".
- Alias `@` engolindo pacote escopado (`@next/env`) — confira que ainda resolve; use a regex
  se colidir (§2).
- Usar `environment: 'jsdom'` para lógica pura: desnecessário e mais lento; `jsdom` é sinal de
  que o teste é de UI (Playwright).
- `test` script como `vitest` puro: em CI roda uma vez (ok), mas localmente abre watch e
  "trava" o terminal de quem esperava um run. Use `vitest run`.
- Esperar `describe`/`expect` globais: `globals` é `false`; importe de `vitest`.
- `reporter: 'basic'` — removido na v4; `verbose` agora é lista plana, use `tree` para a
  árvore antiga.
- Teste que abre conexão de banco ou faz `render`: não é teste de domínio.

---

## Mapa de documentação

Quando este arquivo não cobrir, busque a URL antes de escrever. Prefixo: `https://vitest.dev`.

| Assunto                    | Caminho               |
| -------------------------- | --------------------- |
| Começando                  | `/guide/`             |
| CLI                        | `/guide/cli`          |
| Config — `defineConfig`    | `/config/`            |
| Config — `environment`     | `/config/environment` |
| Config — `globals`         | `/config/globals`     |
| Config — `include`         | `/config/include`     |
| Cobertura                  | `/guide/coverage`     |
| `expect` (matchers)        | `/api/expect`         |
| Fake timers / `vi`         | `/api/vi`             |
| Migração v3 → v4           | `/guide/migration`    |
| Mock de funções            | `/api/mock`           |
| `projects` (multi-config)  | `/guide/projects`     |
| Test API (`describe`/`it`) | `/api/`               |

---

## Pare e pergunte

- O teste precisa de DOM, `render` ou browser → é Playwright (`CAR-120`), outra skill.
- A tarefa pede `vite-tsconfig-paths`, `@testing-library/*`, `@vitest/coverage-*` ou outro
  pacote do ecossistema **sem skill** no repositório.
- Escolher provider de cobertura (`v8` × `istanbul`).
- A API necessária não está aqui e a doc não confirma o comportamento na `4.1.10`.
- O teste exigiria `any`, `@ts-ignore` ou desligar uma regra da `write-code`.
- O comportamento a testar contradiz `docs/domain.md` — aponte a contradição, não invente o
  teste que a esconde.
