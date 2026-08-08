# Better Auth — instalação, instância e integração Next

## Conflito de versão com o Drizzle — medido em spike (CAR-122)

Um spike de instalação real (2026-08-01) mediu o conflito. **Não é bloqueio duro** — o adapter
roda no `drizzle-orm@1.0.0-rc.4` (v1 RC) deste projeto. Três atritos, todos pequenos:

1. **`npm i better-auth` cai em `ERESOLVE`.** O core declara os peers de banco como
   **opcionais** (`peerDependenciesMeta.optional`), mas o npm ainda valida a versão dos
   presentes. O gatilho não é o `drizzle-orm@^0.45.2` — é o **`drizzle-kit@>=0.31.4`**: o
   nosso `1.0.0-rc.4` é pré-lançamento, e o semver exclui pré-lançamentos de ranges que não
   os mencionam. **Saída:** `npm i better-auth --legacy-peer-deps`. Não persiste — um
   `npm ci` limpo reestoura; para durar, `legacy-peer-deps=true` num `.npmrc` (relaxa peers
   no projeto todo — decisão do dono) ou esperar o range subir.

2. **A CLI `generate` não carrega `server-only`.** Resolvido mantendo `auth/index.ts` e
   `db/index.ts` pelados; o tripwire vive em `server.ts` na raiz (ver skill `drizzle`).

3. **O bloco `relations()` gerado sai na API v0.** As tabelas geradas são v1-compatíveis,
   mas a CLI emite `export const xRelations = relations(...)`, e a v1 só exporta
   `defineRelations` — estoura `relations is not a function` no `db:generate`. Tratamento em
   `references/schema.md`.

## Instalação e layout

```bash
npm i better-auth --legacy-peer-deps
```

O adapter está no core (`better-auth/adapters/drizzle`) — **não** instale
`@better-auth/drizzle-adapter` (peer `drizzle-orm` rígido). A CLI é o pacote **`auth`**
(`npx auth@latest`); o antigo `@better-auth/cli` parou na `1.4.21`.

```
📦 <raiz>
 ├ 📂 app/api/auth/[...all]/route.ts   // handler HTTP
 ├ 📂 auth
 │  ├ 📜 index.ts              // instância server, PELADA (sem server-only)
 │  └ 📜 client.ts             // client de browser
 ├ 📂 db/schema                // schema do auth entra aqui, reescrito
 ├ 📜 server.ts                // import "server-only" + reexporta auth e db (guard)
 └ 📜 .env.development.local   // BETTER_AUTH_SECRET, BETTER_AUTH_URL
```

`auth/` não é camada de domínio: as 18 regras de `docs/domain.md` continuam em módulo puro.
O auth só resolve identidade e sessão.

## Segredo e variáveis de ambiente

Nomes exigidos (o valor **já é gerenciado fora do repo** — nunca leia nem commite valor):

- `BETTER_AUTH_SECRET` — ≥ 32 caracteres, alta entropia. Gere com `npx auth@latest secret`
  ou `openssl rand -base64 32`. Rotação usa a forma plural `BETTER_AUTH_SECRETS`.
- `BETTER_AUTH_URL` — URL base da aplicação.

Vão em `.env*.local` (fora do versionamento). Segredo em diff **para a revisão na hora**.

## Instância no servidor

```ts
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";

import { db } from "@/db";

export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: "pg" }),
  emailAndPassword: { enabled: true },
});
```

- `provider: "pg"` para Postgres.
- `emailAndPassword: { enabled: true }` liga login por e-mail/senha.
  `requireEmailVerification: true` exige verificação antes do primeiro login.
- Mapear nomes de tabela para o nosso schema é via a opção `schema` do adapter.

Estender o `user` com campo próprio é `user.additionalFields`, **não** coluna solta:

```ts
user: {
  additionalFields: {
    role: { defaultValue: "member", input: false, type: "string" },
  },
}
```

## Integração com o Next (App Router)

Handler HTTP — pega toda a rota `/api/auth/*`:

```ts
import { toNextJsHandler } from "better-auth/next-js";

import { auth } from "@/auth";

export const { GET, POST } = toNextJsHandler(auth);
```

Ler a sessão no servidor (Server Component, Server Action, route handler):

```ts
import { headers } from "next/headers";

import { auth } from "@/auth";

const session = await auth.api.getSession({ headers: await headers() });
```

O plugin `nextCookies` faz o `Set-Cookie` funcionar em Server Action e **precisa ser o
último** do array `plugins` (quebra de ordem justificada com `order:`):

```ts
import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";

export const auth = betterAuth({
  plugins: [nextCookies()],
});
```

## Uso no cliente

```ts
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient();
```

```ts
await authClient.signUp.email({ email, name, password });
await authClient.signIn.email({ email, password });
await authClient.signOut();
```

`baseURL` é opcional quando client e servidor são a mesma origem (o caso do app único).

## Mapa da documentação oficial

Prefixo: `https://www.better-auth.com/docs`.

| Assunto                    | Caminho                          |
| -------------------------- | -------------------------------- |
| Access control / papéis    | `/plugins/organization`          |
| Adapter Drizzle            | `/adapters/drizzle`              |
| CLI (`generate`/`migrate`) | `/concepts/cli`                  |
| E-mail e senha             | `/authentication/email-password` |
| Instalação e setup         | `/installation`                  |
| Integração Next.js         | `/integrations/next`             |
| Plugin `organization`      | `/plugins/organization`          |
| Provedores sociais (OAuth) | `/authentication/<provedor>`     |
| Schema e tabelas base      | `/concepts/database`             |
| Sessão                     | `/concepts/session-management`   |
