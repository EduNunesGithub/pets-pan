# Playwright — configuração, webServer e banco

## `playwright.config.ts`

`defineConfig` de `@playwright/test`. As opções centrais:

| Opção           | Papel                                                                     |
| --------------- | ------------------------------------------------------------------------- |
| `testDir`       | Pasta dos specs (`e2e`).                                                  |
| `testMatch`     | Padrão dos arquivos — fixado em `**/*.spec.ts` (fronteira com o Vitest).  |
| `fullyParallel` | Roda os arquivos em paralelo.                                             |
| `forbidOnly`    | Falha o run se sobrar um `test.only` — ligado em CI (`!!process.env.CI`). |
| `retries`       | Retentativas; `2` em CI, `0` local.                                       |
| `workers`       | Paralelismo; `1` em CI, `undefined` (auto) local.                         |
| `reporter`      | `"html"` gera relatório navegável (`npx playwright show-report`).         |
| `use`           | Padrões de contexto: `baseURL`, `trace`, `screenshot`, `video`.           |
| `projects`      | Um por browser/perfil, via `devices[...]`.                                |
| `webServer`     | Sobe o app antes dos testes.                                              |

`baseURL` é o que faz `page.goto("/")` funcionar com caminho relativo.
`trace: "on-first-retry"` guarda o rastro só quando um teste falha e é repetido.

Comece com um único `project` (`chromium`) — é a config atual. Firefox e WebKit entram quando
houver motivo; cada um multiplica o tempo do run.

Para (re)instalar browsers e dependências de sistema: `npx playwright install --with-deps`.

## `webServer` — subir o app

| Chave                 | Papel                                                                                  |
| --------------------- | -------------------------------------------------------------------------------------- |
| `command`             | Comando que sobe o servidor.                                                           |
| `url`                 | URL que precisa responder 2xx/3xx/40x antes de começar. **Prefira à `port`** (legada). |
| `reuseExistingServer` | Reusa servidor de pé. `!process.env.CI` — reusa local, sobe limpo em CI.               |
| `timeout`             | Espera máxima (ms). Default 60000; `next build && next start` pede ~120s.              |
| `env`                 | Variáveis passadas ao processo. Herda `process.env` + `PLAYWRIGHT_TEST=1`.             |
| `stdout` / `stderr`   | `"pipe"` mostra a saída do servidor; `"ignore"` silencia.                              |

### `command`: dev vs build

- **`npm run dev`** — o atual do projeto: rápido de iterar; não exercita a build.
- **`npm run build && npm run start`** — build de produção, mais fiel (inclui o Partial
  Prerender do Cache Components). Candidato natural quando o E2E for para CI.

A troca esbarra numa armadilha **deste projeto**: `next build`/`next start` rodam em
`NODE_ENV=production` e **não leem `.env.development.local`** — onde o `DATABASE_URL` mora.
Duas saídas:

1. `DATABASE_URL` em `.env.local` (lido em todo modo não-teste).
2. Reusar o loader do Next (`@next/env`, já devDependency) na config e repassar via `env`:

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

## Preparação de banco

O E2E fala com o banco de verdade (sem mock nessa camada). Hoje: **smoke read-only na base de
dev**; base dedicada entra quando um fluxo real precisar semear. Duas estratégias:

- **Base separada** — banco/branch Neon só para teste; `DATABASE_URL` via `webServer.env`.
- **Reset entre execuções** — setup global trunca e semeia antes do run.

Qualquer operação real no banco (migrar, truncar, semear) **passa pela skill `drizzle`**.

### Onde rodar o setup

**Dependências de projeto**: um projeto `setup` declarado como `dependencies` dos projetos de
browser. Ganha trace, fixtures e relatório — melhor que `globalSetup`/`globalTeardown` legado.

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

`global.setup.ts` não casa `**/*.spec.ts` nem `**/*.test.ts` — nenhum runner o pega por
engano. Decida o mínimo que prova o fluxo: se a tela tolera lista vazia, o teste roda sem
seed.

## `.gitignore`

Artefatos do Playwright **não são versionados** (já cobertos no `.gitignore` atual):

```
blob-report
playwright-report
playwright/.cache
test-results
```

## Mapa da documentação oficial

Prefixo: `https://playwright.dev/docs`.

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
