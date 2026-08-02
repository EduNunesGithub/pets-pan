# pet-monorepo

Plataforma all-in-one para ONGs de resgate animal. O foco organizacional é a ONG; a entidade
central do domínio é o **animal**. Nenhum fluxo de trabalho é hardcodado — cada organização
configura seus próprios cases, etapas e tarefas sobre um motor de pipeline genérico.

---

## Stack

Aplicação **Next.js** única, sem backend separado. As rotas e Server Actions do Next são a
camada HTTP.

- Next.js 16 (App Router) · React 19 · TypeScript
- **npm** como gerenciador de pacotes
- ESLint 9 (flat config) + Prettier
- husky + lint-staged no pre-commit

## Arquitetura

A lógica de domínio — motor de pipeline, ciclo de vida do animal, as 17 regras de negócio —
vive numa camada **sem framework**: zero import de `next`, zero dependência de HTTP ou de
React. A camada Next (route handlers, Server Actions, Server Components) é fina e só
orquestra.

O motivo é testabilidade: regra de negócio em módulo puro se testa com Vitest em
milissegundos, sem servidor e sem mock de framework. Regra de negócio dentro de Server Action
não se testa isoladamente.

Essa camada vive em **`domain/`**, na raiz, organizada **por entidade**: um módulo por
conceito do domínio (`adopter`, `animal`, `application`, `case`, `member`, `organization`),
mais o motor genérico em `pipeline/`. Cada módulo é uma pasta em `kebab-case`, no singular, e
**nada dentro de `domain/` importa `next` ou `react`**. O import é sempre por
`@/domain/<entidade>/...`, com testes co-locados. A convenção completa — o que vai em cada
módulo e onde mora uma operação que cruza entidades — está em `domain/README.md`.

## Regra inegociável

**Antes de escrever, editar ou refatorar qualquer arquivo de código, invoque a skill
`write-code`.** Sem exceção — inclusive para alterações de uma linha, correções de bug e
arquivos de configuração.

Ela carrega as convenções obrigatórias do projeto: ordem alfabética, `kebab-case`, estrutura
de pastas de componentes, imports por alias, proibição de `any` e proibição de comentários.
Código escrito sem passar por ela será rejeitado na revisão.

## Skills do projeto

| Skill             | Quando                                                                                                                     |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `write-code`      | Toda escrita de código. Obrigatória.                                                                                       |
| `drizzle`         | Qualquer coisa que toque o banco. Schema, coluna, relação, query, transação, migração, `drizzle.config`, conexão Neon.     |
| `nextjs`          | Qualquer coisa que toque o framework. App Router, rotas, Server/Client Components, Server Actions, cache, `next.config`.   |
| `better-auth`     | Qualquer coisa que toque autenticação. Login, sessão, papéis e permissões, membros como identidade, convites, `/api/auth`. |
| `zod`             | Qualquer validação. Schema de form, parse de entrada de Server Action/route, `searchParams`, env, invariante de entidade.  |
| `tanstack-form`   | Qualquer formulário com estado. `useForm`, campos, validação por schema, submit, binding do design system.                 |
| `base-ui`         | Qualquer primitivo de UI interativo — modal, popover, menu, select, combobox, tooltip, tabs — ou composição por `render`.  |
| `frontend-design` | Direção visual ao construir ou remodelar UI.                                                                               |
| `commit`          | Criar branch, commitar e subir. Nunca abre PR.                                                                             |

Se for usar uma biblioteca ou framework sem skill correspondente no repositório, **pare e
pergunte** — peça a instalação da skill ou a documentação da versão em uso. Não escreva API
de memória.

## Domínio

`docs/domain.md` é a fonte de verdade do modelo de domínio e das **17 regras de negócio**
numeradas. Leia antes de tocar em qualquer entidade do domínio (organização, animal, case,
pipeline, candidatura, adotante).

Referencie as regras pelo número em commits e revisões (`regra 5`, `regra 14`).

Ao concluir qualquer alteração que toque essas entidades, acione o agent `domain-reviewer`
antes de reportar a feature como pronta.

Se uma tarefa contradiz uma regra do domínio, **não invente a solução** — aponte a
contradição.

## Idioma

- Código, identificadores e nomes de arquivo: **inglês**.
- Documentação, descrição de commit e conversa: **português**.
- Tipo e escopo do commit seguem a spec, em inglês (`feat(animal): ...`).

## Estado atual

App Next.js recém-scaffoldado. A camada de domínio já tem casa (`domain/`, ver
`domain/README.md`), mas **nenhuma entidade foi implementada ainda** — nenhuma das entidades
de `docs/domain.md` existe em código.

Configuração já alinhada às convenções: `strict: true`, `allowJs: false` e alias `@/`
apontando para a raiz no `tsconfig.json`; `next.config.ts` com `typedRoutes` e
`cacheComponents`.

O modelo de cache é **Cache Components (PPR)** — `cacheComponents: true`, decidido na CAR-119
com o app ainda sem rotas reais para não pagar migração por rota depois. Nada é cacheado sem
`'use cache'` e não há `force-dynamic`: uma leitura de dado runtime vira buraco dinâmico
quando fica sob `<Suspense>` e alcança uma API dinâmica (`cookies`/`headers`/`searchParams`,
ou `await connection()` num read sem request). O padrão detalhado está na skill `nextjs`.

O banco está conectado: `db/index.ts` (driver `neon-serverless`), `db/relations.ts`,
`drizzle.config.ts` e migrações versionadas em `drizzle/`. Os scripts são `db:generate`,
`db:migrate` e `db:studio`.

Os testes têm as duas camadas configuradas: **Vitest** para a regra de domínio (`CAR-117`,
`vitest.config.ts`, specs `*.test.ts`) e **Playwright** para os fluxos de ponta a ponta
(`CAR-120`, `playwright.config.ts`, specs em `e2e/*.spec.ts`). Rodam por `npm test` e
`npm run test:e2e` — runners separados que não se cruzam: `.test.ts` é do Vitest, `.spec.ts` é
do Playwright. O E2E sobe o app sozinho pelo `webServer` (`next dev`) e, por ora, faz smoke
read-only na base de dev; base dedicada entra quando um fluxo real precisar semear.

A autenticação usa o **Better Auth** (CAR-122), **modelada, migrada e plugada ao login**
(CAR-190): `better-auth@1.6.25` instalado, `auth/index.ts` com o adapter Drizzle do core
(`better-auth/adapters/drizzle`) e o plugin `organization` (com a `location` da ONG como
`additionalField`). As 7 tabelas — `user`, `session`, `account`, `verification`, `organization`,
`member`, `invitation`, com `id` `text` — foram geradas pela CLI e **reescritas à mão** nas
convenções v1 em `db/schema/auth.ts` (relações em `db/relations.ts`), com a migração aplicada no
Neon de dev. Isso realiza a modelagem de dados de CAR-123 (organization) e CAR-126 (member). O
conflito de peer com o Drizzle era brando (peer opcional `drizzle-kit` em pré-lançamento) —
resolvido com `--legacy-peer-deps`. O `server-only` **saiu** de `db/index.ts` e `auth/index.ts`
(a CLI precisa carregá-los) e virou o guarded entry `server.ts` na raiz, que reexporta
`db`/`auth`; código server-side importa de `@/server`. Papéis são fixos em código (§8.1) —
access control estático, nunca papéis dinâmicos; defini-los em módulo de domínio é a CAR-125.
O login por e-mail/senha está ligado (CAR-190): route handler em `app/api/auth/[...all]`,
`authClient` em `auth/client.ts`, `nextCookies()` como último plugin e o `schema` explícito no
`drizzleAdapter` — o `db` v1 usa a API de `relations`, que não expõe as tabelas para
introspecção do adapter. Telas de sign-up/sign-in/sign-out sem estilo e home consciente de
sessão sob `<Suspense>`; `BETTER_AUTH_SECRET`/`BETTER_AUTH_URL` vêm da Vercel via
`vercel env pull`. As skills `better-auth` e `drizzle`
documentam tudo.

O andaime de verificação da conexão (tabela `todos`, listagem da home e `app/loading.tsx`) foi
removido (CAR-124): a home agora é a UI de sessão real.
