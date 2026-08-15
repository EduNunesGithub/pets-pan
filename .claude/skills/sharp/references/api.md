# `sharp@0.35.3` — API

Fonte: https://sharp.pixelplumbing.com (constructor, resize, output, utility)

## Construtor

```ts
sharp(input?: Buffer | ArrayBuffer | Uint8Array | string, options?: SharpOptions)
```

`input` aceita Buffer, ArrayBuffer, TypedArray, caminho de arquivo (string) ou array de
imagens. Sem `input`, a instância funciona como stream.

| Opção                | Tipo                | Default     | Nota                                            |
| -------------------- | ------------------- | ----------- | ----------------------------------------------- |
| `failOn`             | string              | `'warning'` | `'none' \| 'truncated' \| 'error' \| 'warning'` |
| `limitInputPixels`   | `number \| boolean` | `268402689` | largura × altura; `false` remove o limite       |
| `limitInputChannels` | `number \| boolean` | `5`         |                                                 |
| `unlimited`          | boolean             | `false`     | remove salvaguardas de memória                  |
| `autoOrient`         | boolean             | `false`     | equivale a chamar `.autoOrient()`               |
| `sequentialRead`     | boolean             | `true`      |                                                 |
| `density`            | number              | `72`        | DPI para SVG/PDF                                |
| `animated`           | boolean             | `false`     | lê todos os quadros                             |
| `pages`              | number              | `1`         | `-1` para todas                                 |
| `page`               | number              | `0`         |                                                 |

`clone()` devolve nova instância herdando a entrada — é como se produz várias saídas de uma
mesma origem.

## `resize`

```ts
resize(width?: number, height?: number, options?: ResizeOptions): Sharp
```

`width` ou `height` em `null`/`undefined` escala pelo outro lado, preservando proporção.

| Opção                | Default                      | Nota                                      |
| -------------------- | ---------------------------- | ----------------------------------------- |
| `fit`                | `'cover'`                    | ver abaixo                                |
| `position`           | `'centre'`                   | âncora para `cover`/`contain`             |
| `background`         | `{ r:0, g:0, b:0, alpha:1 }` | preenchimento do `contain`                |
| `kernel`             | `'lanczos3'`                 | algoritmo de reamostragem                 |
| `withoutEnlargement` | `false`                      | impede upscale                            |
| `withoutReduction`   | `false`                      | impede downscale                          |
| `fastShrinkOnLoad`   | `true`                       | otimização de shrink-on-load em JPEG/WebP |

Valores de `fit`:

- **`cover`** (default) — preserva proporção, cobre as duas dimensões, **cortando** o excesso.
- **`contain`** — preserva proporção, cabe dentro das duas dimensões, com letterbox.
- **`fill`** — ignora proporção e estica.
- **`inside`** — preserva proporção, o maior possível com ambas as dimensões ≤ as pedidas. Sem corte.
- **`outside`** — preserva proporção, o menor possível com ambas as dimensões ≥ as pedidas.

Para capa de tamanho exato: `cover`. Para "no máximo 1600px de lado": `inside` com só um
valor ou os dois iguais.

## Saída

```ts
toBuffer(): Promise<Buffer>
toBuffer({ resolveWithObject: true }): Promise<{ data: Buffer; info: OutputInfo }>
toFile(path: string): Promise<OutputInfo>
toUint8Array(): { data: Uint8Array; info: OutputInfo }
```

`info` traz `format`, `size`, `width`, `height`, `channels`, `premultiplied`. Use
`resolveWithObject` quando as dimensões finais forem para o banco.

### Defaults por formato

| `webp()`         |             | `jpeg()`            |           | `png()`             |         | `avif()`            |           |
| ---------------- | ----------- | ------------------- | --------- | ------------------- | ------- | ------------------- | --------- |
| `quality`        | `80`        | `quality`           | `80`      | `compressionLevel`  | `6`     | `quality`           | `50`      |
| `effort`         | `4` (0–6)   | `progressive`       | `false`   | `progressive`       | `false` | `effort`            | `4` (0–9) |
| `lossless`       | `false`     | `chromaSubsampling` | `'4:2:0'` | `palette`           | `false` | `lossless`          | `false`   |
| `alphaQuality`   | `100`       | `optimiseCoding`    | `true`    | `adaptiveFiltering` | `false` | `chromaSubsampling` | `'4:4:4'` |
| `nearLossless`   | `false`     | `mozjpeg`           | `false`   |                     |         |                     |           |
| `smartSubsample` | `false`     |                     |           |                     |         |                     |           |
| `preset`         | `'default'` |                     |           |                     |         |                     |           |

O projeto usa `webp({ quality: 75 })`. `effort` maior comprime mais e gasta mais CPU — em
função serverless cobrada por CPU ativa, subir `effort` troca armazenamento por compute.
Não mexa sem medir.

## Metadado

| Método                                  | Efeito                                                 |
| --------------------------------------- | ------------------------------------------------------ |
| `metadata()`                            | Lê formato, dimensões, EXIF etc. **sem** processar     |
| `keepMetadata()`                        | Mantém EXIF, ICC, XMP, IPTC                            |
| `withMetadata(options?)`                | Mantém a maior parte; aceita `orientation` e `density` |
| `keepExif()` / `withExif()`             | Controle fino de EXIF                                  |
| `keepIccProfile()` / `withIccProfile()` | Perfil de cor                                          |
| `autoOrient()`                          | Aplica a orientação do EXIF nos pixels                 |

**Por padrão sharp descarta metadado na saída.** Para foto pública é o comportamento
desejado — o EXIF pode conter GPS.

`metadata()` é a forma correta de descobrir o formato real de um upload:

```ts
const { format, height, width } = await sharp(buffer).metadata();

if (format !== "jpeg" && format !== "png" && format !== "webp") {
  /* recusa */
}
```

## Utilitários globais

| Função                              | Default                           | Uso                                            |
| ----------------------------------- | --------------------------------- | ---------------------------------------------- |
| `sharp.cache()`                     | 50 MB, 20 arquivos, 100 operações | cache do libvips; `sharp.cache(false)` desliga |
| `sharp.concurrency()`               | nº de cores da CPU                | `0` reseta para o nº de cores                  |
| `sharp.simd()`                      | `true`                            | acelera `resize`, `blur`, `sharpen`            |
| `sharp.counters()`                  | —                                 | `{ queue, process }` — monitoração             |
| `sharp.block()` / `sharp.unblock()` | —                                 | bloqueia operações do libvips por nome         |
