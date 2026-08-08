---
name: better-auth
description: Better Auth v1.6 (autenticação). Use antes de escrever ou alterar qualquer coisa que MUDE autenticação — login, sessão, `getSession`, proteção de rota ou Server Action, papel/permissão, convite, o handler `/api/auth`, o adapter Drizzle do auth ou o schema gerado. NÃO é necessária para mudança puramente visual em telas de auth (estilo de formulário, tipografia). Gatilhos: `betterAuth`, `authClient`, `drizzleAdapter`, `toNextJsHandler`, `nextCookies`, plugin `organization`, `createAccessControl`, checar papel, session no servidor.
---

# Better Auth — autenticação

Versões: **`better-auth@1.6.25`**, CLI **`auth@1.6.25`** (`npx auth@latest`). Documentação e
spike de instalação real consultados em 2026-08-01. Escolhido na **CAR-122**: identidade no
nosso Neon via Drizzle, e o plugin `organization` modela workspace, membros, papéis e
convites sobre o mesmo banco (§8 do domínio).

## Referências desta skill

Carregue **só** o tópico que a tarefa toca:

| Preciso de                                                          | Leia                   |
| ------------------------------------------------------------------- | ---------------------- |
| Instalar, instância, env, handler Next, sessão, client, mapa da doc | `references/setup.md`  |
| Gerar/migrar schema, tabelas, plugin `organization`, papéis §8.1    | `references/schema.md` |

Se nada disso cobrir, **não escreva de memória** — o mapa da documentação oficial está no
fim de `references/setup.md`.

## Decisões fixas do projeto

- **Adapter no core**: `better-auth/adapters/drizzle`. Nunca `@better-auth/drizzle-adapter`
  (peer rígido). CLI é o pacote `auth`; `@better-auth/cli` morreu na `1.4.21`.
- **Instalação com `--legacy-peer-deps`** — o peer opcional `drizzle-kit` não reconhece o
  nosso RC (detalhe em `references/setup.md`).
- **`auth/index.ts` e `db/index.ts` sem `server-only`** (a CLI precisa carregá-los); o guard
  é `server.ts` na raiz — código server-side importa de `@/server`.
- **`nextCookies()` é o último plugin** — ordem semântica, justificada com `order:`.
- **O adapter recebe `schema` explícito** — o `db` v1 usa a API de `relations`, que não expõe
  as tabelas para introspecção.
- **Papéis fixos em código** (access control estático, `createAccessControl`); nunca papéis
  dinâmicos (`organizationRole`) — `docs/domain.md` §8.1 manda. Módulo de domínio: CAR-125.
- **IDs são `text`** (default da lib) — FK do domínio para `organization`/`user` é `text`.
- **Better Auth é dono das tabelas `organization`/`member`** (CAR-123): geradas pelo plugin,
  reescritas nas convenções, nunca modeladas do zero. Campos da ONG (ex.: `location`) entram
  como `additionalField`.

## Sessão e Cache Components

`getSession` chama `await headers()` — API dinâmica. Todo componente que lê sessão é um
**buraco dinâmico** no modelo PPR: fica sob `<Suspense>` e **nunca** entra em `'use cache'`.
Sessão em cache seria sessão de outro usuário.

Server Action é endpoint `POST` público: autentique **e** autorize dentro de cada função.
Leitura da face interna é escopada via `requireActiveOrganization()` → `OrganizationScope`
(skill `drizzle`); marketplace público e adotante global não passam pelo resolver.

## Armadilhas

- Instalar `@better-auth/drizzle-adapter` ou usar `@better-auth/cli` — pacotes errados.
- Instalar sem `--legacy-peer-deps` — `ERESOLVE` pelo peer `drizzle-kit`.
- Reintroduzir `server-only` em `auth/index.ts`/`db/index.ts` — quebra a CLI `generate`.
- Deixar o bloco `relations()` gerado no schema — API v0, quebra o `db:generate`.
- Rodar `npx auth@latest migrate` com Drizzle — só serve ao Kysely; use `db:migrate`.
- `nextCookies()` fora da última posição — cookie de sessão não seta em Server Action.
- Ler sessão fora de `<Suspense>` com `cacheComponents: true` — quebra o build, ou pior,
  cacheia sessão.
- Consumir `@/auth` ou `@/db` direto — pula o guard; importe de `@/server`.
- Habilitar papéis dinâmicos — contradiz §8.1.
- Reescrever o schema gerado sem manter nomes de tabela e chaves de coluna — o adapter mapeia
  por eles.
- `await` esquecido em `headers()` (Promise no Next 16).

## Pare e pergunte

- Persistir `legacy-peer-deps` num `.npmrc` — relaxa peers no projeto todo; decisão do dono.
- Provedor social, 2FA, magic link, passkey — plugin não coberto; leia a página oficial antes.
- A regra de papéis contradiz `docs/domain.md` §8.1 — aponte a contradição, não invente.
- A solução pediria papel dinâmico em banco, `any` ou `@ts-ignore`.
