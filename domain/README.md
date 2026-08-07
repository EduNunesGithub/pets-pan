# Camada de domínio

A lógica de negócio do produto vive aqui, numa camada **sem framework**: nada neste diretório
importa `next`, `react` ou `react-dom`, e nada abre conexão de banco. É TypeScript puro — o
motor de pipeline, o ciclo de vida do animal e as 18 regras de `docs/domain.md`.

O motivo é testabilidade: regra de negócio em função pura se testa com Vitest em
milissegundos, sem servidor e sem mock de framework. A camada Next (`app/`) orquestra e expõe
por HTTP; a persistência mora em `db/`. O domínio decide **o quê**; essas camadas cuidam do
**como** e do **onde**.

## Onde criar um módulo

Um módulo por **entidade** do domínio, cada um em sua pasta `kebab-case`, no **singular**:

```
domain/
├─ adopter/
├─ animal/
├─ application/
├─ case/
├─ member/
├─ organization/
└─ pipeline/
```

Esses são os módulos previstos pelo domínio; cada um nasce quando o seu card o implementa —
não se criam pastas vazias adiantadas. O nome é o conceito no singular (`animal`), não a
tabela no plural (`animals`, que é convenção do banco, em `db/`).

`pipeline/` é o **motor genérico** de etapas e tarefas — definição e instância (`docs/domain.md`
§3). `case/` e `application/` são os dois sujeitos que rodam sobre ele: usam o motor, não o
reimplementam.

## O que vai dentro de um módulo

```
animal/
├─ animal.ts             tipos e invariantes da entidade
├─ close-animal.ts       um caso de uso por arquivo, verbo à frente (regra 6)
└─ close-animal.test.ts  teste co-locado, mesmo nome + .test.ts
```

- Tipos e invariantes da entidade em `<entidade>.ts`.
- Cada operação (caso de uso) em seu próprio arquivo, com função nomeada.
- Testes co-locados, um por unidade — a skill `vitest` cobre como escrevê-los.
- Não existe `index.tsx` aqui: a estrutura `nome/index.tsx` da `write-code` §4 é para
  componente React, não para módulo de domínio.

## Operação que cruza entidades

Uma operação que envolve mais de uma entidade mora no módulo da entidade **primária** e importa
as demais por `@/domain/...`. Exemplo: "selecionar candidatura abre o case de adoção" (regra 14) vive em `application/` ou `case/` e importa os tipos de ambos.

## Regras

- **Sem framework.** Zero import de `next`, `react`, `react-dom`; nenhuma conexão de banco.
- **Import por alias.** Sempre `@/domain/<entidade>/...`; caminho relativo é proibido
  (`write-code` §2). O alias `@/` → raiz do `tsconfig.json` já resolve `domain/` — não há alias
  novo a configurar.
- **`kebab-case`** em todo arquivo e pasta (`write-code` §3).
- **Testes co-locados**, descobertos pelo Vitest (`include: ["**/*.test.ts"]`).

Fonte de verdade do modelo: `docs/domain.md`. Convenções de código: `.claude/skills/write-code`.
Como testar: `.claude/skills/vitest`.
