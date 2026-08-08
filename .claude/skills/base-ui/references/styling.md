# Base UI — instalação, estilização e Field/Form

## Instalação e setup

Versão exata fixada; o `.npmrc` da raiz já tem `legacy-peer-deps=true`:

```bash
npm i @base-ui/react@1.6.0 --save-exact
```

**Peers opcionais.** `date-fns`, `@date-fns/tz` e `@types/react` são opcionais. Só instale
`date-fns` se for usar componente de data.

**Setup global (uma vez).** No `app/globals.css`, dentro do `@layer base`:

```css
@layer base {
  body {
    position: relative;
  }
}
```

`body { position: relative }` cobre um bug de posicionamento no Safari iOS 26+. A outra
regra da doc — `isolation: isolate` no contêiner-raiz — cria um stacking context próprio
para os `Portal`s; aplique se aparecer conflito de `z-index`. Confirme o texto atual em
`overview/quick-start` antes de mexer.

**Onde os componentes moram.** Base UI é biblioteca, não rota. Todo wrapper nosso:
`components/<nome>/index.tsx`, import por alias `@/`. O Base UI vem no grupo externo, com
**subpath import** por primitivo — nunca um barril:

```tsx
import { Dialog } from "@base-ui/react/dialog";
```

## Estilização — data-attributes + tokens

O Base UI só expõe **estado**; a pele é nossa. Três mecanismos:

1. **`data-*` de estado.** Cada parte publica atributos: um Menu Item ganha
   `data-highlighted`, um popup ganha `data-popup-open`, a animação de entrada/saída dá
   `data-starting-style` / `data-ending-style`.
2. **`className` string ou função de estado.** A forma função recebe o `state`:

   ```tsx
   <Switch.Thumb
     className={(state) => (state.checked ? "bg-pine" : "bg-line")}
   />
   ```

3. **Variáveis CSS** para valores dinâmicos: `var(--available-height)`,
   `var(--transform-origin)` — úteis em `max-height`/`transform` do popup.

No **Tailwind v4** os `data-*` viram variantes direto na classe — `data-popup-open:`,
`data-highlighted:`, `data-starting-style:`, `data-ending-style:`:

```tsx
<Menu.Item className="flex items-center px-item py-snug text-sm data-highlighted:bg-pine data-highlighted:text-paper">
  Adicionar à fila
</Menu.Item>
```

**Estilize sempre pelos tokens do `design-language`** (`bg-pine`, `text-ink`, `gap-item`,
`px-inset`…). Os exemplos da doc oficial usam `neutral-950`, `white`, valores em `px` — não
copie essas classes cruas; traduza para os tokens.

## `Field` e `Form` — o que é do Base UI e o que não é

O Base UI traz um par de formulário próprio:

- **`Field.Root`** (recebe `name`), **`Field.Label`**, **`Field.Control`**,
  **`Field.Error`**, **`Field.Description`** — cuidam da **associação acessível**
  (label↔control, `aria-describedby`, anúncio de erro) de graça.
- **`Form`** agrega os `Field` no submit e aceita `errors` para exibir erro vindo do
  servidor.
- Validação nativa (`required`, `minLength`, `pattern`…), um prop **`validate`** e
  **`validationMode`** (`onSubmit` padrão, `onBlur`, `onChange`).

**Divisão de responsabilidade neste projeto.** Não usamos o `validate` do Base UI para regra
de formulário:

- **estado do formulário** é do **`@tanstack/react-form`**;
- **validação** é do **`zod`** (schema único, cliente e Server Action);
- o **`Field`** do Base UI entra pela **acessibilidade e estrutura**, com a validade
  dirigida pelo estado do TanStack.

A mecânica dessa ponte é da skill **`tanstack-form`** (`references/composition.md` de lá).

## Mapa da documentação oficial

Toda página tem uma versão `.md` crua (acrescente `.md`). Prefixo:
`https://base-ui.com/react`. Índice completo: `https://base-ui.com/llms.txt`.

| Assunto                       | Caminho                     |
| ----------------------------- | --------------------------- |
| Quick start / instalação      | `/overview/quick-start`     |
| Acessibilidade                | `/overview/accessibility`   |
| Releases (changelog)          | `/overview/releases`        |
| Composição (`render`)         | `/handbook/composition`     |
| Estilização                   | `/handbook/styling`         |
| Animação                      | `/handbook/animation`       |
| Customização                  | `/handbook/customization`   |
| Formulários                   | `/handbook/forms`           |
| TypeScript                    | `/handbook/typescript`      |
| `useRender`                   | `/utils/use-render`         |
| `mergeProps`                  | `/utils/merge-props`        |
| Direction Provider            | `/utils/direction-provider` |
| CSP Provider                  | `/utils/csp-provider`       |
| Dialog                        | `/components/dialog`        |
| Alert Dialog                  | `/components/alert-dialog`  |
| Popover                       | `/components/popover`       |
| Menu / Context Menu / Menubar | `/components/menu`          |
| Select                        | `/components/select`        |
| Combobox / Autocomplete       | `/components/combobox`      |
| Tooltip                       | `/components/tooltip`       |
| Tabs                          | `/components/tabs`          |
| Accordion / Collapsible       | `/components/accordion`     |
| Checkbox / Radio / Switch     | `/components/checkbox`      |
| Field / Fieldset / Form       | `/components/field`         |
| Input / Number Field / OTP    | `/components/input`         |
| Toast                         | `/components/toast`         |
