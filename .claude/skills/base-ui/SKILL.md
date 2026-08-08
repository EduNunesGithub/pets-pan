---
name: base-ui
description: Base UI v1 — primitivos de UI headless e acessíveis. Use antes de escrever ou alterar componente apoiado num primitivo interativo (Dialog, Popover, Menu, Select, Combobox, Tooltip, Tabs, Toast…) ou que toque composição (`render`, `useRender`, `mergeProps`) e o par `Field`/`Form`. NÃO é necessária para mudança puramente visual (classe, token, espaçamento) num wrapper existente. Gatilhos: modal, dialog, dropdown, menu, select, combobox, tooltip, popover, tabs, `@base-ui/react`, `render` prop, `Positioner`, `Portal`.
---

# Base UI — primitivos de UI acessíveis

Versão de referência: **`@base-ui/react@1.6.0`**, React 19. Documentação consultada em
2026-08-02. Escolhido no lugar do Headless UI: convergência dos times Radix + Headless UI,
cobertura maior, composição por `render`. Comportamento e acessibilidade **sem estilo** — a
pele sai dos nossos tokens.

**⚠️ Armadilha nº 1 — o pacote foi renomeado no v1.0.0** (11/12/2025): de
`@base-ui-components/react` para **`@base-ui/react`**. O escopo velho está congelado no
`1.0.0-rc.0`. Todo tutorial/resposta de memória anterior a dez/2025 usa o escopo velho — o
import é `@base-ui/react/dialog`, e se um exemplo importa do escopo antigo, é pré-1.0:
traduza o import e desconfie do resto.

## Referências desta skill

| Preciso de                                                                                     | Leia                        |
| ---------------------------------------------------------------------------------------------- | --------------------------- |
| Anatomia (Root/Trigger/Portal/Positioner), `render`/`useRender`/`mergeProps`, fronteira client | `references/composition.md` |
| Instalação, setup global, estilização por `data-*`/tokens, `Field`/`Form`, mapa da doc         | `references/styling.md`     |

**Os exports são mais amplos do que a doc lista** — inclui `Button`, `Input`, `Select` e
outros. Antes de assumir que um primitivo não existe, cheque
`node_modules/@base-ui/react/` (ou o `llms.txt` da doc). Prefira sempre o primitivo do Base
UI a um elemento cru quando houver equivalente.

## Decisões fixas do projeto

- **Subpath import por primitivo** (`@base-ui/react/dialog`), nunca barril.
- **Composição por `render`** — `asChild` não existe (isso é Radix); o componente passado
  repassa `ref` e espalha os props.
- **Pele 100% em tokens do design-language** — nunca copie as classes cruas
  (`neutral-*`, px) dos exemplos da doc.
- **`Field` do Base UI = esqueleto acessível**; estado é do TanStack Form, validação é do
  Zod. A ponte é da skill `tanstack-form`.
- **`'use client'` na folha interativa**, nunca no layout/page inteiros; conteúdo estático
  entra por `children` (não é capturado pela fronteira).

## Armadilhas

- **Escopo velho** `@base-ui-components/react` — pré-1.0; traduza (ver topo).
- **`asChild`** — não existe; é `render`.
- **`Positioner` esquecido** — Popover/Menu/Select/Combobox/Tooltip precisam de
  `Portal + Positioner + Popup`; Dialog/Alert Dialog **não** têm `Positioner`
  (`Backdrop` + `Popup`).
- **Faltou `'use client'`** — primitivo interativo em Server Component quebra.
- **Estado por fora** — para reagir a `checked`/`open`/`highlighted`, use a `className`
  função `(state) => …` ou a variante `data-*` do Tailwind.
- **Copiar a pele da doc** — reescreva nos tokens.
- **`date-fns`** — peer opcional; só com componente de data.

## Pare e pergunte

- O primitivo não aparece no mapa nem nos exports instalados — confirme na doc da `1.6.0`
  antes de escrever.
- A API de um exemplo não bate com estas referências — provável pré-1.0; não copie de
  memória.
- A tela precisa de componente de data (traz o peer `date-fns`) — alinhe a versão antes.
- A ponte `Field` ↔ TanStack ↔ Zod fora do que a skill `tanstack-form` cobre — pergunte.
