# Drizzle — conexão, config e migrações

Versões de referência: `drizzle-orm@1.0.0-rc.4`, `drizzle-kit@1.0.0-rc.4`,
`@neondatabase/serverless@1.1.0`.

## Instalação

```bash
npm i drizzle-orm@rc @neondatabase/serverless ws bufferutil
npm i -D drizzle-kit@rc
```

`ws` e `bufferutil` existem porque o driver escolhido é o de **WebSockets** e o Node não tem
`WebSocket` global.

## Conexão

O projeto usa **`neon-serverless`** (WebSockets), não `neon-http`.

| Driver               | Import                        | Transação interativa |
| -------------------- | ----------------------------- | -------------------- |
| `neon-http`          | `drizzle-orm/neon-http`       | **não**              |
| `neon-serverless`    | `drizzle-orm/neon-serverless` | sim                  |
| `node-postgres` / pg | `drizzle-orm/node-postgres`   | sim                  |

A escolha é do motor de pipeline: avançar etapa grava em várias tabelas de uma vez
(regra 15), e isso exige `db.transaction`. `neon-http` é mais rápido para query única em
serverless, mas **não suporta transação interativa** — não use.

```ts
import { neonConfig, Pool } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";

import { relations } from "@/db/relations";

neonConfig.webSocketConstructor = ws;

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export const db = drizzle({ client: pool, relations });
```

A forma curta `drizzle(process.env.DATABASE_URL!)` também existe e cria o pool internamente,
mas aqui o `Pool` é explícito porque o `neonConfig.webSocketConstructor` precisa ser atribuído
antes de qualquer conexão.

### Em `next dev`

O módulo é reavaliado a cada HMR, e cada reavaliação abre um `Pool` novo. Em desenvolvimento,
guarde a instância no `globalThis`:

```ts
const globalForDb = globalThis as unknown as { pool?: Pool };

const pool =
  globalForDb.pool ?? new Pool({ connectionString: process.env.DATABASE_URL });

if (process.env.NODE_ENV !== "production") {
  globalForDb.pool = pool;
}
```

## `drizzle.config.ts`

O projeto guarda a URL em `.env.development.local`, e `dotenv/config` só lê `.env`. Use o
carregador do próprio Next, que respeita a ordem de precedência
(`.env.$(NODE_ENV).local` → `.env.local` → `.env.$(NODE_ENV)` → `.env`):

```bash
npm i -D @next/env
```

A assinatura é `loadEnvConfig(dir, dev?, log?, forceReload?)`, e **`dev` tem default `false`**.
Com `false` ele carrega a lista de produção (`.env.production.local` → `.env.local` →
`.env.production` → `.env`) e **ignora o `.env.development.local`** — a `DATABASE_URL` chega
como `undefined` e o `drizzle-kit` falha com `[x] url: undefined`. Passe o segundo argumento:

```ts
import { loadEnvConfig } from "@next/env";
import { defineConfig } from "drizzle-kit";

loadEnvConfig(process.cwd(), process.env.NODE_ENV !== "production");

export default defineConfig({
  dbCredentials: { url: process.env.DATABASE_URL! },
  dialect: "postgresql",
  out: "./drizzle",
  schema: "./db/schema",
});
```

Outras opções: `migrations` (default
`{ schema: "drizzle", table: "__drizzle_migrations" }`), `tablesFilter`, `schemaFilter`,
`extensionsFilters`, `entities.roles` (aceita `'neon'`), `verbose`, `breakpoints` (default
`true`), `introspect.casing`.

Na v1 o `schemaFilter` **inverteu o default**: antes gerenciava só `public`, agora gerencia
todos os schemas.

## Fluxo de migração

O fluxo do projeto é **`generate` + `migrate`** — migração versionada em SQL, revisável em PR.

```bash
npx drizzle-kit generate --name=init
npx drizzle-kit migrate
```

Estrutura gerada (v1, formato de pasta v3):

```
📂 drizzle
└ 📂 20242409125510_premium_mister_fear
  ├ 📜 migration.sql
  └ 📜 snapshot.json
```

Sem `journal.json` — cada migração é uma pasta isolada, o que reduz conflito de merge.
`drizzle-kit drop` não existe mais; para reverter, gere uma migração nova.

`drizzle-kit push` aplica o schema direto, sem arquivo SQL. Serve para prototipar contra um
branch descartável do Neon. **Não use no banco compartilhado nem em produção** — sem arquivo
versionado, ninguém revisa o `DROP COLUMN`. Se usar: `--explain` para simular, `--force` para
aceitar perda de dados (o antigo `--strict` foi removido; o prompt de segurança agora é o
padrão).

Flags úteis de `generate`: `--name`, `--custom` (SQL vazio para migração escrita à mão),
`--config`, `--out`, `--ignore-conflicts`.

Para aplicar migração em runtime existe a função `migrate()`, importada de um submódulo do
driver. **Confirme o caminho exato na página `/docs/drizzle-kit-migrate` antes de usar** — ele
varia por driver e não está fixado aqui.

## Scripts

```json
"db:generate": "drizzle-kit generate",
"db:migrate": "drizzle-kit migrate",
"db:studio": "drizzle-kit studio"
```
