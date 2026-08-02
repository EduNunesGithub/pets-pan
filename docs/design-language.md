# Linguagem de design — Ficha viva

Régua visual do produto. O que decidimos, por quê, e como aplicar. Vale para toda UI nova.
Convive com `write-code` (convenções de código) e `docs/domain.md` (modelo de domínio).

---

## 1. A ideia — Ficha viva

Todo abrigo tem a **ficha de baia**: o cartão preso na porta do canil com nome, entrada,
status, foto. É o ancestral físico da ficha do animal — e é a nossa assinatura. O **mesmo
card viaja**: no workspace mostra a face interna; no marketplace, o subconjunto público
(domínio §4.1). Um objeto une as duas salas.

O registro certo é **calor com os pés no chão** — um bom consultório veterinário: limpo,
competente, sem pressa, gentil. Nunca fofinho (o produto lida com `Óbito`), nunca corporativo
frio (o produto é sobre compaixão).

**Estilo:** minimalismo funcional e quente, com materialidade de arquivo. Flat e disciplinado;
aquecido por papel, tinta, cartão e a aba da ficha. Sem vidro, sem sépia, sem skeuomorfismo,
sem estética "startup pet" (pastel, patinha, bolha).

### Duas salas, uma família

- **Workspace** (operação interna) — sóbrio, denso, calmo. Onde o voluntário passa horas.
- **Marketplace** (face pública) — mais caloroso, fotografia como protagonista.
- **Espinha compartilhada:** o card do animal, sempre o mesmo, aparecendo nos dois mundos.

Em reserva para o marketplace: o acento **honey** e o display **Fraunces**. Não usar no
workspace nem na auth.

---

## 2. Tokens

Tudo é token no `@theme` de `app/globals.css` (Tailwind v4 — sem `tailwind.config`). Nada de
valor mágico solto no markup.

### Cor (`--color-*`)

| Token             | Hex       | Uso                                           |
| ----------------- | --------- | --------------------------------------------- |
| `ink`             | `#23201b` | texto (contraste ~13:1)                       |
| `muted`           | `#574f3f` | texto secundário, rótulos (contraste ~7:1)    |
| `paper`           | `#f5f1e8` | fundo do workspace                            |
| `card`            | `#fbf9f3` | superfície elevada (a ficha)                  |
| `line`            | `#ded8c9` | hairlines, molduras                           |
| `pine`            | `#2f5d50` | primária: ações, links, cuidado               |
| `pine-strong`     | `#264b40` | hover da primária                             |
| `honey`           | `#d99a4e` | acento — **reservado ao marketplace**         |
| `danger`          | `#9e3b2e` | erro (tijolo digno, nunca vermelho de alarme) |
| `status-active`   | `#2f5d50` | ciclo de vida: ativo                          |
| `status-closed`   | `#5a5a63` | ciclo de vida: fechado (grafite, não alarme)  |
| `status-archived` | `#9a9384` | ciclo de vida: arquivado (dessaturado)        |

Status é **conteúdo, não enfeite** — o produto rastreia status, então as cores são
semânticas. `Óbito` e afins nunca gritam.

### Tipografia

- **Fontes:** `--font-sans` (IBM Plex Sans) no dia a dia; `--font-mono` (IBM Plex Mono) em
  dado/metadado da ficha (datas, IDs, rótulos). `Fraunces` fica reservado ao marketplace.
- **Tamanho:** sempre token nativo do Tailwind (`text-xs`, `text-sm`, `text-base`,
  `text-2xl`…). **Nunca** valor custom (`text-[13px]`).
- **Line-height:** não definir. O token de tamanho já carrega o dele — sem `leading-*`.
- **Letter-spacing:** hierarquia com tokens nativos, três níveis:
  - `tracking-tight` — títulos
  - normal (default) — corpo
  - `tracking-widest` — rótulos em caixa-alta mono

### Espaçamento (`--spacing-*`) — hierarquia

Escala nomeada por **nível**, na grade de 4px. Gaps, paddings e offsets saem daqui.

| Token     | rem       | px  | Papel                                                |
| --------- | --------- | --- | ---------------------------------------------------- |
| `pair`    | `0.25rem` | 4   | par acoplado (rótulo ↔ input)                        |
| `snug`    | `0.5rem`  | 8   | inset pequeno (padding vertical de alerta)           |
| `inset`   | `0.75rem` | 12  | inset (padding de elementos pequenos, offset da aba) |
| `item`    | `1rem`    | 16  | entre itens (campo ↔ campo), padding de controle     |
| `section` | `1.25rem` | 20  | entre seções do card                                 |
| `block`   | `1.5rem`  | 24  | entre blocos, padding do card, página ↔ card         |
| `wide`    | `2rem`    | 32  | offset largo                                         |
| `control` | `2.25rem` | 36  | **altura fixa** de controles (input, botão)          |
| `frame`   | `4rem`    | 64  | moldura da página (padding vertical)                 |

> **Armadilha do Tailwind v4 (não reverter).** As utilidades de largura (`w-*`, `max-w-*`,
> `min-w-*`) leem o **mesmo namespace** `--spacing-*` que gaps/paddings. Se um token de
> espaçamento usasse um nome da escala t-shirt (`sm`, `md`, `lg`, `xl`…), ele sequestraria
> `max-w-sm` e afins — foi o que quebrou o layout uma vez (`max-w-sm` virou `0.75rem`). Por
> isso a escala usa nomes de **nível** (`pair`, `snug`, `inset`…), fora da escala t-shirt.

### Elevação e foco (`--shadow-*`)

- `shadow-card` — elevação baixa e quente da ficha.
- `shadow-field-focus` — sublinhado pine no foco do campo (inset, sem deslocar layout).

---

## 3. Layout

- **Grade de 4px.** Todo espaçamento vem de um token de espaçamento.
- **Dirigido por gap. Zero margens.** Nada de `m-*`/`mt-*`/`mb-*`. Para separar seções,
  agrupe num bloco próprio e use o `gap` do container.
- **Ritmo aninhado e decrescente:** `pair` (4) dentro do campo · `item` (16) entre campos ·
  `section` (20) entre seções do card · `block` (24) entre blocos e no padding do card ·
  `frame` (64) na moldura da página.
- **Controles com altura fixa** (`h-control`), sem padding vertical.
- **Raio pequeno** (`rounded-md`/`rounded-sm`) — cartão de arquivo, não bolha.

---

## 4. Ordem das classes Tailwind

`alfabéticas E agrupadas`, espelhando o agrupamento de imports do `write-code`:

1. **Base** (sem prefixo), em ordem alfabética pela **string literal** da classe. Classes
   negativas (com `-`) caem no início.
2. **Variantes** depois, agrupadas por prefixo em ordem alfabética (`disabled` → `focus` →
   `hover` → breakpoints), alfabético dentro de cada grupo.

```
bg-pine flex font-medium h-control items-center justify-center px-item rounded-md
text-paper text-sm transition-colors w-full
disabled:cursor-not-allowed disabled:opacity-60 hover:bg-pine-strong
```

---

## 5. Primitivos

- **`components/auth-card`** — a casca da ficha: papel, marca, o card com a **aba de arquivo**
  (o kicker), título.
- **`components/text-field`** — o campo pautado: rótulo mono em caixa-alta + input só com
  linha de base (sublinhado), altura fixa.

Um primitivo usado por mais de um pai sobe para `components/` (regra do `write-code`).

---

## 6. Voz

- Sentence case, voz ativa. O nome da ação é constante no fluxo (`Publicar` → toast
  `Publicado`).
- Erro é direto e não pede desculpa; digno, nunca alarme.
- Estado vazio convida a agir.
- Registro pesado (`Óbito`, `Devolvido ao tutor`) é dito com clareza e respeito, jamais
  animadinho.

---

## 7. Em aberto

- **Nome do produto** — o wordmark `pet · monorepo` é placeholder até haver marca.
- **Fraunces e honey** entram com o marketplace.
- **Dark mode** — não decidido; a identidade é papel/tinta (clara) por ora.
