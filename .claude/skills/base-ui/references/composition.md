# Base UI — anatomia e composição

## Anatomia por partes

Cada primitivo é um **componente composto**: um `Root` que carrega o estado por contexto e
partes nomeadas que você monta. Você controla a marcação inteira — nada é escondido.

Os primitivos **flutuantes** (Popover, Menu, Select, Combobox, Tooltip, Preview Card) seguem
o mesmo esqueleto: `Root → Trigger → Portal → Positioner → Popup`. O `Positioner` é
obrigatório neles — é quem ancora o popup ao gatilho. O **Dialog** e o **Alert Dialog** se
centralizam sozinhos, então **não** têm `Positioner`: usam `Backdrop` + `Popup`.

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
hierarquia do DOM) · `Backdrop` (overlay) · `Viewport` (contêiner de rolagem, opcional) ·
`Popup` (o cartão) · `Title` · `Description` · `Close`.

**Controle de abertura.** Não-controlado por padrão. Para controlar, `open` + `onOpenChange`
no `Root` (exige `'use client'`, é `useState`):

```tsx
const [open, setOpen] = useState(false);
return (
  <Dialog.Root onOpenChange={setOpen} open={open}>
    {}
  </Dialog.Root>
);
```

## Composição — `render`, `useRender`, `mergeProps`

Base UI **não** tem `asChild` (isso é Radix). A composição é pelo prop **`render`**, em duas
formas. A regra de ouro: **o componente que você passa precisa repassar o `ref` e espalhar
todos os props recebidos** no nó DOM de baixo.

**Forma elemento** — troca o elemento renderizado por outro componente seu:

```tsx
<Menu.Trigger render={<MyButton size="md" />}>Abrir menu</Menu.Trigger>
```

**Forma função** — recebe `(props, state)` e devolve o elemento; use quando precisa do
estado:

```tsx
<Switch.Thumb
  render={(props, state) => (
    <span {...props}>
      {state.checked ? <CheckedIcon /> : <UncheckedIcon />}
    </span>
  )}
/>
```

**`useRender` + `mergeProps`** — para dar a um **primitivo nosso** a mesma API `render` do
Base UI. `mergeProps` junta, da esquerda para a direita, os três tipos que dá para fundir
com segurança: **handlers de evento** (todos disparam), **strings de `className`** e
**propriedades de `style`**; o resto sobrescreve.

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

`useRender.ComponentProps<'p'>` já traz o `render` tipado e os props do `<p>` — é o tipo
certo para não cair em `any`.

## Fronteira Server/Client

Os primitivos usam estado, contexto e eventos — são **Client Components**:

- O arquivo que renderiza um primitivo interativo precisa de `'use client'` na primeira
  linha.
- **Não** ponha `'use client'` no `layout` raiz nem numa `page` grande por causa de um
  modal. Isole numa folha (`components/<nome>/index.tsx`).
- Um `Dialog.Popup` pode receber conteúdo Server Component **por `children`** — a fronteira
  não captura `children` (skill `nextjs`). Passe o conteúdo estático como filho, não o
  importe dentro do arquivo cliente.
