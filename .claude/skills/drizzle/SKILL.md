---
name: drizzle
description: Drizzle ORM v1 com Neon Postgres. Use antes de escrever ou alterar qualquer coisa que MUDE o banco — schema, tabela, coluna, relação, query, transação, migração, `drizzle.config`, conexão. NÃO é necessária para mudança que não altera schema, query nem conexão (ex.- polimento visual de componente que exibe dados). Gatilhos: criar tabela, alterar coluna, índice, chave estrangeira, buscar/gravar no banco, transação, migração, `drizzle-kit`, `$inferSelect`.
---

# Drizzle ORM v1 — Neon Postgres

Versões: **`drizzle-orm@1.0.0-rc.4`**, **`drizzle-kit@1.0.0-rc.4`**,
**`@neondatabase/serverless@1.1.0`**. Documentação consultada em 2026-07-29.

**Atenção:** a tag `latest` do npm ainda aponta para a `0.45.2`, que tem **outra API** de
relações e de query. Este projeto usa a linha **v1 (`@rc`)**. Nunca instale sem `@rc` e nunca
copie exemplo que use `relations(table, ({ one, many }) => …)` — isso é v0 e foi removido.

## Referências desta skill

Carregue **só** o tópico que a tarefa toca:

| Preciso de                                             | Leia                     |
| ------------------------------------------------------ | ------------------------ |
| Schema: coluna, enum, constraint, relação, `snakeCase` | `references/schema.md`   |
| Query (RQB/SQL), insert/update/delete, transação       | `references/queries.md`  |
| Conexão, `drizzle.config`, migração, env               | `references/setup.md`    |
| URL da documentação oficial por assunto                | `references/docs-map.md` |

Se nada disso cobrir, **não escreva de memória** — busque a página oficial e leia antes.

## Decisões fixas do projeto

- **Driver `neon-serverless`** (WebSockets), nunca `neon-http`: o motor de pipeline grava em
  várias tabelas por operação (regra 15) e exige `db.transaction`, que o `neon-http` não
  suporta.
- **`snakeCase.table(…)`** no schema — `camelCase` no TS vira `snake_case` no Postgres sem
  repetir nome. `drizzle({ casing })` é v0, não existe mais.
- **Colunas em ordem alfabética**, inclusive `id` — ordem física não carrega significado;
  `id` no topo exige justificativa `order:`.
- **Migração por `generate` + `migrate`**, versionada em `drizzle/` (nunca no `.gitignore`).
  `push` só contra branch descartável do Neon.

## Layout e o tripwire `@/server`

```
db/schema/   → uma tabela por arquivo, kebab-case, plural (animals.ts), tudo exportado
db/relations.ts → defineRelations
db/index.ts  → instância db; único ponto que abre conexão; SEM server-only (a CLI do
               Better Auth precisa carregá-lo)
server.ts    → entry guarded: import "server-only" + reexporta db e auth
```

Código server-side importa `{ db }` de **`@/server`**, nunca de `@/db` — é o `@/server` que
quebra o build se vazar para Client Component. `db/` não é camada de domínio: as 18 regras
vivem em módulo puro (`domain/`), o `db/` só persiste.

## Uso na camada Next

- `db` é consumido em Server Component, Server Action ou route handler — sempre via
  `@/server`.
- Server Action é endpoint `POST` público. **Toda query filtra por `organizationId` do
  usuário autenticado** (regra 1). Escopo de organização é `where`, não decoração de UI.
- **Query de banco não torna a rota dinâmica.** Sem buraco dinâmico, o Next pré-renderiza no
  build e congela as linhas no HTML. O padrão do projeto (Cache Components) está na skill
  `nextjs`.
- Cache é decisão explícita (`'use cache'` / `revalidateTag`) — query de ORM nunca é cacheada
  sozinha.
- Duas queries independentes vão em `Promise.all`, não em `await` sequencial.
- Depois de mutar, `revalidatePath`/`revalidateTag` **antes** do `redirect`.

### Escopo por organização — `requireActiveOrganization`

A organização é a fronteira de dados (regra 1). "Lembrar de filtrar" não é mecanismo: um
vazamento entre workspaces de ONGs é o pior bug do produto.

**A fonte única do `organizationId`.** `requireActiveOrganization()` (em `@/server`) é o único
lugar que resolve a organização ativa. Ele lê a sessão, exige que a org ativa esteja **setada
explicitamente** (nunca infere das memberships) e confirma que o usuário é membro dela antes
de devolver o escopo:

```ts
import { db, requireActiveOrganization } from "@/server";

export async function listOrganizationAnimals() {
  const scope = await requireActiveOrganization();

  return db.query.animals.findMany({ where: { organizationId: scope } });
}
```

Sem sessão → `/sign-in`; sem org ativa, ou usuário que não é membro → `/organizations/new`.
A org ativa é setada explicitamente — no login (hook de sessão, membership mais antiga), ao
criar a org, ou pelo switcher — e o resolver **nunca a infere**. A reconferência da
membership não é zelo: `session` não tem chave estrangeira para `organization`, então um
membro removido carregaria um `activeOrganizationId` órfão — o resolver barra isso.

**O escopo é um tipo, não uma convenção.** O retorno é `OrganizationScope`
(`@/db/organization-scope`), uma `string` _branded_ que **só** o resolver produz. Toda função
que lê tabela da organização recebe esse escopo e filtra por ele. Uma `string` crua não é
atribuível a `OrganizationScope` — não dá para consultar dado escopado sem passar pelo
resolver (a não ser por um `as` explícito, que é o que a revisão pega).

**Nem toda tabela tem `organizationId`, nem toda leitura é escopada:**

- **Tabela dona-do-animal** (case, etapa, tarefa — regra 3) não carrega `organizationId`:
  escope pela travessia — `where: { animal: { organizationId: scope } }`.
- **Leitura pública / cross-org** — marketplace (§7) e adotante global (§8) **não** passam
  por `requireActiveOrganization()`: aplicá-lo derrubaria o visitante anônimo em `/sign-in`.
  O resolver é para a **face interna**.

Não embrulhe `requireActiveOrganization()` em `try/catch`: o redirect é exceção
(`NEXT_REDIRECT`) e um catch cego a engoliria. RLS fica fora — app único, pool com role de
serviço.

## Armadilhas

- Instalar sem `@rc` e cair na `0.45.2` — API de relações é outra, o erro é de tipo.
- `where` do RQB escrito como callback (`(t, { eq }) => …`): na v1 é objeto.
- `db.transaction` com driver `neon-http`: não suporta transação interativa.
- Esquecer `neonConfig.webSocketConstructor = ws` no Node — falha só ao abrir conexão.
- Usar `db` em vez de `tx` dentro da transação.
- `Pool` novo a cada HMR em `next dev`, esgotando conexão do Neon (ver `references/setup.md`).
- Tabela não exportada de `db/schema/` — o `drizzle-kit` não a vê, migração sai incompleta.
- Esperar que `defineRelations` crie chave estrangeira: não cria (`.references()` cria).
- `dotenv/config` ou `loadEnvConfig(cwd)` sem segundo argumento no `drizzle.config.ts`: não
  leem `.env.development.local` (ver `references/setup.md`).
- `getTableColumns` renomeado para `getColumns` na v1.
- Pacotes de validação: use `drizzle-orm/zod`, não `drizzle-zod` (consolidados na v1).
- Leitura de tabela da organização sem `OrganizationScope` — escapa da fronteira (regra 1).
- Embrulhar `requireActiveOrganization` em `try/catch` — engole o `NEXT_REDIRECT`.

## Pare e pergunte

- A tarefa pede pacote do ecossistema sem skill (`drizzle-seed`, camada de cache).
- A API necessária não está aqui e a documentação não confirma o comportamento na
  `1.0.0-rc.4`.
- A modelagem exigida contradiz `docs/domain.md` — em especial as regras 2, 15 e 16, que são
  regra de negócio e **não** devem virar constraint de schema.
- A solução exigiria `any`, `@ts-ignore` ou `drizzle-kit push --force` em banco compartilhado.
