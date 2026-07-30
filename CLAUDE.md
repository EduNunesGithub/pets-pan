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

## Regra inegociável

**Antes de escrever, editar ou refatorar qualquer arquivo de código, invoque a skill
`write-code`.** Sem exceção — inclusive para alterações de uma linha, correções de bug e
arquivos de configuração.

Ela carrega as convenções obrigatórias do projeto: ordem alfabética, `kebab-case`, estrutura
de pastas de componentes, imports por alias, proibição de `any` e proibição de comentários.
Código escrito sem passar por ela será rejeitado na revisão.

## Skills do projeto

| Skill             | Quando                                                                                                                   |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `write-code`      | Toda escrita de código. Obrigatória.                                                                                     |
| `drizzle`         | Qualquer coisa que toque o banco. Schema, coluna, relação, query, transação, migração, `drizzle.config`, conexão Neon.   |
| `nextjs`          | Qualquer coisa que toque o framework. App Router, rotas, Server/Client Components, Server Actions, cache, `next.config`. |
| `frontend-design` | Direção visual ao construir ou remodelar UI.                                                                             |
| `commit`          | Criar branch, commitar e subir. Nunca abre PR.                                                                           |

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

App Next.js recém-scaffoldado. **Nada do domínio foi implementado ainda** — nenhuma das
entidades de `docs/domain.md` existe em código.

Configuração já alinhada às convenções: `strict: true`, `allowJs: false` e alias `@/`
apontando para a raiz no `tsconfig.json`; `next.config.ts` com `typedRoutes`.

O banco está conectado: `db/index.ts` (driver `neon-serverless`), `db/relations.ts`,
`drizzle.config.ts` e migrações versionadas em `drizzle/`. Os scripts são `db:generate`,
`db:migrate` e `db:studio`.

Pendências:

- Não há setup de teste (Vitest, Playwright).
- `cacheComponents` está desligado — o app roda no modelo de cache anterior ao PPR. Decisão
  em aberto.
- A tabela `todos` e a listagem em `app/page.tsx` são **andaime de verificação da conexão**,
  não domínio. Saem quando a primeira entidade real (organização, animal) for modelada.
