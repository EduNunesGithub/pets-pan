---
name: playwright
description: Testes de ponta a ponta com Playwright — a camada Next (page, layout, Server Action, route) rodando no navegador. Use ao MUDAR playwright.config.ts, specs .spec.ts, o webServer ou a preparação de banco do E2E. NÃO cobre teste de domínio (Vitest) nem componente isolado, e NÃO é necessária para mudanças no app que não tocam spec nem config de E2E. Gatilhos: e2e, spec, webServer, test:e2e, smoke test, fluxo no browser.
---

# Playwright — testes de ponta a ponta

Versão de referência: **Playwright 1.62**, Node 22/24/26, TypeScript 6. Documentação
consultada em 2026-07-31.

**Estado atual**: instalado e configurado (CAR-120) — `playwright.config.ts` na raiz com
`webServer` subindo `npm run dev`, projeto único `chromium`, smoke read-only em
`e2e/home.spec.ts` contra a base de dev.

## Referências desta skill

| Preciso de                                                                      | Leia                    |
| ------------------------------------------------------------------------------- | ----------------------- |
| Config, `webServer`, env/`DATABASE_URL`, banco de teste, gitignore, mapa da doc | `references/config.md`  |
| Escrever spec, locators, asserções, CLI                                         | `references/writing.md` |

Se nada disso cobrir, **não escreva de memória** — o mapa da documentação oficial está no
fim de `references/config.md`.

## A fronteira dura com o Vitest

**`.test.ts` é do Vitest, `.spec.ts` é do Playwright.** Sem sobreposição:

- O Vitest varre `**/*.test.ts` em qualquer pasta — um spec de browser nomeado `.test.ts`
  seria pego por ele e quebraria (não há browser no runner).
- O Playwright por padrão casa os dois padrões — por isso a config fixa
  `testMatch: "**/*.spec.ts"`.

Specs moram em **`e2e/`**, na raiz, fora de `app/`. Se o teste não precisa de browser nem do
app subindo, não é deste runner — regra de negócio pura é Vitest.

## Armadilhas

- Spec nomeado `.test.ts` — o Vitest o pega e quebra.
- Remover o `testMatch` da config — o Playwright invade os `.test.ts` do Vitest.
- `next start` sem `DATABASE_URL` visível — produção não lê `.env.development.local` (ver
  `references/config.md`).
- `timeout` do `webServer` curto demais para `next build && next start` — ~120s.
- `waitForTimeout`/`sleep` fixo — asserção web-first já espera a condição.
- Locator por CSS acoplado ao markup — prefira `getByRole`/`getByText`.
- Versionar `test-results/` ou `playwright-report/`.
- Usar Playwright para regra de domínio — isso é Vitest.

## Pare e pergunte

- A tarefa pede `storageState` (sessão salva), teste de componente, teste de API ou sharding
  de CI — não coberto; leia a doc da 1.62 antes.
- O reset/seed do banco precisa de operação Drizzle — vá pela skill `drizzle`.
- Mudar a estratégia de banco do E2E (base dedicada, seed) — decisão de infra, confirme com o
  dono.
- A API necessária não está nas referências e a doc não confirma o comportamento na 1.62.
