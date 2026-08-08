# Playwright — escrever e rodar testes

## O que o Playwright testa

O Playwright não sabe nem se importa se um componente é Server ou Client. Ele dirige um
browser real contra o app já renderizado — vê o HTML do prerender, a hidratação, o streaming
do `<Suspense>` e a interação. É o teste certo para:

- uma página carregar e renderizar o conteúdo;
- um fluxo com Server Action (submeter formulário, ver o efeito);
- comportamento que depende de rota, cookie de sessão, redirect.

Não é o teste certo para regra de negócio pura de `domain/` — essa é do Vitest,
milissegundos, sem browser.

## Escrever

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

Nomes de arquivo em `kebab-case`: `home.spec.ts`, `adopter-flow.spec.ts`. Imports internos
por alias `@/`; `@playwright/test` fica no grupo de externos.

## CLI

| Comando                                  | O que faz                                     |
| ---------------------------------------- | --------------------------------------------- |
| `npx playwright test`                    | Roda todos os specs em todos os projetos.     |
| `npx playwright test home.spec.ts`       | Roda um arquivo.                              |
| `npx playwright test --project=chromium` | Roda só um projeto/browser.                   |
| `npx playwright test --headed`           | Mostra o browser durante o run.               |
| `npx playwright test --ui`               | Modo UI, o melhor para desenvolver e depurar. |
| `npx playwright test --debug`            | Abre o Inspector para passo a passo.          |
| `npx playwright show-report`             | Abre o relatório HTML do último run.          |

O script do projeto é `npm run test:e2e` (`playwright test`). `test` (Vitest) e `test:e2e`
são runners distintos que não se cruzam.
