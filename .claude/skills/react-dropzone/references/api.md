# react-dropzone 20.1.0 — API

Extraído de `node_modules/react-dropzone/dist/index.d.ts`. É a fonte de verdade; se algo
aqui divergir do typing instalado, o typing vence — atualize este arquivo.

## `useDropzone(options?): DropzoneState`

Hook que cria a área de drag'n'drop. Também há um componente wrapper `Dropzone` (default
export) que recebe `children` como render-prop — no projeto usamos o **hook**.

## Opções (`DropzoneOptions`)

| Opção                 | Tipo                                                             | Nota                                                            |
| --------------------- | ---------------------------------------------------------------- | --------------------------------------------------------------- |
| `accept`              | `{ [mime]: string \| readonly string[] }` ou `AcceptGroup[]`     | Extensão pode ser `[]` (aceita todas as extensões daquele MIME) |
| `minSize` / `maxSize` | `number` (bytes)                                                 | Ver doutrina: **não** usar `maxSize` para barrar imagem grande  |
| `maxFiles`            | `number`                                                         | `1` no projeto                                                  |
| `multiple`            | `boolean`                                                        | `false` no projeto                                              |
| `disabled`            | `boolean`                                                        | Desliga a zona                                                  |
| `noClick`             | `boolean`                                                        | Sem abrir o seletor por clique                                  |
| `noKeyboard`          | `boolean`                                                        | Sem abrir por teclado (SPACE/ENTER)                             |
| `noDrag`              | `boolean`                                                        | Só seleção por clique                                           |
| `noPaste`             | `boolean`                                                        | Desliga colar arquivo (Ctrl/Cmd+V) — ligado por padrão          |
| `onDrop`              | `(accepted: File[], rejections: FileRejection[], event) => void` | Dispara em toda seleção/drop                                    |
| `onDropAccepted`      | `(files: File[], event) => void`                                 | Só quando passa na validação                                    |
| `onDropRejected`      | `(rejections: FileRejection[], event) => void`                   | Só quando reprova                                               |
| `validator`           | `(file) => ValidatorResult \| Promise<ValidatorResult>`          | Custom; pode ser `async` (então `isProcessing` fica `true`)     |
| `getErrorMessage`     | `(error: FileError, file: File) => string`                       | Traduz a mensagem de qualquer rejeição — ponto único do pt-BR   |
| `onError`             | `(err: Error) => void`                                           | Erro inesperado (ex.: `validator` lançou)                       |
| `useFsAccessApi`      | `boolean`                                                        | Usa File System Access API quando disponível                    |
| `autoFocus`           | `boolean`                                                        | Foca a raiz ao montar                                           |

## Estado (`DropzoneState`)

| Campo                   | Tipo                       | Uso                                         |
| ----------------------- | -------------------------- | ------------------------------------------- |
| `getRootProps(props?)`  | função                     | Espalhe no container da zona                |
| `getInputProps(props?)` | função                     | Espalhe num `<input>` — obrigatório         |
| `isFocused`             | `boolean`                  | Raiz focada                                 |
| `isDragActive`          | `boolean`                  | Há arrasto sobre a zona                     |
| `isDragAccept`          | `boolean`                  | Arrasto compatível com `accept`             |
| `isDragReject`          | `boolean`                  | Arrasto incompatível                        |
| `isProcessing`          | `boolean`                  | `validator`/leitura assíncrona em andamento |
| `acceptedFiles`         | `readonly FileWithPath[]`  | Arquivos aceitos até agora                  |
| `fileRejections`        | `readonly FileRejection[]` | `{ file, errors: FileError[] }`             |
| `open()`                | `() => void`               | Abre o seletor programaticamente            |
| `rootRef` / `inputRef`  | `RefObject`                | Refs dos elementos                          |

## Tipos de erro (`ErrorCode`)

`file-invalid-type` · `file-too-large` · `file-too-small` · `too-many-files`.
`FileError` é `{ message: string; code: ErrorCode | string }`. Um `validator` custom pode
devolver `code` próprio (string livre).

## `accept` — forma exata

```ts
{ "image/jpeg": [], "image/png": [".png"], "image/webp": [] }
```

Chave é o MIME; valor é extensão única ou array delas. `[]` aceita qualquer extensão daquele
MIME. Passar `AcceptGroup[]` (`{ description?, accept }[]`) só muda o rótulo no seletor do
File System Access API; o `<input>` nativo achata tudo num único `accept`.
