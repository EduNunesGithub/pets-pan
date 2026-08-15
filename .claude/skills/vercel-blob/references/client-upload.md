# Upload direto do browser

Fonte: https://vercel.com/docs/vercel-blob/client-upload +
`node_modules/@vercel/blob/dist/client.d.ts`

## Quando usar

**Só quando o arquivo pode passar de 4,5 MB.** É o teto de corpo de request documentado
para upload server-side. Abaixo disso, Server Action é mais simples e mantém o `sharp` no
caminho.

O custo dessa escolha: **o arquivo vai cru do browser para o Blob**. O `sharp` não roda no
meio. Para processar, seria preciso um passo posterior (`onUploadCompleted` baixando,
processando e regravando) — mais peças e mais cobrança. Por isso o projeto prefere o caminho
server-side.

## Requisito de credencial

`handleUpload` **exige `BLOB_READ_WRITE_TOKEN`** para emitir o token de cliente. OIDC não
cobre este caso.

## Cliente

```tsx
"use client";

import { upload } from "@vercel/blob/client";

const blob = await upload(file.name, file, {
  access: "public",
  handleUploadUrl: "/api/animals/photos/upload",
});
```

## Rota

```ts
import { handleUpload } from "@vercel/blob/client";

import type { HandleUploadBody } from "@vercel/blob/client";

export async function POST(request: Request): Promise<Response> {
  const body = (await request.json()) as HandleUploadBody;

  const jsonResponse = await handleUpload({
    body,
    onBeforeGenerateToken: async () => {
      const organizationId = await requireActiveOrganization();

      return {
        allowedContentTypes: ["image/jpeg", "image/png", "image/webp"],
        addRandomSuffix: true,
        maximumSizeInBytes: 10_000_000,
        tokenPayload: JSON.stringify({ organizationId }),
      };
    },
    onUploadCompleted: async ({ blob, tokenPayload }) => {
      /* grava a linha no banco */
    },
    request,
  });

  return Response.json(jsonResponse);
}
```

## `onBeforeGenerateToken` — é a fronteira de autorização

Assinatura: `(pathname, clientPayload, multipart) => Promise<…>`.

**Sem checagem de sessão aqui, a rota é upload público para qualquer um.** Neste projeto:
`requireActiveOrganization()` antes de qualquer coisa, e o `organizationId` viaja no
`tokenPayload` para ser usado no `onUploadCompleted`. Nunca confie no `clientPayload` para
decidir escopo — ele vem do browser.

Campos retornáveis: `addRandomSuffix`, `allowedContentTypes`, `allowOverwrite`,
`cacheControlMaxAge`, `callbackUrl`, `ifMatch`, `maximumSizeInBytes`, `tokenPayload`,
`validUntil` (default: 1 hora).

## `onUploadCompleted` — webhook, não continuação

Quem chama é a Vercel, não o browser. A URL de callback é derivada de `VERCEL_BRANCH_URL`,
`VERCEL_URL` ou `VERCEL_PROJECT_PRODUCTION_URL`.

**Em `localhost` nunca dispara** — a Vercel não alcança sua máquina. Para testar o fluxo
completo local é preciso túnel (ngrok) + `VERCEL_BLOB_CALLBACK_URL` no `.env`.

A rota deve responder 200; erro faz o webhook repetir até 5 vezes. Como o callback pode
falhar ou repetir, a gravação no banco precisa ser **idempotente** — chave pelo `pathname`
do blob.
