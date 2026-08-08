---
name: write-code
description: Convenções obrigatórias de código deste projeto. Use SEMPRE antes de escrever, editar ou refatorar qualquer arquivo de código (.ts, .tsx, .mjs, .json de config) — sem exceção, inclusive para alterações de uma linha. As regras mecânicas (ordem alfabética, imports, kebab-case, any, comentários) são impostas por ESLint; esta skill cobre o que o lint não verifica — estrutura de pastas, exceções de ordem, pare-quando-faltar-doc, domínio. Gatilhos: escrever código, criar componente, criar hook, criar módulo, refatorar, corrigir bug, implementar feature.
---

# Convenções de código

**Valem para todo arquivo do repositório, sem exceção.** Uma alteração de uma linha está
sujeita às mesmas regras que um arquivo novo.

## O que o lint já garante — não memorize, rode

`eslint.config.mjs` é a fonte de verdade das regras mecânicas, e o pre-commit as bloqueia:
ordem alfabética (imports, exports, props de type/interface/objeto, enums, unions, props
JSX, membros de classe), grupos de import (side-effect → externo → alias `@/` → type-only),
proibição de import relativo, `kebab-case` em nomes de arquivo, proibição de `any` e
`@ts-ignore`, comentários apenas em bloco `/* */` nas formas permitidas (linha `//`
proibida) e um componente React por arquivo.

Depois de qualquer alteração: `npm run lint:fix` corrige o corrigível; `npm run lint` +
`npx tsc --noEmit` devem passar limpos. Não reporte conclusão com lint vermelho.

## Exceções de ordem têm forma fixa

Quando uma sequência carrega significado (etapas de funil, precedência de plugin), a ordem
alfabética cede — mas a exceção precisa ser visível e justificada:

- Uma regra do lint acusou a lista → `/* eslint-disable-next-line <regra> -- <motivo> */`.
- Nenhuma regra acusa (arrays, ordem de plugins) → comentário `/* order: <motivo> */`.
- `@ts-expect-error` exige descrição → `/* @ts-expect-error <descrição> */`; `@ts-ignore` é proibido.

Essas são as únicas formas de comentário permitidas, e **sempre em bloco `/* */`** —
comentário de linha `//` é proibido em qualquer conteúdo, e o `lint:fix` converte `//` em
`/* */` quando o conteúdo é permitido. Qualquer outra forma o lint rejeita: se deu vontade
de comentar prosa, o código não está claro — renomeie, extraia, dê nome à constante.

Nunca reordene parâmetros de função por alfabeto: a posição deles é semântica e nenhum
lint protege isso.

## O que o lint não verifica

- **Pastas em `kebab-case`** — o lint só checa nome de arquivo, não de pasta.
- **Arrays de constantes** em ordem alfabética, salvo ordem semântica (`order:`).
- **Só TypeScript** — `.js`/`.jsx` não entram no repositório.

### Estrutura de componentes React

Componentes, hooks e contexts moram cada um em sua própria pasta, com o código em `index`:

```
animal-card/index.tsx        →  componente
use-animal-list/index.ts     →  hook       (.ts, sem JSX)
animal-context/index.tsx     →  context
```

Sub-componentes vão em subpastas do componente pai — a hierarquia de pastas espelha a
hierarquia de composição. Um sub-componente usado por mais de um pai não é sub-componente:
sobe para o nível compartilhado. Arquivos auxiliares (tipos, constantes, testes) convivem
na pasta do componente.

## Pare quando faltar documentação

Antes de escrever código com uma lib ou framework, verifique se existe skill para ela.

- **Existe?** Carregue e siga.
- **Não existe — ou não cobre o que você precisa?** **Pare.** Não escreva de memória; peça
  a skill ou a documentação da versão em uso. API escrita de memória reflete versão antiga
  e o erro só aparece em runtime.

## Domínio

O modelo e as regras de negócio estão em `docs/domain.md`. Código que toca entidade do
domínio deve estar de acordo. Se a tarefa contradiz uma regra, **não invente a solução** —
aponte a contradição ao usuário.

## Checklist final

- [ ] `npm run lint` e `npx tsc --noEmit` passam limpos
- [ ] Pastas em `kebab-case`; componentes/hooks/contexts em `nome/index`
- [ ] Bibliotecas usadas têm skill no repositório — ou o usuário foi consultado
- [ ] Nada contradiz `docs/domain.md`
