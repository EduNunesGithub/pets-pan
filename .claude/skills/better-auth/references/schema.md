# Better Auth — schema, plugin organization e papéis

## Schema: gerar e migrar

`npx auth@latest migrate` **só funciona com o adapter Kysely embutido**. Com Drizzle, o fluxo
é **gerar o schema pela CLI e migrar pelo Drizzle Kit**:

```bash
npx auth@latest generate --config auth/index.ts --output ./db/schema/auth.ts --yes
npm run db:generate
npm run db:migrate
```

- `generate` lê `auth/index.ts` e escreve as tabelas num arquivo. Aponte `--output` para
  `db/schema/` para que elas fluam pelo nosso `db:generate`/`db:migrate`.
- **Reescreva o arquivo gerado nas convenções.** A CLI cospe as 7 tabelas num arquivo só, com
  nomes de coluna explícitos, `timestamp` sem timezone e um bloco `relations()` v0.
  **Política do projeto:** reescrever à mão para Drizzle v1 (`snakeCase.table`, colunas
  alfabéticas, `withTimezone: true`, tipos `$inferSelect`/`$inferInsert`) — mantendo intactos
  os **nomes das tabelas** e as **chaves das colunas** (é por elas que o adapter mapeia). As
  7 tabelas ficam juntas em `db/schema/auth.ts`. Reexecutar `generate` sobrescreve —
  reaplique a reescrita.
- **A CLI carrega `auth/index.ts` direto** porque ele e o `@/db` são pelados (sem
  `server-only`). Ela resolve os aliases `@/` do `tsconfig` e não precisa de banco conectado.
- **O bloco `relations()` gerado não entra.** Na reescrita, as relações do auth vão para
  `db/relations.ts` via `defineRelations` (o jeito v1), não para o arquivo de schema.
- **IDs são `text`** (default do Better Auth), não `uuid`. Toda FK do domínio que apontar
  para `organization`/`user` será `text`.

## Tabelas base (antes de qualquer plugin)

| Tabela         | Campos-chave                                                                 |
| -------------- | ---------------------------------------------------------------------------- |
| `user`         | `id`, `name`, `email`, `emailVerified`, `image?`, `createdAt`, `updatedAt`   |
| `session`      | `id`, `userId`, `token`, `expiresAt`, `ipAddress?`, `userAgent?`, timestamps |
| `account`      | `id`, `userId`, `accountId`, `providerId`, `password?`, tokens OAuth, ...    |
| `verification` | `id`, `identifier`, `value`, `expiresAt`, `createdAt`, `updatedAt`           |

O `user` é a identidade **global** — atende o adotante de `docs/domain.md` §8 direto. O
membro é o `user` mais um vínculo com organização (plugin abaixo). Uma pessoa ser membro e
adotante ao mesmo tempo (regra da §8) sai de graça: é um `user` só, com ou sem `member`.

## Plugin `organization` — o workspace

Modela a organização como workspace com membros, papéis e convites (CAR-123, CAR-126).

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

Tabelas adicionadas: `organization`, `member`, `invitation` (e, opcionais,
`organizationRole`, `team`, `teamMember`). Métodos: `createOrganization`, `inviteMember`,
`acceptInvitation`, `listMembers`, `removeMember`, `updateMemberRole`,
`setActiveOrganization`, `listOrganizations`.

`createOrganization` **já seta a org criada como ativa na sessão** (`activeOrganizationId`),
a menos que se passe `keepCurrentActiveOrganization: true` — não chame
`setActiveOrganization` depois de criar, é redundante. O client é
`authClient.organization.setActive({ organizationId })` (devolve `{ data, error }`); a
leitura das orgs do usuário é `auth.api.listOrganizations({ headers })`.

## Papéis: fixos no código, não no banco (§8.1)

O plugin traz três papéis default — `owner`, `admin`, `member` — e **dois modos** de papel:

- **Access control estático**, definido em código com `createAccessControl`.
- **Dinâmico**, gravado na tabela `organizationRole` e editável em runtime.

`docs/domain.md` §8.1 é explícito: **papéis são fixos, definidos no código**. Use o **modo
estático** e **não** habilite `organizationRole`. A matriz da §8.1 vira um `statement` +
papéis:

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

Definir os papéis concretos, casá-los com `owner`/`admin`/`member` e ancorar a trava
anti-lockout (criador nasce Admin, sempre ≥ 1 Admin) é a **CAR-125**. O `owner` do plugin —
criador, protegido de remoção — é o encaixe natural da trava. A §8.1 é a fonte, e o
`domain-reviewer` confere.
