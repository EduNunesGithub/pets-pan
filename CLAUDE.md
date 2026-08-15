# pet-monorepo

Plataforma all-in-one para ONGs de resgate animal. O foco organizacional é a ONG; a entidade
central do domínio é o **animal**. Nenhum fluxo de trabalho é hardcodado — cada organização
configura seus próprios cases, etapas e tarefas sobre um motor de pipeline genérico.

## Stack

Aplicação **Next.js** única, sem backend separado. As rotas e Server Actions do Next são a
camada HTTP.

- Next.js 16 (App Router) · React 19 · TypeScript · **npm**
- ESLint 9 + Prettier · husky + lint-staged no pre-commit

## Arquitetura

A lógica de domínio — motor de pipeline, ciclo de vida do animal, as 18 regras de negócio —
vive em **`domain/`**, camada sem framework: zero import de `next` ou `react`, testes
Vitest co-locados, import por `@/domain/<entidade>/...`. A camada Next é fina e só
orquestra. Convenção completa em `domain/README.md`.

## Regra inegociável

**Antes de escrever, editar ou refatorar qualquer arquivo de código, invoque a skill
`write-code`.** Sem exceção. As convenções mecânicas (ordem alfabética, imports, kebab-case,
`any`, comentários) são impostas por ESLint — `eslint.config.mjs` é a fonte de verdade — e a
skill cobre o que o lint não verifica.

## Rotas por classe de tarefa

| Classe de tarefa                                           | Carregar                                         | Não carregar                                        |
| ---------------------------------------------------------- | ------------------------------------------------ | --------------------------------------------------- |
| Polimento visual (tipografia, cor, espaçamento, transição) | `write-code` (+ `frontend-design` se redesenha)  | skills de stack; `domain-reviewer` não dispara      |
| Componente/UI com estado ou comportamento novo             | `write-code` + só as skills do que **muda**      | `drizzle`/`better-auth` se não toca dado nem sessão |
| Feature de domínio, banco ou auth                          | `write-code` + skills tocadas + `docs/domain.md` | —                                                   |
| Testes                                                     | `vitest` (domínio) ou `playwright` (E2E)         | —                                                   |

Uma skill de stack se carrega quando a mudança **altera** aquilo que a skill cobre — não
porque o arquivo tocado a menciona.

**`domain-reviewer`**: acione ao concluir mudança que toca `domain/`, schema de entidade de
domínio ou comportamento coberto por regra numerada de `docs/domain.md`. Mudança puramente
visual ou de navegação não dispara.

## Skills do projeto

| Skill                  | Quando                                                                 |
| ---------------------- | ---------------------------------------------------------------------- |
| `write-code`           | Toda escrita de código. Obrigatória.                                   |
| `drizzle`              | Schema, coluna, relação, query, transação, migração, conexão Neon.     |
| `nextjs`               | Rotas, Server/Client Components, Server Actions, cache, `next.config`. |
| `better-auth`          | Login, sessão, papéis, membros, convites, `/api/auth`.                 |
| `zod`                  | Qualquer validação — form, Server Action, `searchParams`, env.         |
| `tanstack-form`        | Formulário com estado: `useForm`, campos, validação, submit.           |
| `tanstack-react-query` | Estado de servidor no cliente: queries, mutations, invalidation.       |
| `base-ui`              | Primitivo de UI interativo — modal, menu, select, tooltip, `render`.   |
| `vercel-blob`          | Upload, remoção, listagem de arquivo; foto persistida no Blob.         |
| `sharp`                | Processamento de imagem no servidor — resize, webp, EXIF, `metadata`.  |
| `react-dropzone`       | Área de drag'n'drop; campo de upload de arquivo por drop/seleção.      |
| `frontend-design`      | Direção visual ao construir ou remodelar UI.                           |
| `vitest`               | Teste de domínio: `*.test.ts`, mock, config do runner.                 |
| `playwright`           | Teste E2E: `e2e/*.spec.ts`, `webServer`, config.                       |
| `commit`               | Criar branch, commitar e subir. Nunca abre PR.                         |

Lib ou framework sem skill correspondente: **pare e pergunte**. Não escreva API de memória.

**Skills de terceiros.** Alguns pacotes publicam agent-skills em
`node_modules/<pacote>/skills/<nome>/SKILL.md` (drizzle-kit). O `AGENTS.md` (gerado por
`npx @tanstack/intent install --map`) mapeia tarefa→skill; carregue sob demanda com
`npx @tanstack/intent load <id>` ou leia o `SKILL.md`.

## Domínio

`docs/domain.md` é a fonte de verdade do modelo e das **18 regras de negócio** numeradas.
Leia antes de tocar em qualquer entidade (organização, animal, case, pipeline, candidatura,
adotante) e referencie as regras pelo número (`regra 5`). Se uma tarefa contradiz uma regra,
não invente a solução — aponte a contradição.

## Idioma

- Código, identificadores e nomes de arquivo: **inglês**.
- Documentação, commits e conversa: **português** (tipo/escopo do commit em inglês:
  `feat(animal): ...`).

## Estado atual

- **Auth**: Better Auth 1.6 com login e-mail/senha funcionando — plugin `organization`
  (com `location` como additionalField), 7 tabelas reescritas à mão em `db/schema/auth.ts`,
  handler em `app/api/auth/[...all]`, `authClient` em `auth/client.ts`. Papéis fixos em
  código (§8.1), nunca dinâmicos. Código server-side importa `db`/`auth` de `@/server`
  (entry guarded); `db/index.ts` e `auth/index.ts` não têm `server-only` (a CLI os carrega).
- **Domínio**: `domain/organization` (criação) e `domain/member` (papéis e permissões)
  implementados com testes. Demais entidades de `docs/domain.md` ainda não existem.
- **UI**: sign-in/sign-up, criação de organização, a casca responsiva do workspace
  (`app/(workspace)` — sidebar/drawer, nav, switcher de organização) com sessão sob
  `<Suspense>`, e o cadastro + a listagem de animais (busca por nome, filtros de espécie/
  sexo/porte/faixa etária e paginação **server-side** dirigidos por `searchParams`, com a
  query escopada e paginada no Postgres sob `<Suspense>`).
- **Banco**: Neon + Drizzle v1 (driver `neon-serverless`), migrações em `drizzle/`,
  scripts `db:generate`/`db:migrate`/`db:studio`.
- **Cache**: Cache Components (PPR) — nada é cacheado sem `'use cache'`; sem
  `force-dynamic`. Padrão detalhado na skill `nextjs`.
- **Arquivos**: Vercel Blob (`@vercel/blob`, auth por OIDC — `BLOB_STORE_ID` +
  `VERCEL_OIDC_TOKEN`, sem token estático no código) com `sharp` processando toda imagem
  antes do upload — webp q75 em duas variantes 4:3 (`card` 640×480, `full` 1600×1200,
  ambas 2× o tamanho de exibição), definidas em `domain/animal/photo.ts`. Tabela
  `animal_photos` criada (`alt` obrigatório, `is_cover` com índice único parcial por
  animal, `position` para ordenação); o fluxo de upload em si ainda não existe.
- **Testes**: Vitest (`*.test.ts`, domínio) e Playwright (`e2e/*.spec.ts`, smoke read-only
  na base de dev) — runners separados que não se cruzam.
- **Lint**: ESLint 9 mecaniza as convenções (`perfectionist`, `unicorn/filename-case`,
  regra local `pet/no-comments`, `react/no-multi-comp`); pre-commit roda lint-staged +
  `tsc --noEmit`. Preso no ESLint 9 até `eslint-config-next` suportar ESLint 10
  (`eslint-plugin-unicorn` fixa em 65.0.1 pelo mesmo motivo).
- Env (`BETTER_AUTH_SECRET`/`BETTER_AUTH_URL`) vem da Vercel via `vercel env pull`.

## Manutenção desta documentação

- **"Estado atual" é snapshot, não changelog**: sessão que muda o estado **edita** as
  linhas afetadas; histórico mora no git e no Linear.
- **Bump de versão de lib exige atualizar a skill correspondente no mesmo PR.**
- **Skill divergiu do código?** Corrigir a skill faz parte da tarefa, não é opcional.
- **Convenção mecânica nova entra em `eslint.config.mjs`**, não em prosa.
