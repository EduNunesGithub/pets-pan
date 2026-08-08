---
name: vitest
description: Vitest 4 — testes da camada de domínio sem framework. Use antes de escrever ou alterar qualquer coisa que MUDE teste de domínio — `vitest.config`, arquivo `.test.ts`, `describe`/`it`/`expect`, mock/spy com `vi`, fake timers. NÃO cobre teste de browser/E2E (Playwright, `.spec.ts`) e NÃO é necessária para mudanças de código que não tocam testes. Gatilhos: escrever teste, testar regra de negócio, `vitest.config`, mock, spy, `vi.fn`, fake timer, `npm test`, TDD.
---

# Vitest 4 — camada de domínio

Versão de referência: **`vitest@4.1.10`** (fixada com `--save-exact`). Requer Node ≥ 20.
Documentação consultada em 2026-07-30.

**Atenção:** a linha estável saltou para a **v4**. Boa parte de tutorial e de resposta de
memória descreve a **v3**, que tem outra assinatura de `test()` e outras opções de config
(`workspace`, `poolOptions`, `environmentMatchGlobs`, `maxThreads`). Nunca copie exemplo com
essas opções — é v3 e foi removido.

## Referências desta skill

| Preciso de                                                         | Leia                    |
| ------------------------------------------------------------------ | ----------------------- |
| `vitest.config.ts`, alias `@/`, defaults                           | `references/config.md`  |
| Escrever/rodar teste, mock, fake timers, as 18 regras, mapa da doc | `references/writing.md` |

Se nada disso cobrir, **não escreva de memória** — o mapa da documentação oficial está no
fim de `references/writing.md`.

## Papel do Vitest neste projeto

Cobre **só a camada de domínio** — motor de pipeline, ciclo de vida do animal, as 18 regras
de `docs/domain.md`. É a razão de a arquitetura manter essa lógica em módulo puro: regra de
negócio em função pura se testa em milissegundos, sem servidor e sem mock de framework.

O que **não** é do Vitest:

- Componente React, `page`, Server Action, route handler → camada Next, coberta por
  **Playwright** (`.spec.ts`).
- Query real no banco → teste de domínio não abre conexão; a lógica que decide _o que_
  gravar é pura, o `db/` só persiste.

Regra prática: se o teste precisa de `render`, browser ou `DATABASE_URL`, não é deste runner.

Convenções: teste co-locado (`close-animal.ts` + `close-animal.test.ts`), `it` dentro de
`describe`, descrição em **português** citando a regra pelo número — a string do teste é a
documentação do comportamento.

## Armadilhas

- Copiar config v3: `workspace` (agora `projects`), `poolOptions` (achatado),
  `environmentMatchGlobs`/`poolMatchGlobs` (removidos), `maxThreads`/`maxForks` (agora
  `maxWorkers`). O erro aparece no start.
- Opções de `test()` no 3º argumento — na v4 é o 2º.
- Quebrar o alias `@/` na config: todo import de domínio falha com "cannot find module".
- `environment: 'jsdom'` para lógica pura: desnecessário; `jsdom` é sinal de teste de UI
  (Playwright).
- Esperar `describe`/`expect` globais: `globals` é `false`; importe de `vitest`.
- `reporter: 'basic'` — removido na v4; use `tree` para a árvore antiga.
- Teste que abre conexão de banco ou faz `render`: não é teste de domínio.

## Pare e pergunte

- O teste precisa de DOM, `render` ou browser → é Playwright, outra skill.
- A tarefa pede `vite-tsconfig-paths`, `@testing-library/*`, `@vitest/coverage-*` ou outro
  pacote do ecossistema sem skill.
- Escolher provider de cobertura (`v8` × `istanbul`).
- A API necessária não está nas referências e a doc não confirma o comportamento na `4.1.10`.
- O comportamento a testar contradiz `docs/domain.md` — aponte a contradição, não invente o
  teste que a esconde.
