---
name: react-dropzone
description: react-dropzone — área de drag'n'drop de arquivos. Use antes de escrever ou alterar qualquer coisa que receba arquivo por drop/seleção — campo de upload de foto, dropzone, seleção de imagem no formulário. NÃO é necessária para exibir imagem já enviada nem para o processamento no servidor (sharp) ou a persistência (vercel-blob). Gatilhos: `useDropzone`, `getRootProps`, `getInputProps`, `isDragActive`, `fileRejections`, `accept`, dropzone, drag and drop, área de upload, soltar arquivo.
---

# react-dropzone — área de drag'n'drop

Versão de referência: **`react-dropzone@20.1.0`**. Documentação e typings consultados em
2026-08-13. Import: `import { useDropzone } from "react-dropzone"`. É um **hook de cliente** —
o arquivo que o usa começa com `"use client"`.

## Referências desta skill

| Preciso de                                                       | Leia                |
| ---------------------------------------------------------------- | ------------------- |
| Assinatura de `useDropzone`, todas as opções e o `DropzoneState` | `references/api.md` |

Se nada disso cobrir, **não escreva de memória** — a versão saltou rápido de major (14 → 20)
e a doc online em `react-dropzone.js.org` ainda descreve a 14.x. A fonte confiável é
`node_modules/react-dropzone/dist/index.d.ts`.

## Armadilha de versão

A `20.1.0` **não é** a 14.x que quase todo exemplo mostra. Diferenças que importam:

- `accept` é `{ [mime]: string | readonly string[] }` **ou** um array de grupos
  (`AcceptGroup[]`) — não a lista de strings de MIME das versões antigas.
- Há `validator` **assíncrono** (pode ler dimensão da imagem antes de aceitar) e
  `isProcessing` no estado enquanto ele roda.
- `getErrorMessage(error, file)` centraliza a tradução das mensagens de rejeição — é o lugar
  para pt-BR, não `switch` no `code` espalhado pela UI.
- `onDrop` recebe `File[]` padrão; `acceptedFiles` no estado é `FileWithPath[]`.
- Peer é `react >= 18` — funciona no React 19 do projeto.

## Doutrina do projeto

- **O dropzone é um campo do design system, não um componente solto.** Ele mora num
  `components/<nome>-field` registrado no `createFormHook` (skill `tanstack-form`), lê o valor
  por `useFieldContext<File | null>()` e escreve com `field.handleChange`. O estado do arquivo
  é do TanStack Form, como qualquer outro campo — nunca um `useState` paralelo.
- **Um arquivo por vez:** `maxFiles: 1` + `multiple: false`. A galeria de fotos é uma lista
  no servidor; o dropzone envia uma foto por submit.
- **Restrinja o tipo pelo `accept`, não o tamanho.** `accept` recebe os MIME de
  `acceptedPhotoMimeTypes` (`domain/animal/photo.ts`). **Não** ponha `maxSize` para barrar
  imagem grande — o `prepareUpload` (canvas no cliente) reduz o arquivo antes do envio; barrar
  no dropzone mataria imagem legítima que só precisava encolher. O teto real de 4,5 MB é
  garantido depois do `prepareUpload`, na Server Action (skill `vercel-blob`).
- **Mensagem de rejeição em pt-BR via `getErrorMessage`.** Traduza pelo menos
  `file-invalid-type`; devolva `error.message` para o resto.
- **A validação de negócio continua na fronteira.** O dropzone é UX: ele não substitui o
  parse com Zod na Server Action nem o reprocessamento no `sharp`. Tipo aceito no cliente é
  conveniência; a autoridade é o servidor.

## Fiação mínima

`getRootProps()` vai no container (a área pontilhada); `getInputProps()` **precisa** ir num
`<input>` — sem ele não há clique nem seleção por teclado. Os estados `isDragActive` /
`isDragAccept` / `isDragReject` pintam a borda durante o arrasto.

```tsx
const { getInputProps, getRootProps, isDragActive } = useDropzone({
  accept: { "image/jpeg": [], "image/png": [], "image/webp": [] },
  maxFiles: 1,
  multiple: false,
  onDrop: (accepted) => {
    const file = accepted[0];
    if (file) {
      field.handleChange(file);
    }
  },
});
```

## Armadilhas

| Armadilha                                  | O que acontece                                                           |
| ------------------------------------------ | ------------------------------------------------------------------------ |
| Copiar exemplo com `accept: ['image/png']` | É API pré-15; na 20 `accept` é objeto/`AcceptGroup[]` — não compila      |
| Esquecer `<input {...getInputProps()} />`  | Sem clique nem teclado; só drag funciona, e o campo fica inacessível     |
| `maxSize` para barrar imagem grande        | Rejeita foto que o `prepareUpload` reduziria — barre tamanho no servidor |
| `useState` para o arquivo dentro do campo  | Estado paralelo ao TanStack Form; use `useFieldContext`/`handleChange`   |
| Traduzir erro com `switch` na UI           | Espalha lógica; centralize em `getErrorMessage`                          |
| Hook sem `"use client"`                    | `useDropzone` é hook — quebra em Server Component                        |

## Checklist

- [ ] Arquivo com `"use client"`; o campo lê/escreve via `useFieldContext`/`handleChange`
- [ ] `accept` como objeto de MIME (de `acceptedPhotoMimeTypes`), `maxFiles: 1`, `multiple: false`
- [ ] `<input {...getInputProps()} />` presente
- [ ] Sem `maxSize` barrando imagem grande — redução no `prepareUpload`, teto no servidor
- [ ] Rejeição traduzida em `getErrorMessage`
