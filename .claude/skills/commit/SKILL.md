---
name: commit
description: Cria branch a partir de main, commita as alterações em Conventional Commits, faz push e devolve uma sugestão de título e descrição de PR. Use quando o usuário pedir para commitar, salvar alterações, subir mudanças, criar branch ou preparar um PR. Nunca abre o PR — isso é do humano.
---

# Commit

Fluxo fixo, sempre nesta ordem:

```
branch a partir da main  →  commit(s)  →  push  →  sugestão de PR
```

**Você nunca abre o PR.** Abrir é decisão do humano. Sua entrega termina na sugestão de
título e descrição.

---

## 1. Preparar a branch

Verifique onde está antes de qualquer coisa:

```bash
git status --short
git branch --show-current
```

**Se estiver em `main`** (ou `master`): crie a branch antes de commitar.

```bash
git fetch origin
git switch -c <tipo>/<descricao-kebab> origin/main
```

**Se já estiver numa branch de trabalho:** siga nela. Não crie outra e não troque de branch
com alterações pendentes.

Nome da branch: `<tipo>/<descricao-kebab>`, o tipo sendo o mesmo do commit principal.

```
feat/animal-lifecycle
fix/archive-returning-deleted
refactor/pipeline-stage-copy
```

## 2. Revisar e agrupar

Leia o que mudou antes de decidir a mensagem. Nunca commite às cegas.

```bash
git status --short
git diff
git diff --staged
```

**Um commit por mudança coerente.** Se o diff contém coisas independentes — uma feature e
uma correção sem relação, ou código e uma mudança de configuração isolada — faça commits
separados, adicionando os arquivos de cada um explicitamente.

Não use `git add .` sem antes olhar o que ele vai pegar. Arquivo inesperado no diff é motivo
para parar e perguntar, não para incluir.

## 3. Escrever a mensagem

Formato Conventional Commits:

```
<tipo>(<escopo>): <descrição>

<corpo opcional>
```

**Tipo** — obrigatório, um destes:

| Tipo       | Quando                                      |
| ---------- | ------------------------------------------- |
| `build`    | build, bundler, dependências                |
| `chore`    | manutenção sem efeito em código de produção |
| `ci`       | pipeline de integração contínua             |
| `docs`     | documentação                                |
| `feat`     | funcionalidade nova                         |
| `fix`      | correção de bug                             |
| `perf`     | performance                                 |
| `refactor` | reestruturação sem mudar comportamento      |
| `style`    | formatação, sem efeito em comportamento     |
| `test`     | testes                                      |

**Escopo** — obrigatório. A área tocada:

```
adopter        animal         application    auth
case           config         docs           kanban
marketplace    notification   organization   pipeline
```

Escopo novo é permitido quando nenhum destes serve. Use o nome do módulo, não do arquivo.

**Descrição** — em português, imperativa, minúscula, **sem ponto final**, até ~72 caracteres.

```
✅  feat(animal): adiciona status de ciclo de vida
✅  fix(application): impede encerramento de candidatura na adoção
✅  refactor(pipeline): copia estrutura da definição na abertura do case

❌  feat(animal): Adiciona status de ciclo de vida.
❌  feat: adiciona coisas
❌  fix(animal): consertado bug
```

**Corpo** — só quando o "porquê" não é óbvio pela descrição. Explique a motivação e o efeito,
nunca o passo a passo do diff (o diff já está ali).

Quando o commit toca regra de negócio do domínio, **cite o número** — é o que `CLAUDE.md`
determina:

```
fix(animal): despublica do marketplace ao fechar

Fechar um animal deixava ele visível na vitrine, gerando candidaturas para
animal já adotado. Regra 5.
```

**Breaking change:** `!` depois do escopo e rodapé `BREAKING CHANGE:` com a migração.

```
feat(pipeline)!: remove referência viva à definição

BREAKING CHANGE: cases existentes precisam de backfill das etapas copiadas.
```

## 4. Push

```bash
git push -u origin <branch>
```

Se o push for rejeitado, **pare e reporte**. Não resolva com force.

## 5. Sugestão de PR

Devolva ao usuário, como texto na resposta — sem criar nada, sem chamar `gh`:

```markdown
**Título:** <tipo>(<escopo>): <descrição>

**Descrição:**

## O que muda

[o que passa a acontecer, do ponto de vista de quem usa]

## Por quê

[o problema que motivou; contexto que o diff não mostra]

## Domínio

[regras de negócio tocadas, por número — ou "nenhuma"]

## Como testar

[passos concretos para verificar]

## Fora de escopo

[o que ficou deliberadamente de fora — ou omita a seção]
```

O título do PR segue o mesmo formato do commit. Se a branch tem vários commits, o título
descreve o conjunto, não o último commit.

Omita seções sem conteúdo real. Seção preenchida com texto genérico é pior que seção
ausente.

---

## Proibido

- **Abrir PR.** Nem por `gh pr create`, nem por qualquer outro caminho.
- **Commitar direto em `main` ou `master`.**
- **`--no-verify`.** O repositório usa hooks de commit; se um hook falha, o problema é o
  código, não o hook. Corrija e tente de novo.
- **`--force` / `--force-with-lease`** no push.
- **`git add .` sem revisar** o que entra.
- **Commitar segredo** — `.env`, chave, token, credencial. Se aparecer no diff, pare e avise.
- **Amend** de commit já enviado.
- **Reescrever histórico** (`reset --hard`, `rebase` interativo) sem pedido explícito.

## Pré-requisitos

O fluxo depende de três coisas. Se faltar alguma, **pare e avise** em vez de improvisar:

1. Branch `main` existente.
2. Ao menos um commit no repositório.
3. Remote `origin` configurado.
