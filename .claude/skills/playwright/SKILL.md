---
name: playwright
description: Configurar e escrever testes de ponta a ponta com Playwright — a camada Next (page, layout, Server Action, route) rodando no navegador. Use ao mexer em playwright.config.ts, no webServer que sobe o app, em specs .spec.ts, na preparação de banco do E2E ou no script test:e2e. Não cobre teste de domínio (Vitest) nem teste de componente isolado.
---

# Playwright — testes de ponta a ponta

Versão de referência: **Playwright 1.62**, Node 22/24/26, TypeScript 6. Documentação consultada
em 2026-07-31.

Este runner cobre a **camada Next** pelo navegador: `page`, `layout`, Server Action, route
handler — o caminho completo que o usuário percorre. Regra de negócio pura é do **Vitest**
(skill `vitest`); componente isolado sem browser também. Se o teste não precisa de um browser
nem do app subindo, ele não é deste runner.

Se algo aqui não cobrir sua dúvida, **não escreva de memória** — busque a página no
[mapa de documentação](#mapa-de-documentação) e leia antes.

---

## 1. Instalação e scaffold

O projeto ainda não tem Playwright. A inicialização oficial:

```bash
npm init playwright@latest
```

O assistente pergunta algumas coisas. Responda alinhado às convenções do repo:

| Pergunta                   | Resposta                                                            |
| -------------------------- | ------------------------------------------------------------------- |
| TypeScript ou JavaScript   | **TypeScript** (`.js`/`.jsx` não entram no repo, ver `write-code`). |
| Nome da pasta de testes    | **`e2e`** (não `tests` — ver §2).                                   |
| GitHub Actions workflow    | Opcional. CAR-120 é local; se aceitar, o arquivo entra depois.      |
| Instalar os browsers agora | **Sim.**                                                            |

O scaffold cria `playwright.config.ts`, a pasta de testes com um `example.spec.ts`, uma pasta
`tests-examples/` e ajusta o `.gitignore`. Baixa também os binários dos browsers (Chromium,
Firefox, WebKit) fora do `node_modules`.

Para (re)instalar só os browsers e as dependências de sistema:

```bash
npx playwright install --with-deps
```

### O que ajustar logo após o scaffold

O arquivo gerado vem cheio de comentários e de exemplo descartável. **Antes de commitar:**

- **Apague todos os comentários** do `playwright.config.ts` — a `write-code` §6 proíbe
  comentário. O gerador enche o arquivo de explicação; nada disso fica.
- **Remova `tests-examples/`** e o `example.spec.ts` — andaime. O teste real da home entra no
  lugar.
- **Renomeie a pasta para `e2e/`** se o assistente tiver criado `tests/`.
- **Confira o `.gitignore`** (§8) — os artefatos do Playwright não podem ser versionados.
- **Adicione o script `test:e2e`** ao `package.json` (§7).

Node é `latest 22.x, 24.x ou 26.x`. Abaixo disso o runner não sobe.

---

## 2. Onde os testes moram

Specs de E2E ficam em **`e2e/`**, na raiz, **fora de `app/`** — nada dentro de `app/` que
não seja arquivo de convenção vira rota ou é varrido pelo bundler.

**Extensão `.spec.ts`, sempre.** Essa é a fronteira com o Vitest, e ela é dura:

- O Vitest deste projeto varre `include: ["**/*.test.ts"]` — qualquer `*.test.ts`, em qualquer
  pasta. Um spec de browser nomeado `.test.ts` seria pego pelo Vitest e **quebraria** (não há
  browser no runner do Vitest).
- O Playwright, por padrão, casa tanto `*.spec.ts` quanto `*.test.ts`. Para não invadir o
  território do Vitest, fixe `testMatch: "**/*.spec.ts"` na config (§4).

Resultado: **`.test.ts` é do Vitest, `.spec.ts` é do Playwright.** Sem sobreposição.

Nomes de arquivo em `kebab-case` (`write-code` §3): `home.spec.ts`, `adopter-flow.spec.ts`.
Imports internos por alias `@/` (`write-code` §2); `@playwright/test` é externo, fica no
grupo de externos.

---

## 3. Server e Client — o que o Playwright testa

O Playwright não sabe nem se importa se um componente é Server ou Client. Ele dirige um
browser real contra o app já renderizado — vê o HTML do prerender, a hidratação, o streaming
do `<Suspense>` e a interação. É o teste certo para:

- a home carregar e renderizar a lista (o andaime atual);
- um fluxo com Server Action (submeter formulário, ver o efeito);
- comportamento que depende de rota, cookie de sessão, redirect.

Não é o teste certo para uma regra de negócio pura de `domain/` — essa é do Vitest,
milissegundos, sem browser.

---

## 4. `playwright.config.ts`

`defineConfig` de `@playwright/test`. As opções centrais:

| Opção           | Papel                                                                    |
| --------------- | ------------------------------------------------------------------------ |
| `testDir`       | Pasta dos specs (`e2e`).                                                 |
| `testMatch`     | Padrão dos arquivos de teste — fixe `**/*.spec.ts` (§2).                 |
| `fullyParallel` | Roda os arquivos em paralelo.                                            |
| `forbidOnly`    | Falha o run se sobrar um `test.only` — ligue em CI (`!!process.env.CI`). |
| `retries`       | Retentativas; costume: `2` em CI, `0` local.                             |
| `workers`       | Paralelismo; costume: `1` em CI, `undefined` (auto) local.               |
| `reporter`      | `"html"` gera relatório navegável (`npx playwright show-report`).        |
| `use`           | Padrões de contexto: `baseURL`, `trace`, `screenshot`, `video`.          |
| `projects`      | Um por browser/perfil, via `devices[...]`.                               |
| `webServer`     | Sobe o app antes dos testes (§5).                                        |

`baseURL` é o que faz `page.goto("/")` funcionar com caminho relativo. `trace:
"on-first-retry"` guarda o rastro só quando um teste falha e é repetido — barato e útil no
debug.

Exemplo completo, já sem comentários e com as chaves em ordem alfabética (`write-code` §1 —
a ordem das chaves não afeta o Playwright):

```ts
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  forbidOnly: !!process.env.CI,
  fullyParallel: true,
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  reporter: "html",
  retries: process.env.CI ? 2 : 0,
  testDir: "e2e",
  testMatch: "**/*.spec.ts",
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
  },
  webServer: {
    command: "npm run build && npm run start",
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
    url: "http://localhost:3000",
  },
  workers: process.env.CI ? 1 : undefined,
});
```

Comece com um único `project` (`chromium`). Firefox e WebKit entram quando houver motivo —
cada um multiplica o tempo do run.

---

## 5. `webServer` — subir o app

O `webServer` faz o Playwright **subir o app sozinho** antes dos testes e derrubar no fim. É
o que satisfaz o "app subindo do zero" do CAR-120.

| Chave                 | Papel                                                                                        |
| --------------------- | -------------------------------------------------------------------------------------------- |
| `command`             | Comando que sobe o servidor.                                                                 |
| `url`                 | URL que o Playwright espera responder 2xx/3xx/40x antes de começar. **Prefira a `port`.**    |
| `reuseExistingServer` | Reusa um servidor já de pé. Costume: `!process.env.CI` (reusa local, sobe limpo em CI).      |
| `timeout`             | Espera máxima pelo servidor subir (ms). Default 60000; `next build && next start` pede mais. |
| `env`                 | Variáveis passadas ao processo. Herda `process.env` + `PLAYWRIGHT_TEST=1`.                   |
| `cwd`                 | Diretório do processo; default é o da config.                                                |
| `stdout` / `stderr`   | `"pipe"` mostra a saída do servidor; `"ignore"` silencia.                                    |

`port` é legado — use `url`, que valida o **status HTTP**, não só a porta aberta.

### `command`: build vs dev

- **`npm run build && npm run start`** — sobe a build de produção. Mais fiel ao que vai pro ar
  (inclui o Partial Prerender do Cache Components). É o padrão recomendado para E2E.
- **`npm run dev`** — mais rápido de iterar, mas não exercita a build.

A escolha esbarra numa armadilha **deste projeto**: `next build`/`next start` rodam em
`NODE_ENV=production` e **não leem `.env.development.local`** — onde o `DATABASE_URL` mora
hoje. Em produção o Next carrega `.env.local` / `.env.production.local`, não o de
desenvolvimento. Logo, com `next start` o `DATABASE_URL` precisa estar num arquivo que
produção lê, **ou** ser injetado via `webServer.env`.

### Injetar o `DATABASE_URL` no servidor de teste

Sem `webServer.env`, o app de produção não enxerga o `DATABASE_URL` do
`.env.development.local`. Duas saídas:

1. Colocar o `DATABASE_URL` em `.env.local` (lido em todo modo não-teste).
2. Reusar o loader do próprio Next — `@next/env` já é devDependency — na config do Playwright
   e repassar via `env`:

```ts
import { loadEnvConfig } from "@next/env";
import { defineConfig } from "@playwright/test";

loadEnvConfig(process.cwd());

export default defineConfig({
  webServer: {
    command: "npm run build && npm run start",
    env: {
      DATABASE_URL: process.env.DATABASE_URL ?? "",
    },
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
    url: "http://localhost:3000",
  },
});
```

`loadEnvConfig` só carrega — não imprime valor de segredo. Ainda assim, **qual** `DATABASE_URL`
o E2E usa é a decisão de banco do §6.

---

## 6. Preparação de banco — a decisão do CAR-120

O card pede definir **como o banco é preparado**: base separada ou reset entre execuções. O
E2E fala com o banco de verdade (não há mock nessa camada), então o estado precisa ser
previsível. Duas estratégias:

- **Base separada** — um banco/branch Neon só para teste. `DATABASE_URL` aponta para ele via
  `webServer.env`. Isola do banco de desenvolvimento; migrações aplicadas uma vez. Mais limpo,
  custa uma base a mais.
- **Reset entre execuções** — um setup global trunca e semeia as tabelas antes do run. Sem
  base extra, mas o reset precisa ser confiável para não deixar lixo de uma execução na outra.

Qualquer operação real no banco (migrar, truncar, semear) **passa pela skill `drizzle`** — o
`db` só é importável em Server Component/Action/route, e o reset roda fora do app, então
confirme lá o caminho de conexão e de transação antes de escrever.

### Onde rodar o setup

O jeito recomendado hoje são **dependências de projeto**: um projeto `setup` que roda antes,
declarado como `dependencies` dos projetos de browser. Ganha trace, fixtures e aparece no
relatório — melhor que o `globalSetup`/`globalTeardown` legado.

```ts
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  projects: [
    {
      name: "chromium",
      dependencies: ["setup"],
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "setup",
      testMatch: "**/global.setup.ts",
    },
  ],
  testDir: "e2e",
});
```

```ts
import { test as setup } from "@playwright/test";

setup("prepara o banco", async ({}) => {});
```

O corpo do `setup` chama a rotina de reset/seed baseada em Drizzle. `global.setup.ts` não casa
`**/*.spec.ts` nem `**/*.test.ts`, então nem o Playwright comum nem o Vitest o pegam por
engano.

Para o MVP do CAR-120 — "abrir a home e validar que renderiza" — talvez nem precise semear:
se a home tolera lista vazia, o teste roda sem setup de dados. Decida o mínimo que prova o
fluxo, não o mais elaborado.

---

## 7. Escrever teste, rodar, script

`test` e `expect` de `@playwright/test`. Cada teste recebe a fixture `page` num contexto
isolado — um teste não contamina o outro.

```ts
import { expect, test } from "@playwright/test";

test("home renderiza a lista de todos", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "Todo list" })).toBeVisible();
});
```

- `page.goto("/")` — caminho relativo resolve contra a `baseURL`.
- **Locators por papel/rótulo, não por CSS frágil:** `getByRole`, `getByText`, `getByLabel`.
- **Asserções web-first** (`await expect(...)`) esperam a condição sozinhas — sem `sleep`:
  `toBeVisible`, `toHaveText`, `toHaveTitle`, `toHaveURL`.
- Agrupe com `test.describe` e prepare com `test.beforeEach`.

### CLI

| Comando                                  | O que faz                                     |
| ---------------------------------------- | --------------------------------------------- |
| `npx playwright test`                    | Roda todos os specs em todos os projetos.     |
| `npx playwright test home.spec.ts`       | Roda um arquivo.                              |
| `npx playwright test --project=chromium` | Roda só um projeto/browser.                   |
| `npx playwright test --headed`           | Mostra o browser durante o run.               |
| `npx playwright test --ui`               | Modo UI, o melhor para desenvolver e depurar. |
| `npx playwright test --debug`            | Abre o Inspector para passo a passo.          |
| `npx playwright show-report`             | Abre o relatório HTML do último run.          |

### Script

O CAR-120 pede o script. Adicione ao `package.json` (chaves em ordem alfabética, como as
demais):

```json
"test:e2e": "playwright test"
```

`test` (Vitest) e `test:e2e` (Playwright) são runners distintos e não se cruzam.

---

## 8. Configuração e `.gitignore`

Os artefatos do Playwright **não vão para o repositório**. O `.gitignore` atual não os cobre —
adicione, mantendo a ordem alfabética do arquivo:

```
blob-report
playwright-report
playwright/.cache
test-results
```

`playwright.config.ts` é TypeScript e o projeto é ESM (`"type": "module"`) — sintaxe de
`import`/`export` direta, sem `require`. Por isso a preferência por dependências de projeto no
§6 em vez do `globalSetup` com `require.resolve`.

Nada de `any` na config nem nos specs (`write-code` §5). Um único assunto por arquivo.

---

## 9. Armadilhas comuns

- Spec nomeado `.test.ts` — o Vitest o pega e quebra. E2E é sempre `.spec.ts` (§2).
- Esquecer o `testMatch: "**/*.spec.ts"` — o Playwright tenta rodar os `.test.ts` do Vitest.
- `next start` sem `DATABASE_URL` visível — produção não lê `.env.development.local` (§5).
- `timeout` do `webServer` curto demais para `next build && next start` — suba para ~120s.
- `waitForTimeout`/`sleep` fixo — use asserção web-first, que já espera a condição.
- Locator por seletor CSS acoplado ao markup — prefira `getByRole`/`getByText`.
- Deixar os comentários e o `example.spec.ts` que o scaffold gera (§1, `write-code` §6).
- Versionar `test-results/` ou `playwright-report/` (§8).
- Usar Playwright para regra de domínio — isso é Vitest.

---

## Mapa de documentação

Quando este arquivo não cobrir, busque a URL antes de escrever. Prefixo:
`https://playwright.dev/docs`.

| Assunto                 | Caminho                       |
| ----------------------- | ----------------------------- |
| Assertions (expect)     | `/test-assertions`            |
| CI                      | `/ci`                         |
| Configuração            | `/test-configuration`         |
| Fixtures                | `/test-fixtures`              |
| Instalação / intro      | `/intro`                      |
| Locators                | `/locators`                   |
| Projetos e dependências | `/test-projects`              |
| Rodar testes (CLI)      | `/running-tests`              |
| Setup/teardown global   | `/test-global-setup-teardown` |
| Trace viewer            | `/trace-viewer-intro`         |
| webServer               | `/test-webserver`             |
| Escrever testes         | `/writing-tests`              |

---

## Pare e pergunte

- A tarefa pede autenticação/estado de sessão salvo (`storageState`), teste de componente,
  teste de API ou sharding de CI — não está aqui; leia a doc da versão 1.62 antes.
- O reset/seed do banco precisa de operação Drizzle — vá pela skill `drizzle`.
- A API necessária não está neste arquivo e a página de doc não confirma o comportamento na
  1.62.
- A solução exigiria `any`, comentário fora dos dois permitidos, ou spec `.test.ts`.
