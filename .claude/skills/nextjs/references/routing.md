# Next.js — estrutura de `app/` e tipos de rota

## Estrutura de `app/`

Pastas definem segmentos de URL. Uma rota só fica pública quando ganha um `page` ou um
`route`. Qualquer outro arquivo dentro de `app/` é colocado sem virar rota.

**Arquivos de convenção** (nomes fixos, não renomeie):

| Arquivo        | Extensões           | Papel                               |
| -------------- | ------------------- | ----------------------------------- |
| `default`      | `.js` `.jsx` `.tsx` | Fallback de rota paralela           |
| `error`        | `.js` `.jsx` `.tsx` | Error boundary do segmento          |
| `global-error` | `.js` `.jsx` `.tsx` | Error boundary raiz                 |
| `layout`       | `.js` `.jsx` `.tsx` | UI compartilhada, envolve os filhos |
| `loading`      | `.js` `.jsx` `.tsx` | Suspense boundary do segmento       |
| `not-found`    | `.js` `.jsx` `.tsx` | UI de "não encontrado"              |
| `page`         | `.js` `.jsx` `.tsx` | Rota pública                        |
| `route`        | `.js` `.ts`         | Endpoint HTTP                       |
| `template`     | `.js` `.jsx` `.tsx` | Layout remontado a cada navegação   |

Hierarquia de renderização em cada segmento:
`layout` → `template` → `error` → `loading` → `not-found` → `page` (ou `layout` aninhado).

**Segmentos dinâmicos:**

| Pasta         | Casa com                        |
| ------------- | ------------------------------- |
| `[id]`        | `/animal/123`                   |
| `[...slug]`   | `/docs/a`, `/docs/a/b`          |
| `[[...slug]]` | `/docs`, `/docs/a`, `/docs/a/b` |

**Organização sem afetar a URL:**

- `(grupo)` — route group: some da URL. Serve para separar seções e para dar layouts
  diferentes ao mesmo nível.
- `_pasta` — private folder: sai inteiramente do roteamento.

`layout` raiz é obrigatório e precisa conter `<html>` e `<body>`.

## Tipos gerados de rota

O Next gera helpers **globais**, sem import, durante `next dev`, `next build` e
`next typegen`:

```tsx
export default async function Page(props: PageProps<"/animal/[id]">) {
  const { id } = await props.params;
}
```

```tsx
export default function Layout(props: LayoutProps<"/">) {
  return (
    <html lang="pt-BR">
      <body>{props.children}</body>
    </html>
  );
}
```

```ts
export async function GET(
  request: Request,
  context: RouteContext<"/api/animal/[id]">,
) {
  const { id } = await context.params;
}
```

**Não declare tipos locais chamados `PageProps`, `LayoutProps` ou `RouteContext`** — eles
sombreiam os globais e você perde a checagem de rota.

`params` e `searchParams` são **Promise**. Sempre `await`.

## Server e Client Components

**Tudo é Server Component por padrão.** `page` e `layout` inclusive.

Use **Client Component** (`'use client'` na primeira linha do arquivo) quando precisar de:
estado, event handler, `useEffect`, hook customizado, ou API de browser (`window`,
`localStorage`).

Use **Server Component** quando precisar de: acesso a banco, segredo/token, redução de
JavaScript no cliente, streaming.

### Semântica de `'use client'`

`'use client'` declara uma **fronteira do grafo de módulos**, não um componente isolado.
A partir dele, tudo que o arquivo **importa** e os componentes que ele **renderiza
diretamente** entram no bundle do cliente. Não é preciso repetir a diretiva em cada
componente abaixo.

A fronteira **não** captura Server Components recebidos como `children` ou outra prop — esses
são renderizados no servidor e chegam já prontos.

```tsx
"use client";

export default function Modal({ children }: { children: React.ReactNode }) {
  return <div>{children}</div>;
}
```

```tsx
export default function Page() {
  return (
    <Modal>
      <Cart />
    </Modal>
  );
}
```

`<Cart />` continua sendo Server Component.

### Regras práticas

- Props passadas de Server para Client precisam ser **serializáveis**.
- React Context **não funciona** em Server Component. Crie um provider `'use client'` que
  aceita `children` e renderize-o o mais fundo possível na árvore.
- Biblioteca de terceiros que usa hooks sem declarar `'use client'`: envolva num arquivo
  próprio com a diretiva e reexporte.
- Só variáveis com prefixo `NEXT_PUBLIC_` vão para o bundle. As demais viram string vazia no
  cliente — o que **não** é proteção suficiente. Para código que nunca pode ir ao cliente,
  importe `server-only` no topo do módulo.
