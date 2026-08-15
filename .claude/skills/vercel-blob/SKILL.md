---
name: vercel-blob
description: Vercel Blob — armazenamento de arquivos. Use antes de escrever ou alterar qualquer coisa que suba, remova, liste ou sirva arquivo — foto de animal, upload de formulário, rota de upload, URL de imagem persistida. NÃO é necessária para mudança que só exibe uma URL já gravada. Gatilhos: `put`, `del`, `head`, `list`, `copy`, `putImage`, `handleUpload`, upload, foto, imagem, anexo, `BLOB_READ_WRITE_TOKEN`, `BLOB_STORE_ID`.
---

# Vercel Blob — armazenamento de arquivos

Versão de referência: **`@vercel/blob@2.8.0`**. Documentação consultada em 2026-08-12.
Import server-side: `import { put, del, head, list } from "@vercel/blob"`.
Import client-side: `import { upload } from "@vercel/blob/client"`.

## Referências desta skill

| Preciso de                                                           | Leia                          |
| -------------------------------------------------------------------- | ----------------------------- |
| Assinatura e opções de `put`/`del`/`head`/`list`/`copy`/`putImage`   | `references/api.md`           |
| Upload direto do browser (`upload` + `handleUpload`), token, webhook | `references/client-upload.md` |

Se nada disso cobrir, **não escreva de memória** — leia
`node_modules/@vercel/blob/dist/index.d.ts`, que é a fonte mais confiável que temos.

## Autenticação — OIDC é o padrão, não o token estático

Quase todo exemplo na internet manda definir `BLOB_READ_WRITE_TOKEN`. **Não é mais o
caminho padrão.** O SDK resolve credencial nesta ordem:

1. `options.token` explícito — vence tudo.
2. **OIDC**: `VERCEL_OIDC_TOKEN` + `BLOB_STORE_ID` (ambos no `.env.development.local` deste
   projeto). Curto prazo, rotacionado pela Vercel. É o que usamos.
3. `BLOB_READ_WRITE_TOKEN` — token longo estático, fallback para código fora da Vercel.

Consequência prática: **operação server-side neste projeto não precisa de token nenhum no
código.** Chame `put(...)` sem `token` e o OIDC resolve.

A exceção é `handleUpload` (upload pelo browser): ele **exige** o
`BLOB_READ_WRITE_TOKEN` para emitir o token de cliente. Se formos por client upload, essa
variável precisa existir.

## Doutrina do projeto

- **Upload server-side por Server Action** enquanto o arquivo couber em **4,5 MB** — que é o
  teto de corpo de request documentado para este caminho. Acima disso, é client upload
  obrigatoriamente. Valide o tamanho na fronteira com Zod antes de tocar o Blob.
- **Processar antes de subir.** Nada vai cru para o Blob: passa por `sharp` (webp q75,
  dimensão fixa) — veja a skill `sharp`. O que o usuário mandou nunca é o que se armazena.
- **`access: 'public'` para foto de animal.** É obrigatório e não tem default. `'private'`
  exige autenticação para ler, o que quebra `<img src>` e o catálogo público (regra 10).
  Só use `'private'` para documento que não pode vazar.
- **`pathname` escopado por organização**: `animals/<organizationId>/<animalId>/<variante>.webp`.
  Escopo no caminho é o que torna listagem e limpeza por ONG possíveis. Nunca use o nome de
  arquivo que veio do usuário — é entrada não confiável.
- **`addRandomSuffix: true`** em upload de usuário. O default é `false`, e sem sufixo dois
  uploads com o mesmo nome colidem — e colisão sem `allowOverwrite` **lança erro**.
- **Blob não é o registro.** O banco é. Toda foto tem linha em tabela com `url` e
  `pathname`; o Blob é só onde os bytes moram. Sem isso não há como remover órfão.

## Armadilhas

| Armadilha                                          | O que acontece                                                               |
| -------------------------------------------------- | ---------------------------------------------------------------------------- |
| Esquecer `access`                                  | Erro de tipo — é obrigatório, não tem default                                |
| Reusar `pathname` sem `allowOverwrite`             | Lança erro; o default de `allowOverwrite` é `false`                          |
| Assumir `addRandomSuffix: true`                    | O default é **`false`** (era `true` em versões antigas do SDK)               |
| Apagar linha no banco e não chamar `del`           | Blob órfão pagando armazenamento para sempre                                 |
| Chamar `del` e falhar o commit no banco            | Linha aponta para URL morta — apague o Blob **depois** que o banco confirmar |
| `copy`/`rename` preservando metadados              | **Não preservam** `cacheControlMaxAge` nem afins; redefina nas opções        |
| `cacheControlMaxAge` abaixo de 60                  | Mínimo é 1 minuto; default é 1 mês (`30 * 24 * 60 * 60`)                     |
| Servir foto e trocar o arquivo no mesmo `pathname` | O cache de 1 mês segura a versão velha — troque o `pathname`, não o conteúdo |
| `onUploadCompleted` em `localhost`                 | Nunca dispara: a Vercel não alcança seu localhost. Precisa de túnel (ngrok)  |

## `putImage` — a alternativa ao sharp que existe no SDK

O SDK tem `putImage(pathname, body, { optimizeImage: { width, quality, format } })`, que
manda a imagem pela Vercel Image Optimization e guarda só o resultado. Exige OIDC (temos) e
é cobrado como **uma transformação de imagem + um put**.

**Este projeto usa `sharp`, não `putImage`** — decisão do usuário, e ela se sustenta:
`optimizeImage` aceita só `width` (uma variante por chamada, então duas variantes = duas
transformações cobradas), e o processamento no `sharp` roda como CPU da própria função, sem
linha de cobrança separada. Registre aqui se a decisão mudar.

## Checklist

- [ ] `access` explícito; `'public'` só onde a leitura pode ser anônima
- [ ] `pathname` derivado de IDs do sistema, com escopo de organização — nunca do nome do arquivo enviado
- [ ] `addRandomSuffix: true` em upload de usuário
- [ ] Tamanho e content-type validados na fronteira antes do `put`
- [ ] Imagem processada por `sharp` antes de subir
- [ ] Linha no banco com `url` **e** `pathname`; `del` no fluxo de remoção
