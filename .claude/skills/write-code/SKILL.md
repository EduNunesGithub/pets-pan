---
name: write-code
description: Convenções obrigatórias de código deste projeto. Use SEMPRE antes de escrever, editar ou refatorar qualquer arquivo de código (.ts, .tsx, .js, .jsx, .json de config) — sem exceção, inclusive para alterações de uma linha. Cobre ordem alfabética, nomenclatura kebab-case, estrutura de pastas de componentes React, imports por alias, proibição de `any`, proibição de comentários e a regra de parar quando falta documentação. Gatilhos: escrever código, criar componente, criar hook, criar módulo, criar serviço, adicionar entidade, refatorar, corrigir bug, implementar feature.
---

# Convenções de código

**Estas regras valem para todo arquivo de código do repositório, sem exceção.**
Uma alteração de uma linha está sujeita às mesmas regras que um arquivo novo.

Ao terminar, percorra o [checklist final](#checklist-final) antes de reportar conclusão.

---

## 1. Ordem alfabética por padrão

Tudo que é uma lista sem ordem semântica própria fica em **ordem alfabética crescente**.

Aplica-se a:

- imports (dentro de cada grupo — ver §2)
- exports
- membros de classe, dentro de cada nível de visibilidade
- propriedades de `interface`, `type` e objetos literais
- membros de `enum`
- membros de union types
- chaves de mapas e objetos de configuração
- props em JSX
- arrays de constantes
- decorators do Nest quando independentes entre si

```ts
// ❌
type Animal = {
  status: AnimalStatus;
  name: string;
  id: string;
};

// ✅
type Animal = {
  id: string;
  name: string;
  status: AnimalStatus;
};
```

### Exceção: quando a lógica exige outra ordem

A ordem alfabética cede quando a sequência carrega significado — etapas de um fluxo,
precedência de middleware, ordem de execução, campos que espelham a ordem de uma tabela.

**A exceção precisa estar visível.** Ao quebrar a ordem alfabética, deixe um comentário
curto dizendo o porquê. É um dos dois únicos comentários permitidos no repositório (ver §6).
Sem ele, um leitor — humano ou IA — assume descuido e "corrige" o que era intencional.

```ts
// ordem sequencial do funil
export enum ApplicationStage {
  RECEIVED,
  SCREENING,
  INTERVIEW,
  VISIT,
  APPROVED,
}
```

Nunca reordene parâmetros de função por alfabeto: a posição deles é semântica.

---

## 2. Imports

**Todo import é feito por alias.** Caminhos relativos (`./`, `../`) são proibidos.

```ts
// ❌
import { AnimalRepository } from "../../repositories/animal-repository";
import { Badge } from "./badge";

// ✅
import { AnimalRepository } from "@/animals/repositories/animal-repository";
import { Badge } from "@/components/animal-card/badge";
```

### Ordem dos imports

Grupos separados por linha em branco, nesta ordem. Dentro de cada grupo, **alfabética**.

```ts
import { Injectable } from "@nestjs/common";
import { z } from "zod";

import { AnimalRepository } from "@/animals/repositories/animal-repository";
import { CaseService } from "@/cases/case-service";

import type { Animal } from "@/animals/animal-types";
```

Grupo 1 externos, grupo 2 alias interno, grupo 3 type-only. Os grupos têm ordem semântica;
só o conteúdo de cada um é alfabético.

Imports com efeito colateral (`import '@/styles/global.css'`) ficam no topo do arquivo e não
entram na ordenação.

---

## 3. Nomenclatura de arquivos e pastas

**Todo arquivo e toda pasta em `kebab-case`.** Sem exceção — sem `camelCase`, sem
`PascalCase`, sem `snake_case`.

```
❌  AnimalCard.tsx        useAnimalList.ts       animal_repository.ts
✅  animal-card/          use-animal-list/       animal-repository.ts
```

O nome do arquivo é independente do nome do símbolo exportado. Uma classe `AnimalRepository`
mora em `animal-repository.ts`.

---

## 4. Estrutura de componentes React (Next.js)

Componentes, hooks e contexts moram **cada um em sua própria pasta**, com o código em
`index`:

```
animal-card/index.tsx        →  componente
use-animal-list/index.ts     →  hook       (.ts, sem JSX)
animal-context/index.tsx     →  context
```

### Um componente React por arquivo

Sem exceção. Se um componente precisa de sub-componentes, cada um vai para uma subpasta
dentro da pasta do componente pai:

```
animal-card/
├─ index.tsx              ← AnimalCard
├─ badge/
│  └─ index.tsx           ← Badge
└─ footer/
   └─ index.tsx           ← Footer
```

A hierarquia de pastas espelha a hierarquia de composição. Um sub-componente usado por mais
de um pai não é sub-componente — sobe para o nível compartilhado.

Arquivos auxiliares (tipos, constantes, testes) podem conviver na pasta do componente:

```
animal-card/
├─ index.tsx
├─ animal-card-types.ts
└─ index.test.tsx
```

---

## 5. TypeScript

TypeScript é obrigatório. Arquivos `.js`/`.jsx` não entram no repositório.

**`any` é proibido.** Isso inclui `any` explícito, `as any`, `any[]`, `Record<string, any>`
e genéricos com default `any`.

```ts
// ❌
function parse(payload: any) { ... }
const data = response as any;

// ✅
function parse(payload: unknown) { ... }
const data = animalSchema.parse(response);
```

Quando o tipo é genuinamente desconhecido, use `unknown` e estreite antes de usar.

`@ts-ignore` é proibido. `@ts-expect-error` é permitido apenas com justificativa na linha
anterior — o segundo dos dois comentários permitidos (ver §6).

---

## 6. Comentários

**Comentário no código é proibido.** Nenhum comentário explicando o que o código faz, como
faz ou por que existe. Isso inclui comentários de bloco, de linha, JSDoc/TSDoc, cabeçalhos
de arquivo, separadores visuais, `TODO`, `FIXME` e código comentado.

```ts
// ❌
// busca o animal pelo id e lança se não existir
async function findAnimal(id: string): Promise<Animal> { ... }

// ❌
const days = 30; // dias até arquivar

// ✅
async function findAnimal(id: string): Promise<Animal> { ... }

// ✅
const DAYS_UNTIL_ARCHIVE = 30;
```

Quando surgir a vontade de comentar, o comentário é o sintoma — o código não está claro.
Renomeie a variável, extraia a função, dê nome à constante. O nome sobrevive ao refactor; o
comentário não.

### Os dois únicos comentários permitidos

Esta lista é exaustiva. Ambos existem porque marcam uma decisão que o código não consegue
expressar sozinho:

1. **Justificativa de quebra da ordem alfabética** (§1).
2. **Justificativa de `@ts-expect-error`** (§5).

Diretivas de ferramenta (`eslint-disable`, `@ts-expect-error`) não contam como comentário,
mas a justificativa que as acompanha é obrigatória.

Documentação vai para arquivos `.md`, não para dentro do código.

---

## 7. Pare quando faltar documentação

O repositório deve conter uma skill para cada biblioteca ou framework relevante que ele usa.

**Antes de escrever código com uma lib ou framework, verifique se existe skill para ela.**

- **Existe skill?** Carregue e siga.
- **Não existe?** **Pare.** Não escreva de memória. Peça ao usuário para instalar a skill
  correspondente ou fornecer a documentação da versão em uso.

O motivo é concreto: API escrita de memória tende a refletir uma versão antiga da lib, e o
erro só aparece em runtime. Uma pergunta custa segundos; uma API inventada custa uma sessão
de debug.

Vale também quando a skill existe mas não cobre o que você precisa fazer. Pergunte.

---

## 8. Domínio

O modelo de domínio e as regras de negócio estão em `docs/domain.md`. Código que toca
entidades do domínio (animal, case, pipeline, candidatura, organização) deve estar de acordo
com ele.

Se o código exigido contradiz uma regra do domínio, **não invente a solução**: aponte a
contradição ao usuário.

---

## Checklist final

Antes de reportar qualquer alteração como concluída:

- [ ] Imports agrupados (externo → alias → tipos) e alfabéticos dentro do grupo
- [ ] Nenhum import relativo (`./`, `../`) — todos por alias
- [ ] Listas sem ordem semântica estão em ordem alfabética
- [ ] Toda quebra de ordem alfabética tem comentário justificando
- [ ] Arquivos e pastas em `kebab-case`
- [ ] Componentes, hooks e contexts em `nome/index.tsx`
- [ ] Um único componente React por arquivo
- [ ] Sub-componentes em subpastas do componente pai
- [ ] Zero ocorrências de `any` e de `@ts-ignore`
- [ ] Nenhum comentário além dos dois permitidos em §6
- [ ] Bibliotecas usadas têm skill no repositório — ou o usuário foi consultado
- [ ] Nada contradiz `docs/domain.md`
