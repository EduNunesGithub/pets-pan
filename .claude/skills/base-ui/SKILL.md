---
name: base-ui
description: Referência do Base UI v1 (primitivos de UI headless e acessíveis) usada neste projeto. Use SEMPRE antes de escrever ou alterar qualquer componente que apoie num primitivo interativo — Dialog, Alert Dialog, Popover, Menu, Select, Combobox, Autocomplete, Tooltip, Tabs, Accordion, Switch, Checkbox, Radio, Slider, Toast, Number Field, OTP Field — ou que toque o modelo de composição (`render`, `useRender`, `mergeProps`), o par `Field`/`Form`, ou a estilização por `data-*` de estado. Gatilhos: modal, dialog, drawer, dropdown, menu, select, combobox, tooltip, popover, tabs, accordion, toggle, primitivo acessível, `@base-ui/react`, `render` prop, `useRender`, `mergeProps`, data-attribute de estado, `Positioner`, `Portal`.
---

# Base UI — primitivos de UI acessíveis

Versão de referência: **`@base-ui/react@1.6.0`** (dist-tag `latest` do npm), React 19,
TypeScript 6. Documentação consultada em 2026-08-02.

Escolhido no lugar do **Headless UI**: o Base UI é a convergência dos times de Radix e Headless
UI num só projeto, com cobertura muito maior (Dialog, Combobox, Select, Menu, Toast, Navigation
Menu, Slider…) e um modelo de composição por `render` mais flexível que o `as`/`asChild`. Entrega
o comportamento e a acessibilidade **sem estilo** — a aparência sai inteira dos nossos tokens
(`docs/design-language.md`).

Se algo aqui não cobrir sua dúvida, **não escreva de memória** — busque a página no
[mapa de documentação](#mapa-de-documentação) e leia antes.

---

## ⚠️ Armadilha de versão — o pacote foi renomeado no v1.0.0

Este é o erro nº 1 e ele é silencioso. No `v1.0.0` (11/12/2025) **o escopo do pacote mudou**:

> "The package name has changed from `@base-ui-components/react` to `@base-ui/react`."

| Época                      | Pacote                      | npm                       |
| -------------------------- | --------------------------- | ------------------------- |
| alpha/beta/rc (pré-1.0)    | `@base-ui-components/react` | congelado em `1.0.0-rc.0` |
| **estável (o que usamos)** | **`@base-ui/react`**        | `1.6.0`                   |

Consequências práticas, todas quebram em runtime ou no install:

- **Import.** É `@base-ui/react/dialog`, **nunca** `@base-ui-components/react/dialog`. Todo
  tutorial, thread de fórum e resposta de memória anterior a dez/2025 usa o escopo velho.
- **Instalação.** `npm i @base-ui-components/react` traz uma linha morta parada no `rc.0`.
- Se um exemplo importa de `@base-ui-components/react`, ele é pré-1.0 — **traduza o import
  antes de copiar qualquer coisa dele**, e desconfie do resto da API.

---

## 1. Instalação e layout de arquivos

O repositório fixa versão exata (como Drizzle e Vitest). O `.npmrc` da raiz já tem
`legacy-peer-deps=true`, então **não** precisa passar a flag:

```bash
npm i @base-ui/react@1.6.0 --save-exact
```

**Peers opcionais.** `date-fns`, `@date-fns/tz` e `@types/react` são `peerDependenciesMeta:
optional`. Só instale `date-fns` se for usar um componente de data — o install padrão não pede
nada além do React 19 que já temos (peer `^17 || ^18 || ^19`).

**Setup global (uma vez).** O Base UI recomenda duas regras no CSS global. Vão no
`app/globals.css`, dentro do `@layer base`:

```css
@layer base {
  body {
    position: relative;
  }
}
```

`body { position: relative }` cobre um bug de posicionamento no Safari iOS 26+. A outra regra da
doc — `isolation: isolate` no contêiner-raiz da app — cria um _stacking context_ próprio para os
`Portal`s; aplique-a ao elemento que embrulha a árvore da página se aparecer conflito de
`z-index`. Confirme o texto atual em `overview/quick-start` antes de mexer.

**Onde os componentes moram.** Base UI é biblioteca, não é rota. Todo wrapper nosso segue a
`write-code`: `components/<nome>/index.tsx`, um componente por arquivo, import por alias `@/`. O
Base UI vem no grupo 1 (externo), com **subpath import** por primitivo — nunca um barril.

```tsx
import { Dialog } from "@base-ui/react/dialog";
```

---

## 2. Fronteira Server/Client (skill `nextjs`)

Os primitivos do Base UI usam estado, contexto e eventos — são **Client Components**. Regras:

- O arquivo que renderiza um primitivo interativo precisa de `'use client'` na primeira linha.
- **Não** ponha `'use client'` no `layout` raiz nem numa `page` grande só por causa de um modal.
  Isole o pedaço interativo num componente-folha (`components/<nome>/index.tsx`) com a diretiva, e
  deixe o resto Server Component.
- Um `Dialog.Popup` pode receber conteúdo Server Component **por `children`** — a fronteira
  `'use client'` não captura `children` (skill `nextjs` §2). Passe o conteúdo estático como
  filho, não o importe dentro do arquivo cliente.

---

## 3. Anatomia por partes

Cada primitivo é um **componente composto**: um `Root` que carrega o estado por contexto e partes
nomeadas que você monta. Você controla a marcação inteira — nada é escondido.

Os primitivos **flutuantes** (Popover, Menu, Select, Combobox, Tooltip, Preview Card) seguem o
mesmo esqueleto: `Root → Trigger → Portal → Positioner → Popup`. O `Positioner` é obrigatório
neles — é quem ancora o popup ao gatilho. O **Dialog** e o **Alert Dialog** se centralizam
sozinhos, então **não** têm `Positioner`: usam `Backdrop` + `Popup`.

```tsx
"use client";

import { Dialog } from "@base-ui/react/dialog";

export function ConfirmArchive() {
  return (
    <Dialog.Root>
      <Dialog.Trigger>Arquivar</Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Backdrop />
        <Dialog.Popup>
          <Dialog.Title>Arquivar animal</Dialog.Title>
          <Dialog.Description>
            Ele sai da operação e vai para o arquivo. Dá para reabrir depois.
          </Dialog.Description>
          <Dialog.Close>Cancelar</Dialog.Close>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
```

Partes do Dialog: `Root` (estado/contexto) · `Trigger` (abre) · `Portal` (renderiza fora da
hierarquia do DOM) · `Backdrop` (overlay) · `Viewport` (contêiner de rolagem, opcional) · `Popup`
(o cartão) · `Title` · `Description` · `Close`.

**Controle de abertura.** Não-controlado por padrão. Para controlar, `open` + `onOpenChange` no
`Root` (exige `'use client'`, é `useState`):

```tsx
const [open, setOpen] = useState(false);
return (
  <Dialog.Root onOpenChange={setOpen} open={open}>
    {}
  </Dialog.Root>
);
```

---

## 4. Composição — `render`, `useRender`, `mergeProps`

Base UI **não** tem `asChild` (isso é Radix). A composição é pelo prop **`render`**, em duas
formas. A regra de ouro: **o componente que você passa precisa repassar o `ref` e espalhar todos
os props recebidos** no nó DOM de baixo.

**Forma elemento** — troca o elemento renderizado por outro componente seu:

```tsx
<Menu.Trigger render={<MyButton size="md" />}>Abrir menu</Menu.Trigger>
```

**Forma função** — recebe `(props, state)` e devolve o elemento; use quando precisa do estado:

```tsx
<Switch.Thumb
  render={(props, state) => (
    <span {...props}>
      {state.checked ? <CheckedIcon /> : <UncheckedIcon />}
    </span>
  )}
/>
```

**`useRender` + `mergeProps`** — para dar a um **primitivo nosso** a mesma API `render` do Base
UI (é assim que um `button` ou o `text-field` viram peças componíveis). `mergeProps` junta, da
esquerda para a direita, os três tipos que dá para fundir com segurança: **handlers de evento**
(todos disparam), **strings de `className`** e **propriedades de `style`**; o resto sobrescreve.

```tsx
import { mergeProps, useRender } from "@base-ui/react/merge-props";

type TextProps = useRender.ComponentProps<"p">;

export function Text({ render, ...otherProps }: TextProps) {
  return useRender({
    defaultTagName: "p",
    props: mergeProps<"p">({ className: "text-ink" }, otherProps),
    render,
  });
}
```

`useRender.ComponentProps<'p'>` já traz o `render` tipado e os props do `<p>` — é o tipo certo
para não cair em `any` (proibido, `write-code` §5).

---

## 5. Estilização — data-attributes + tokens

O Base UI só expõe **estado**; a pele é nossa. Três mecanismos:

1. **`data-*` de estado.** Cada parte publica atributos de estado para você estilizar: um Menu
   Item ganha `data-highlighted`, um popup ganha `data-popup-open`, a animação de entrada/saída
   dá `data-starting-style` / `data-ending-style`.
2. **`className` string ou função de estado.** A forma função recebe o `state`:

   ```tsx
   <Switch.Thumb
     className={(state) => (state.checked ? "bg-pine" : "bg-line")}
   />
   ```

3. **Variáveis CSS** para valores dinâmicos: `var(--available-height)`, `var(--transform-origin)`
   etc., úteis em `max-height`/`transform` do popup.

No **Tailwind v4** os `data-*` viram variantes direto na classe — `data-popup-open:`,
`data-highlighted:`, `data-starting-style:`, `data-ending-style:`:

```tsx
<Menu.Item className="flex items-center px-item py-snug text-sm data-highlighted:bg-pine data-highlighted:text-paper">
  Adicionar à fila
</Menu.Item>
```

**Estilize sempre pelos tokens do `design-language`** (`bg-pine`, `text-ink`, `gap-item`,
`px-inset`…). Os exemplos da doc oficial usam `neutral-950`, `white`, valores em `px` — não copie
essas classes cruas; traduza para os nossos tokens. Espaçamento e tipografia seguem a
`ui-code-conventions` (hierarquia `--spacing-*`, tamanho só por token nativo, layout por `gap`).

---

## 6. `Field` e `Form` — o que é do Base UI e o que não é

O Base UI traz um par de formulário próprio:

- **`Field.Root`** (recebe `name`), **`Field.Label`**, **`Field.Control`**, **`Field.Error`**,
  **`Field.Description`** — cuidam da **associação acessível** (label↔control, `aria-describedby`,
  anúncio de erro) de graça.
- **`Form`** agrega os `Field` no submit e aceita `errors` para exibir erro vindo do **servidor**
  (mesclado ao estado do campo).
- Validação nativa (`required`, `minLength`, `pattern`…), um prop **`validate`** (função síncrona
  ou assíncrona, roda após a validação nativa) e **`validationMode`** (`onSubmit` padrão, `onBlur`,
  `onChange`).

**Divisão de responsabilidade neste projeto.** Não usamos o `validate` do Base UI para regra de
formulário. Neste stack:

- **estado do formulário** é do **`@tanstack/react-form`**;
- **validação** é do **`zod`** (schema único que serve cliente e Server Action);
- o **`Field`** do Base UI entra pela **acessibilidade e estrutura** (Label/Control/Error/
  Description), com a validade dirigida pelo estado do TanStack.

A mecânica dessa ponte — como o campo do TanStack alimenta `Field.Control` (via `render`) e como o
erro do Zod aparece no `Field.Error` — é da skill **`tanstack-form`**. Aqui, só saiba que o
`Field` é o esqueleto acessível, não o dono da validação.

---

## 7. Conciliação com `write-code`

- **Um componente por arquivo**, em `components/<nome>/index.tsx`. Um composto do Base UI
  (`Dialog.Root`, `Dialog.Trigger`…) é **um** primitivo montado dentro do nosso componente — não
  são vários componentes no arquivo.
- **Sub-parte reutilizada** por mais de um pai sobe para o nível compartilhado.
- **Props em JSX em ordem alfabética** (`onOpenChange` antes de `open`; `className` antes de
  `render`). A ordem das **partes** (`Trigger` → `Portal` → `Popup`) é semântica — não alfabetize.
- **Import por subpath**, no grupo externo, alfabético.
- **Sem `any`.** Use os tipos exportados (`useRender.ComponentProps<'p'>`, os props de cada parte).
- **Sem comentário.** Nome de componente e de prop explica; não anote a marcação.

---

## 8. Armadilhas

- **Escopo velho.** `@base-ui-components/react` em qualquer import/exemplo = pré-1.0. Traduza para
  `@base-ui/react` (ver o topo).
- **`asChild` não existe.** Quem procura `asChild` está lendo Radix — aqui é `render`, e o custom
  precisa repassar `ref` **e** espalhar os props.
- **`Positioner` esquecido.** Popover/Menu/Select/Combobox/Tooltip **precisam** de `Portal +
Positioner + Popup`; sem o `Positioner` o popup não ancora. Dialog/Alert Dialog **não** têm
  `Positioner`.
- **Faltou `'use client'`.** Primitivo interativo em arquivo Server Component quebra. Isole a folha
  interativa; não suba a diretiva para o layout.
- **`className` de função e o estado.** Se precisa reagir a `checked`/`open`/`highlighted`, use a
  forma função `(state) => …` ou a variante `data-*` do Tailwind — não tente ler o estado por fora.
- **Copiar a pele da doc.** Os exemplos vêm com `neutral-*`/`white`/px — reescreva nos tokens.
- **`date-fns`.** Peer opcional; só instale se usar componente de data. Não adicione "por via das
  dúvidas".

---

## Mapa de documentação

Quando este arquivo não cobrir, busque a URL antes de escrever. Toda página tem uma versão `.md`
crua (basta acrescentar `.md`). Prefixo: `https://base-ui.com/react`.

| Assunto                        | Caminho                     |
| ------------------------------ | --------------------------- |
| Quick start / instalação       | `/overview/quick-start`     |
| Acessibilidade                 | `/overview/accessibility`   |
| Releases (changelog por vers.) | `/overview/releases`        |
| Composição (`render`)          | `/handbook/composition`     |
| Estilização                    | `/handbook/styling`         |
| Animação                       | `/handbook/animation`       |
| Customização                   | `/handbook/customization`   |
| Formulários                    | `/handbook/forms`           |
| TypeScript                     | `/handbook/typescript`      |
| `useRender`                    | `/utils/use-render`         |
| `mergeProps`                   | `/utils/merge-props`        |
| Direction Provider             | `/utils/direction-provider` |
| CSP Provider                   | `/utils/csp-provider`       |
| Dialog                         | `/components/dialog`        |
| Alert Dialog                   | `/components/alert-dialog`  |
| Popover                        | `/components/popover`       |
| Menu / Context Menu / Menubar  | `/components/menu`          |
| Select                         | `/components/select`        |
| Combobox / Autocomplete        | `/components/combobox`      |
| Tooltip                        | `/components/tooltip`       |
| Tabs                           | `/components/tabs`          |
| Accordion / Collapsible        | `/components/accordion`     |
| Checkbox / Radio / Switch      | `/components/checkbox`      |
| Field / Fieldset / Form        | `/components/field`         |
| Input / Number Field / OTP     | `/components/input`         |
| Toast                          | `/components/toast`         |

O índice completo de páginas está em `https://base-ui.com/llms.txt`.

---

## Pare e pergunte

- O primitivo que você precisa **não está** no mapa acima — confirme o nome e a API na doc da
  `1.6.0` antes de escrever.
- A API que um exemplo mostra **não bate** com o que este arquivo diz, ou o exemplo importa do
  escopo `@base-ui-components/react` — é pré-1.0; não copie de memória.
- A tela precisa de **componente de data** (traz o peer `date-fns`) — alinhe a versão do peer
  antes de instalar.
- A ponte **`Field` ↔ `@tanstack/react-form` ↔ `zod`** — a mecânica é da skill `tanstack-form`;
  se ela ainda não cobre, pergunte em vez de inventar.
