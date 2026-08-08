# Vitest — escrever, rodar, mockar

## Escrever teste

`globals` está desligado — **importe as APIs de `vitest`** (grupo de externos):

```ts
import { describe, expect, it } from "vitest";

import { closeAnimal } from "@/domain/animal/close-animal";

describe("closeAnimal", () => {
  it("fecha o animal com um motivo válido (regra 6)", () => {
    const animal = closeAnimal(activeAnimal, "adopted");

    expect(animal.status).toBe("closed");
    expect(animal.closingReason).toBe("adopted");
  });

  it("recusa fechar sem motivo (regra 6)", () => {
    expect(() => closeAnimal(activeAnimal, null)).toThrow();
  });
});
```

`test` e `it` são a mesma função — o projeto usa **`it`** dentro de `describe`, lendo como
frase. A string do `it`/`describe` é a documentação do comportamento — escreva em
**português**, citando a regra do domínio pelo número; identificadores e nome de arquivo em
inglês.

### Opções do teste — mudaram na v4

As opções (`retry`, `timeout`, `skip`, `only`, `concurrent`) agora são o **2º argumento**:

```ts
it("caso lento", { retry: 2, timeout: 10_000 }, async () => {
  await expect(slowThing()).resolves.toBeDefined();
});
```

`it("nome", () => {}, { retry: 2 })` é a forma **v3** e foi removida.

### Assíncrono

```ts
await expect(promise).resolves.toEqual(value);
await expect(promise).rejects.toThrow(DomainError);
```

### Tabela de casos

`it.each` cobre variações sem repetir corpo — bom para os motivos de fechamento (regra 6):

```ts
it.each([
  ["adopted"],
  ["died"],
  ["lost"],
  ["returned_to_owner"],
  ["transferred"],
])("aceita o motivo de fechamento %s", (reason) => {
  expect(() => closeAnimal(activeAnimal, reason)).not.toThrow();
});
```

### Matchers mais usados

`toBe` (identidade), `toEqual` / `toStrictEqual` (estrutura), `toThrow`, `toContain`,
`toHaveLength`, `toMatchObject`, `toBeNull` / `toBeUndefined`, `toBeCloseTo`, `resolves` /
`rejects`. Lista completa em `/api/expect`.

### Onde o teste mora

Ao lado do módulo, mesmo nome + `.test.ts`, em `kebab-case`:

```
domain/animal/
├─ close-animal.ts
└─ close-animal.test.ts
```

Um arquivo por unidade sob teste. `describe` externo com o nome da unidade.

## Rodar

`vitest` sem argumento entra em **watch** no terminal interativo e roda uma vez em CI.
`vitest run` roda uma vez e sai sempre — é o determinístico.

Scripts do projeto: `test` (`vitest run`) e `test:watch` (`vitest`). Alvo do CAR-117:
`npm test` verde em < 1s.

- Um arquivo: `npx vitest run domain/animal/close-animal.test.ts`.
- Por nome: `npx vitest run -t "regra 6"`.
- No `lint-staged`, use `vitest related --run` — o `--run` garante que o processo termina.

Cobertura (`@vitest/coverage-v8`, `vitest run --coverage`) fica fora do CAR-117. O provider
(`v8` × `istanbul`) é decisão à parte — **pare e pergunte**.

## Mock, spy e tempo

A camada de domínio é pura por projeto — a maioria dos testes **não precisa de mock**: passe
as dependências como argumento. Quando precisar, é o objeto `vi`:

```ts
import { expect, it, vi } from "vitest";

it("notifica os não selecionados", () => {
  const notify = vi.fn();

  selectApplication(application, { notify });

  expect(notify).toHaveBeenCalledWith(losingApplicants);
});
```

`vi.spyOn(obj, "method")`, `vi.mock("@/modulo")` (hoisted para o topo), `vi.fn()`.

### Tempo — regra 7 (arquivar após N dias)

Prefira **injetar o instante** (`archiveIfDue(animal, { now })`) — fica pura e o teste não
precisa de timer. Quando o tempo é lido por dentro:

```ts
import { afterEach, beforeEach, expect, it, vi } from "vitest";

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-01-01T00:00:00Z"));
});

afterEach(() => {
  vi.useRealTimers();
});
```

**Mudou na v4:** `vi.restoreAllMocks()` não reseta mais automocks; `mock.invocationCallOrder`
começa em `1`; spy de construtor exige `function`/`class` (arrow falha). Confirme em
`/api/vi` antes de depender desses detalhes.

## Testar as 18 regras

`docs/domain.md` §10 é a fonte. Cada regra ganha teste isolado — não enterre uma regra dentro
do teste de CRUD.

- Invariante puro (regras 2, 6, 11, 12, 18) → função de domínio + teste direto.
- Regras transacionais (4, 5, 15) → a **decisão** é pura e testável aqui; a persistência é da
  skill `drizzle`. Teste o que a função decide, não o SQL.
- Regra 16 tem issue dedicada (CAR-152): a instância copia a definição e sobrevive à edição
  do molde — teste de regressão da genericidade do motor.
- Regra 7 (arquivar após N dias) → injete o `now`.

Ao concluir teste que toca entidade do domínio, rode o agent `domain-reviewer` antes de
reportar pronto.

## Mapa da documentação oficial

Prefixo: `https://vitest.dev`.

| Assunto                    | Caminho            |
| -------------------------- | ------------------ |
| Começando                  | `/guide/`          |
| CLI                        | `/guide/cli`       |
| Config — `defineConfig`    | `/config/`         |
| Cobertura                  | `/guide/coverage`  |
| `expect` (matchers)        | `/api/expect`      |
| Fake timers / `vi`         | `/api/vi`          |
| Migração v3 → v4           | `/guide/migration` |
| Mock de funções            | `/api/mock`        |
| `projects` (multi-config)  | `/guide/projects`  |
| Test API (`describe`/`it`) | `/api/`            |
