---
name: better-auth
description: Referência do Better Auth v1.6 (autenticação) usada neste projeto. Use SEMPRE antes de escrever ou alterar qualquer coisa que toque autenticação — login, logout, cadastro, sessão, `getSession`, proteção de rota ou Server Action, papel/role, permissão, convite de membro, a organização como workspace de identidade, o handler `/api/auth`, o adapter Drizzle do auth ou o schema que a CLI gera. Gatilhos: `betterAuth`, `authClient`, `drizzleAdapter`, `toNextJsHandler`, `nextCookies`, plugin `organization`, `createAccessControl`, proteger recurso, checar papel, session no servidor.
---

# Better Auth — autenticação

Versões de referência: **`better-auth@1.6.25`**, CLI **`auth@1.6.25`** (invocada por
`npx auth@latest`). Documentação, registro npm e um spike de instalação real consultados em
2026-08-01.

Escolhido na **CAR-122** para as duas populações de `docs/domain.md` §8 — **membros** escopados
a um workspace (papel fixo em código, §8.1) e **adotantes** globais. O motivo: a identidade fica
no **nosso Neon via Drizzle** (fonte única, sem provedor externo a sincronizar) e o plugin
`organization` modela workspace, membros, papéis e convites sobre o mesmo banco.

Se algo aqui não cobrir sua dúvida, **não escreva de memória** — busque a página no
[mapa de documentação](#mapa-de-documentação) e leia antes. O adapter Drizzle vive **no core**,
em `better-auth/adapters/drizzle` (confirmado nos `exports` do pacote); existe um pacote separado
`@better-auth/drizzle-adapter`, mas ele declara um peer `drizzle-orm` rígido e **não é usado
aqui**. A CLI é o pacote **`auth`** (`npx auth@latest`); o antigo `@better-auth/cli` parou na
`1.4.21`.

---

## ⚠️ Conflito de versão com o Drizzle — medido em spike (CAR-122)

Um spike de instalação real (2026-08-01) mediu o conflito. **Não é bloqueio duro** — o adapter
roda no `drizzle-orm@1.0.0-rc.4` (v1 RC) deste projeto. Três atritos, todos pequenos:

1. **`npm i better-auth` cai em `ERESOLVE`.** O core `better-auth` declara os peers de banco como
   **opcionais** (`peerDependenciesMeta.optional`), mas o npm ainda valida a versão dos que estão
   presentes. O gatilho **não** é o `drizzle-orm@^0.45.2` (esse é opcional e silencioso) — é o
   **`drizzle-kit@>=0.31.4`**: o nosso `1.0.0-rc.4` é **pré-lançamento**, e o semver exclui
   pré-lançamentos de ranges que não os mencionam, então o npm acha que não satisfaz. **Saída:**
   `npm i better-auth --legacy-peer-deps`. Não persiste — um `npm ci` limpo reestoura o erro;
   para durar, `legacy-peer-deps=true` num `.npmrc` (relaxa peers no projeto todo) ou esperar o
   better-auth subir o range do drizzle v1.

2. **A CLI `generate` não carrega `server-only`.** A doc oficial manda manter fora do grafo de
   import da CLI o que não resolve fora do bundler — e `server-only` é alias interno do Next.
   **Resolvido** mantendo `auth/index.ts` e `db/index.ts` pelados (sem `server-only`); o tripwire
   vive em `server.ts` na raiz, que reexporta `db`/`auth` (ver §1 e skill `drizzle`). Assim a CLI
   lê o config real (`--config auth/index.ts`) sem tropeçar.

3. **O bloco `relations()` gerado sai na API v0.** As **tabelas** geradas são v1-compatíveis (o
   drizzle-kit v1 gera a migração sem erro), mas a CLI emite também `export const xRelations =
relations(...)`, e a v1 **não exporta mais** `relations` (só `defineRelations`) — isso estoura
   `relations is not a function` no `db:generate`. Tratamento na §5.

Nada disso bloqueia mais nada; é workflow, documentado na §5.

---

## 1. Instalação e layout de arquivos

```bash
npm i better-auth --legacy-peer-deps
```

O adapter está no core (`better-auth/adapters/drizzle`) — **não** instale
`@better-auth/drizzle-adapter`. O `--legacy-peer-deps` é pelo peer opcional `drizzle-kit` (ver
alerta acima); para durar num `npm ci`, ponha `legacy-peer-deps=true` no `.npmrc`. O segredo e o
schema entram junto — ver §2 e §5.

O alias `@/` aponta para a raiz. Espelhando o `db/` da skill `drizzle`, o auth mora em `auth/`
na raiz:

```
📦 <raiz>
 ├ 📂 app
 │  └ 📂 api
 │     └ 📂 auth
 │        └ 📂 [...all]
 │           └ 📜 route.ts     // handler HTTP (§4)
 ├ 📂 auth
 │  ├ 📜 index.ts              // instância server, PELADA (sem server-only)
 │  └ 📜 client.ts            // client de browser
 ├ 📂 db
 │  └ 📂 schema                // schema do auth entra aqui, reescrito (§5)
 ├ 📜 server.ts                // import "server-only" + reexporta auth e db (guard)
 └ 📜 .env.development.local   // BETTER_AUTH_SECRET, BETTER_AUTH_URL (nomes; ver §2)
```

- `auth/index.ts` — a instância `auth`, **sem `server-only`** (a CLI `generate` precisa
  carregá-la — §5). Import por `@/auth`. O tripwire fica no `server.ts` da raiz, que reexporta
  `auth` e `db` sob `server-only`; código server-side consome por `@/server` (ver skill `drizzle`).
- `auth/client.ts` — o `authClient` de browser (`better-auth/react`). Sem segredo. Import por
  `@/auth/client`.
- `app/api/auth/[...all]/route.ts` — nome fixo do Next (a skill `nextjs` isenta arquivos de
  convenção da regra `nome/index.tsx`).

`auth/` não é camada de domínio: as 17 regras de `docs/domain.md` continuam em módulo puro. O
auth só resolve identidade e sessão.

---

## 2. Segredo e variáveis de ambiente

Nomes exigidos (o valor **já é gerenciado fora do repo** — nunca leia nem commite valor):

- `BETTER_AUTH_SECRET` — chave de criptografia/hash, ≥ 32 caracteres, alta entropia. Gere com
  `npx auth@latest secret` ou `openssl rand -base64 32`. Rotação usa a forma plural
  `BETTER_AUTH_SECRETS`.
- `BETTER_AUTH_URL` — URL base da aplicação.

Vão em `.env*.local` (fora do versionamento). Segredo em diff **para a revisão na hora** — a
skill `commit` recusa commit com segredo.

---

## 3. Instância no servidor

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
- `emailAndPassword: { enabled: true }` liga login por e-mail/senha (o caminho do membro).
  `requireEmailVerification: true` exige verificação antes do primeiro login.
- Mapear os nomes das tabelas geradas para o nosso schema é via a opção `schema` do adapter
  (`drizzleAdapter(db, { provider: "pg", schema })`) — ver §5.

Estender o `user` com campo próprio é `user.additionalFields`, **não** uma coluna solta:

```ts
user: {
  additionalFields: {
    role: { defaultValue: "member", input: false, type: "string" },
  },
}
```

---

## 4. Integração com o Next (App Router)

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

O plugin `nextCookies` faz o `Set-Cookie` funcionar em Server Action e **precisa ser o último**
do array:

```ts
import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";

export const auth = betterAuth({
  plugins: [nextCookies()],
});
```

### Conciliação com Cache Components (skill `nextjs`)

`getSession` chama `await headers()` — uma **API dinâmica**. Logo, todo componente que lê a
sessão é um **buraco dinâmico** no modelo PPR (`cacheComponents: true`): precisa ficar sob um
`<Suspense>` e **nunca** entra em `'use cache'`. Página autenticada já é dinâmica por isso — é o
mesmo motivo que a skill `nextjs` dá para `cookies`/`headers`. Sessão em cache seria sessão de
outro usuário.

### Segurança (skill `nextjs` §5)

Server Action é endpoint `POST` público. Autentique **e** autorize dentro de cada função —
`getSession` para saber quem é, e a checagem de papel/organização para saber se pode. Nunca
confie em botão escondido. Toda leitura ainda filtra por `organizationId` (regra 1).

---

## 5. Schema: gerar e migrar

`npx auth@latest migrate` **só funciona com o adapter Kysely embutido**. Com Drizzle, o fluxo é
**gerar o schema pela CLI e migrar pelo Drizzle Kit**:

```bash
npx auth@latest generate --config auth/index.ts --output ./db/schema/auth.ts --yes
npm run db:generate
npm run db:migrate
```

- `generate` lê `auth/index.ts` e escreve as tabelas do Better Auth num arquivo. Aponte
  `--output` para `db/schema/` para que elas fluam pelo nosso `db:generate` / `db:migrate`
  (skill `drizzle` §8). Flags: `--config`, `--output`, `--yes`.
- **Reescreva o arquivo gerado nas convenções.** A CLI cospe as 7 tabelas num arquivo só, com
  nomes de coluna explícitos, `timestamp` sem timezone e um bloco `relations()` v0. **Política do
  projeto:** reescrever à mão para Drizzle v1 (`snakeCase.table`, colunas alfabéticas,
  `withTimezone: true`, tipos `$inferSelect`/`$inferInsert`) — mantendo intactos os **nomes das
  tabelas** e as **chaves das colunas** (é por elas que o adapter mapeia). As 7 tabelas ficam
  juntas em `db/schema/auth.ts` (conjunto coeso da lib). Reexecutar `generate` sobrescreve o
  arquivo — reaplique a reescrita.
- **A CLI carrega `auth/index.ts` direto** porque ele e o `@/db` são pelados (sem `server-only` —
  §1 e skill `drizzle`). A CLI resolve os aliases `@/` do `tsconfig` e não precisa de banco
  conectado (o `generate` só lê a config).
- **O bloco `relations()` gerado não entra.** A CLI emite `export const xRelations =
relations(...)` na API v0, que a v1 não exporta — quebraria o `db:generate`. Na reescrita, as
  relações do auth vão para `db/relations.ts` via `defineRelations` (o jeito v1), não para o
  arquivo de schema.
- **IDs são `text`** (default do Better Auth), não `uuid`. Toda FK do domínio que apontar para
  `organization`/`user` será `text`.

### Tabelas base (antes de qualquer plugin)

| Tabela         | Campos-chave                                                                 |
| -------------- | ---------------------------------------------------------------------------- |
| `user`         | `id`, `name`, `email`, `emailVerified`, `image?`, `createdAt`, `updatedAt`   |
| `session`      | `id`, `userId`, `token`, `expiresAt`, `ipAddress?`, `userAgent?`, timestamps |
| `account`      | `id`, `userId`, `accountId`, `providerId`, `password?`, tokens OAuth, ...    |
| `verification` | `id`, `identifier`, `value`, `expiresAt`, `createdAt`, `updatedAt`           |

O `user` é a identidade **global** — atende o adotante de `docs/domain.md` §8 direto. O membro é
o `user` mais um vínculo com organização (plugin abaixo). Uma pessoa ser membro e adotante ao
mesmo tempo (regra da §8) sai de graça: é um `user` só, com ou sem `member`.

---

## 6. Plugin `organization` — o workspace

Modela a organização como workspace com membros, papéis e convites — o que CAR-123 (`organizations`)
e CAR-126 (`members`) precisam.

```ts
import { betterAuth } from "better-auth";
import { organization } from "better-auth/plugins";

export const auth = betterAuth({
  plugins: [organization()],
});
```

```ts
import { createAuthClient } from "better-auth/client";
import { organizationClient } from "better-auth/client/plugins";

export const authClient = createAuthClient({
  plugins: [organizationClient()],
});
```

Tabelas adicionadas: `organization`, `member`, `invitation` (e, opcionais, `organizationRole`,
`team`, `teamMember`). Métodos: `createOrganization`, `inviteMember`, `acceptInvitation`,
`listMembers`, `removeMember`, `updateMemberRole`, `setActiveOrganization`, `listOrganizations`.

### Papéis: fixos no código, não no banco (§8.1)

O plugin traz três papéis default — `owner`, `admin`, `member` — e **dois modos** de papel:

- **Access control estático**, definido em código com `createAccessControl`.
- **Dinâmico**, gravado na tabela `organizationRole` e editável em runtime.

`docs/domain.md` §8.1 é explícito: **papéis são fixos, definidos no código**; a organização não
configura permissões. Logo, use o **modo estático** e **não** habilite `organizationRole`. A
matriz da §8.1 (Admin governa o workspace; Voluntário opera) vira um `statement` + papéis:

```ts
import { createAccessControl } from "better-auth/plugins/access";

const statement = {
  animal: ["create", "update", "publish", "close", "archive"],
  case: ["open", "advance", "close", "cancel"],
  member: ["create", "update", "delete"],
  organization: ["update"],
} as const;

const ac = createAccessControl(statement);
```

Definir os dois papéis concretos, casá-los com `owner`/`admin`/`member` do plugin e ancorar a
trava anti-lockout (criador nasce Admin, sempre ≥ 1 Admin) é a **CAR-125** ("definir os papéis
fixos em módulo de domínio"). O `owner` do plugin — criador, protegido de remoção — é o encaixe
natural da trava. **Não** modele isso aqui; a §8.1 é a fonte, e o `domain-reviewer` confere.

---

## 7. Uso no cliente

```ts
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient();
```

```ts
await authClient.signUp.email({ email, name, password });
await authClient.signIn.email({ email, password });
await authClient.signOut();
```

`baseURL` é opcional quando o client e o servidor são a mesma origem (o caso do app único).

---

## 8. Conciliação com `write-code`

- **Chaves de objeto de config em ordem alfabética** — `database` antes de `emailAndPassword`
  antes de `plugins`; dentro de `additionalFields`, `defaultValue` antes de `input` antes de
  `type`.
- **`plugins` é a exceção.** A ordem é semântica: `nextCookies()` **por último** (§4). Isso é
  quebra consciente da ordem alfabética e **exige o comentário de justificativa** que a
  `write-code` permite.
- **Nada de `server-only`** em `auth/index.ts` nem `db/index.ts` (a CLI precisa carregá-los). O
  guard fica no `server.ts` da raiz, que reexporta `auth`/`db`; consumidores server-side importam
  de `@/server`.
- Imports por alias `@/`. Nada de relativo dentro de `auth/`.
- Zero `any`: o retorno de `getSession` já é tipado; estreite `session?.user` em vez de forçar
  tipo.
- Arquivos e pastas em `kebab-case`. `auth/` e `auth/client.ts` não são componentes React — a
  regra `nome/index.tsx` não se aplica.

---

## 9. Armadilhas

- Instalar o pacote separado `@better-auth/drizzle-adapter` — peer `drizzle-orm` rígido e
  desnecessário; o adapter está no core (`better-auth/adapters/drizzle`).
- Instalar `better-auth` sem `--legacy-peer-deps` — `ERESOLVE` pelo peer opcional `drizzle-kit`
  (pré-lançamento; ver topo).
- Reintroduzir `server-only` em `auth/index.ts` ou `db/index.ts` — quebra a CLI `generate`
  (`Cannot find module 'server-only'`); o guard vai em `server.ts` (`@/server`).
- Deixar o bloco `relations()` gerado no arquivo — quebra o `db:generate` na v1 (ver §5).
- Usar `@better-auth/cli` (parou na `1.4.21`) em vez do pacote `auth` (`npx auth@latest`).
- Rodar `npx auth@latest migrate` com Drizzle — só serve ao Kysely embutido; use `db:migrate`.
- `nextCookies()` fora da última posição do array `plugins` — cookie de sessão não é setado em
  Server Action.
- Ler a sessão fora de `<Suspense>` com `cacheComponents: true` — quebra o build, ou pior,
  cacheia sessão. `getSession` é dinâmico por causa de `await headers()`.
- Consumir `@/auth` ou `@/db` direto num caminho que chega a Client Component — pula o guard;
  server-side importa de `@/server`.
- Habilitar papéis dinâmicos (`organizationRole`) — contradiz §8.1 (papéis fixos no código).
- Quebrar à mão o arquivo de schema gerado — o próximo `generate` desfaz.
- `await` esquecido em `headers()` (Promise no Next 16, ver skill `nextjs`).

---

## Mapa de documentação

Quando este arquivo não cobrir, busque a URL antes de escrever. Prefixo:
`https://www.better-auth.com/docs`.

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

---

## Pare e pergunte

- **Persistir `legacy-peer-deps`** (`.npmrc`) — relaxa peers no projeto todo; decida com o dono,
  não de memória (ver topo).
- A tarefa pede um provedor social, 2FA, magic link ou passkey — plugin não coberto aqui; leia a
  página antes.
- **Decidido (CAR-123):** o Better Auth é **dono** das tabelas `organization`/`member` — geradas
  pelo plugin, não modeladas à mão. Campos da ONG (ex.: `location`) entram como `additionalField`.
- A solução pediria papel dinâmico em banco, `any` ou `@ts-ignore`.
- A regra de papéis contradiz `docs/domain.md` §8.1 — aponte a contradição, não invente.
