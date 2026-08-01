---
name: better-auth
description: Referência do Better Auth v1.6 (autenticação) usada neste projeto. Use SEMPRE antes de escrever ou alterar qualquer coisa que toque autenticação — login, logout, cadastro, sessão, `getSession`, proteção de rota ou Server Action, papel/role, permissão, convite de membro, a organização como workspace de identidade, o handler `/api/auth`, o adapter Drizzle do auth ou o schema que a CLI gera. Gatilhos: `betterAuth`, `authClient`, `drizzleAdapter`, `toNextJsHandler`, `nextCookies`, plugin `organization`, `createAccessControl`, proteger recurso, checar papel, session no servidor.
---

# Better Auth — autenticação

Versões de referência: **`better-auth@1.6.25`**, **`@better-auth/drizzle-adapter@1.6.25`**,
CLI **`auth@1.6.25`** (invocada por `npx auth@latest`). Documentação e registro npm consultados
em 2026-08-01.

Escolhido na **CAR-122** para as duas populações de `docs/domain.md` §8 — **membros** escopados
a um workspace (papel fixo em código, §8.1) e **adotantes** globais. O motivo: a identidade fica
no **nosso Neon via Drizzle** (fonte única, sem provedor externo a sincronizar) e o plugin
`organization` modela workspace, membros, papéis e convites sobre o mesmo banco.

Se algo aqui não cobrir sua dúvida, **não escreva de memória** — busque a página no
[mapa de documentação](#mapa-de-documentação) e leia antes. A API do Better Auth mudou de casa
entre versões: o adapter Drizzle virou **pacote separado** e a CLI virou o pacote **`auth`**.
Exemplo de tutorial antigo erra o import.

---

## ⚠️ Conflito de versão com o Drizzle deste projeto

`@better-auth/drizzle-adapter@1.6.25` declara **peer `drizzle-orm@^0.45.2`** (linha v0). Este
projeto roda **`drizzle-orm@1.0.0-rc.4`** (v1 RC — ver skill `drizzle`). `^0.45.2` significa
`>=0.45.2 <0.46.0` e **não** satisfaz `1.0.0-rc.4`. Consequências:

- `npm install @better-auth/drizzle-adapter` cai em `ERESOLVE`.
- O schema que `npx auth@latest generate` produz sai em **sintaxe Drizzle v0** (API de relações
  e casing antigos), que a skill `drizzle` proíbe.

Isto **não** bloqueia a CAR-122 (decisão + skill, sem instalar nada). É o primeiro obstáculo de
**CAR-126** (modelar `members`) e do login. Antes de instalar, **pare e pergunte**. Saídas
possíveis, a decidir com o dono do projeto:

1. Usar o **adapter Kysely** embutido do Better Auth contra o mesmo Postgres do Neon — não
   depende de `drizzle-orm`, mas passa a existir um segundo caminho de acesso ao banco além do
   `db/`.
2. Fixar `@better-auth/drizzle-adapter` numa versão que aceite a linha v1, se existir.
3. Aceitar `--legacy-peer-deps` **somente** se o adapter provar rodar em runtime na v1, com
   teste — e reescrever o schema gerado nas convenções v1.

Não resolva de memória qual caminho seguir.

---

## 1. Instalação e layout de arquivos

**Não instale nada na CAR-122.** Quando o login for implementado (CAR-126 em diante), e depois
de resolver o conflito acima:

```bash
npm i better-auth
```

O adapter, o segredo e o schema entram junto — ver §5 e o alerta acima.

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
 │  ├ 📜 index.ts              // instância server (server-only)
 │  └ 📜 client.ts            // client de browser
 ├ 📂 db
 │  └ 📂 schema                // tabelas geradas do auth entram aqui (§5)
 └ 📜 .env.development.local   // BETTER_AUTH_SECRET, BETTER_AUTH_URL (nomes; ver §2)
```

- `auth/index.ts` — a instância `auth`. Segura segredo e o `db`, então **`import "server-only"`
  na primeira linha**, como em `db/index.ts`. Import por `@/auth`.
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
import "server-only";

import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { betterAuth } from "better-auth";

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
npx auth@latest generate --output ./db/schema/auth.ts
npm run db:generate
npm run db:migrate
```

- `generate` lê `auth/index.ts` e escreve as tabelas do Better Auth num arquivo. Aponte
  `--output` para `db/schema/` para que elas fluam pelo nosso `db:generate` / `db:migrate`
  (skill `drizzle` §8). Flags: `--config`, `--output`, `--yes`.
- **Um arquivo, várias tabelas.** Isso conflita com a regra "uma tabela por arquivo" da skill
  `drizzle`. Como é **arquivo gerado** (reescrito a cada mudança de config, como as migrações),
  trate-o como exceção gerada — não o quebre à mão em vários arquivos, ou o próximo `generate`
  desfaz o trabalho. Exporte tudo (o `drizzle-kit` só vê o que é exportado).
- Lembre do conflito de versão: o schema gerado sai em sintaxe v0. Reconciliá-lo com a v1
  (`snakeCase`, `defineRelations`) é parte de resolver o alerta do topo.

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
- `auth/index.ts` leva `import "server-only"` no topo, como `db/index.ts`.
- Imports por alias `@/`. Nada de relativo dentro de `auth/`.
- Zero `any`: o retorno de `getSession` já é tipado; estreite `session?.user` em vez de forçar
  tipo.
- Arquivos e pastas em `kebab-case`. `auth/` e `auth/client.ts` não são componentes React — a
  regra `nome/index.tsx` não se aplica.

---

## 9. Armadilhas

- Instalar `@better-auth/drizzle-adapter` sem resolver o peer `drizzle-orm@^0.45.2` — `ERESOLVE`
  contra a v1 RC do projeto (ver topo).
- Importar o adapter de `better-auth/adapters/drizzle` — esse era o caminho v0; na v1.6 é o
  pacote `@better-auth/drizzle-adapter`.
- Usar `@better-auth/cli` (parou na `1.4.21`) em vez do pacote `auth` (`npx auth@latest`).
- Rodar `npx auth@latest migrate` com Drizzle — só serve ao Kysely embutido; use `db:migrate`.
- `nextCookies()` fora da última posição do array `plugins` — cookie de sessão não é setado em
  Server Action.
- Ler a sessão fora de `<Suspense>` com `cacheComponents: true` — quebra o build, ou pior,
  cacheia sessão. `getSession` é dinâmico por causa de `await headers()`.
- Esquecer `import "server-only"` em `auth/index.ts` — arrasta o segredo para o bundle.
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

- **Instalar o adapter Drizzle** sem antes decidir o caminho do conflito `drizzle-orm@^0.45.2`
  × `1.0.0-rc.4` (ver topo). Este é o bloqueio real de CAR-126/login.
- A tarefa pede um provedor social, 2FA, magic link ou passkey — plugin não coberto aqui; leia a
  página antes.
- A modelagem de `organization`/`member` que o plugin gera **conflita** com o que CAR-123/126
  querem modelar à mão. Quem é dono da definição da tabela é decisão dessas issues, não de
  memória.
- A solução pediria papel dinâmico em banco, `any`, `@ts-ignore` ou `--legacy-peer-deps` sem
  teste que prove o adapter na v1.
- A regra de papéis contradiz `docs/domain.md` §8.1 — aponte a contradição, não invente.
