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

A autenticação está **decidida, não implementada**: a solução é o **Better Auth** (CAR-122),
escolhida pelas duas populações de `docs/domain.md` §8 — membros escopados ao workspace e
adotantes globais — com identidade no próprio Neon via Drizzle e o plugin `organization` para
workspace, membros e papéis. A skill `better-auth` está no repo. **Atenção:** o
`@better-auth/drizzle-adapter` declara peer `drizzle-orm@^0.45.2` e o projeto roda a
`1.0.0-rc.4`; o conflito precisa ser resolvido antes de instalar (CAR-126/login) — a skill
documenta as saídas. Papéis são fixos em código (§8.1), então usa-se o access control estático,
nunca a tabela de papéis dinâmicos do plugin.

Pendências:

- A tabela `todos`, a listagem em `app/page.tsx` e o `app/loading.tsx` (que satisfaz o
  `<Suspense>`) são **andaime de verificação da conexão**, não domínio. Saem quando a primeira
  entidade real (organização, animal) for modelada.
