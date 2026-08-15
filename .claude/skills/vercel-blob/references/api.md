# `@vercel/blob@2.8.0` — API server-side

Fonte: `node_modules/@vercel/blob/dist/index.d.ts` +
https://vercel.com/docs/vercel-blob/using-blob-sdk

## Opções comuns

Todas as operações aceitam `BlobCommandOptions`:

| Opção         | Tipo          | Default                             |
| ------------- | ------------- | ----------------------------------- |
| `token`       | `string`      | `process.env.BLOB_READ_WRITE_TOKEN` |
| `oidcToken`   | `string`      | `process.env.VERCEL_OIDC_TOKEN`     |
| `storeId`     | `string`      | `process.env.BLOB_STORE_ID`         |
| `abortSignal` | `AbortSignal` | —                                   |

`token` explícito vence tudo. Sem ele, OIDC (`oidcToken` + `storeId`) vence
`BLOB_READ_WRITE_TOKEN`.

As operações de escrita (`put`, `copy`, `rename`, `createFolder`) somam
`CommonCreateBlobOptions`:

| Opção                | Tipo                    | Default              | Nota                                             |
| -------------------- | ----------------------- | -------------------- | ------------------------------------------------ |
| `access`             | `'public' \| 'private'` | **obrigatório**      | `'private'` exige autenticação para ler          |
| `addRandomSuffix`    | `boolean`               | `false`              | sufixo aleatório no nome                         |
| `allowOverwrite`     | `boolean`               | `false`              | sem isso, `pathname` repetido lança erro         |
| `contentType`        | `string`                | inferido da extensão |                                                  |
| `cacheControlMaxAge` | `number` (s)            | `2592000` (1 mês)    | mínimo 60                                        |
| `ifMatch`            | `string`                | —                    | ETag; falha com `BlobPreconditionFailedError`    |
| `maximumSizeInBytes` | `number`                | —                    | só validado no cliente em `multipart`; máx. 5 TB |

## `put`

```ts
put(pathname: string, body: PutBody, options: PutCommandOptions): Promise<PutBlobResult>

type PutBody = string | Readable | Buffer | Blob | ArrayBuffer | ReadableStream | File;
```

`PutCommandOptions` = `CommonCreateBlobOptions` + `multipart?: boolean` (default `false`) +
`onUploadProgress?: ({ loaded, total, percentage }) => void`.

```ts
interface PutBlobResult {
  contentDisposition: string;
  contentType: string;
  downloadUrl: string;
  pathname: string;
  url: string;
}
```

Exemplo canônico do projeto:

```ts
const blob = await put(
  `animals/${organizationId}/${animalId}/card.webp`,
  buffer,
  { access: "public", addRandomSuffix: true, contentType: "image/webp" },
);
```

## `putImage`

```ts
putImage(
  pathname: string,
  bodyOrUrl: PutBody | URL,
  options: PutImageCommandOptions,
): Promise<PutBlobResult>

interface OptimizeImageOptions {
  format?: "avif" | "jpeg" | "png" | "webp";
  quality?: number; /* 1-100, default 75 */
  width: number;    /* 1-8192, obrigatório */
}
```

Otimiza pela Vercel Image Optimization e guarda só o resultado. Exige OIDC. Cobrado como
transformação de imagem + put. `optimizeImage` no `put` está **deprecado** em favor disto.
Não usamos — veja a SKILL.

## `del`

```ts
del(urlOrPathname: string[] | string, options?: DeleteCommandOptions): Promise<void>
```

`DeleteCommandOptions` = `BlobCommandOptions` + `ifMatch?: string` (só para URL única).
Aceita array para remoção em lote.

## `head`

```ts
head(urlOrPathname: string, options?: BlobCommandOptions): Promise<HeadBlobResult>

interface HeadBlobResult {
  cacheControl: string;
  contentDisposition: string;
  contentType: string;
  downloadUrl: string;
  etag: string;
  pathname: string;
  size: number;
  uploadedAt: Date;
  url: string;
}
```

## `list`

```ts
list<M extends "expanded" | "folded" | undefined>(
  options?: ListCommandOptions<M>,
): Promise<ListCommandResult<M>>
```

| Opção    | Default      | Nota                                            |
| -------- | ------------ | ----------------------------------------------- |
| `limit`  | `1000`       |                                                 |
| `prefix` | —            | com `mode: 'folded'`, inclua a barra final      |
| `cursor` | —            | paginação                                       |
| `mode`   | `'expanded'` | `'folded'` agrupa pastas em `folders: string[]` |

Retorno: `{ blobs: ListBlobResultBlob[]; cursor?: string; hasMore: boolean }`, onde cada
blob tem `downloadUrl`, `etag`, `pathname`, `size`, `uploadedAt`, `url`.

Listar por prefixo é como se varre as fotos de uma organização:
`list({ prefix: `animals/${organizationId}/` })`.

## `copy` e `rename`

```ts
copy(fromUrlOrPathname: string, toPathname: string, options: CopyCommandOptions)
rename(fromUrlOrPathname: string, toPathname: string, options: RenameCommandOptions)
```

Ambas recebem `CommonCreateBlobOptions` (portanto `access` obrigatório) e **não preservam
metadados** do original — `cacheControlMaxAge` e afins precisam ser redefinidos. `rename`
copia e depois apaga a origem; se a cópia falhar, a origem fica intacta.

## Classes de erro

Todas estendem `BlobError`:

`BlobAccessError`, `BlobClientTokenExpiredError`, `BlobContentTypeNotAllowedError`,
`BlobFileTooLargeError`, `BlobNotFoundError`, `BlobPathnameMismatchError`,
`BlobPreconditionFailedError`, `BlobRequestAbortedError`, `BlobServiceNotAvailable`,
`BlobServiceRateLimited`, `BlobStoreNotFoundError`, `BlobStoreSuspendedError`,
`BlobUnknownError`.

Trate ao menos `BlobNotFoundError` (leitura de blob removido) e `BlobServiceRateLimited`
(retry) explicitamente; o resto pode cair no catch genérico da Server Action.

## Multipart

`put(..., { multipart: true })` fatia o arquivo, sobe em paralelo e refaz partes que
falharem. Para controle manual existem `createMultipartUpload`, `createMultipartUploader`,
`uploadPart` e `completeMultipartUpload`. Só vale para arquivo grande — foto processada em
webp não chega perto.
