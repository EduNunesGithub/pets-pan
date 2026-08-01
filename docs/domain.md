# Domínio — Plataforma para ONGs de resgate animal

Documento de referência do domínio. Descreve **o que** o produto modela e **por que** cada
decisão foi tomada. Não trata de stack, framework ou implementação.

---

## 1. Visão

Plataforma all-in-one para ONGs que resgatam animais. A proposta de valor é que uma ONG
consiga operar inteiramente dentro da plataforma, sem depender de planilhas, grupos de
mensagem ou ferramentas avulsas.

O foco organizacional é a **ONG**, mas a entidade central do domínio é o **animal**. Tudo
gira em torno do ciclo que o animal percorre enquanto está sob os cuidados da organização.

Duas premissas guiam o desenho:

**Nenhum fluxo é hardcodado.** ONGs diferentes operam de formas diferentes. Não existe um
ciclo de vida fixo do tipo `resgatado → castrado → adotado`. As etapas de trabalho são
definidas por cada organização.

**Configurável na estrutura, opinativo no default.** Uma organização recém-criada já nasce
com fluxos de trabalho pré-definidos e funcionais. Ela não escolhe um template na criação —
recebe um conjunto padrão pronto e edita a partir dali. Uma plataforma que exige modelagem
de processo antes do primeiro uso é abandonada por voluntários.

---

## 2. Glossário

| Termo           | Significado                                                                       |
| --------------- | --------------------------------------------------------------------------------- |
| **Organização** | A ONG. É o workspace: fronteira de dados, membros e configuração.                 |
| **Animal**      | Entidade central. Pertence a uma organização.                                     |
| **Case**        | Unidade de trabalho sobre um animal (resgate, tratamento, adoção…). Configurável. |
| **Etapa**       | Fase de um case. É a coluna do Kanban.                                            |
| **Tarefa**      | Item de trabalho dentro de uma etapa. Checklist.                                  |
| **Candidatura** | Manifestação de interesse de uma pessoa em adotar um animal.                      |
| **Adotante**    | Usuário público do marketplace. Existe fora do escopo de qualquer organização.    |
| **Pipeline**    | O motor genérico de etapas e tarefas. Serve cases e candidaturas.                 |

---

## 3. Motor de pipeline

O coração do produto. É um motor genérico de fluxo de trabalho — etapas ordenadas contendo
tarefas — que se aplica a mais de um tipo de sujeito.

Hoje existem dois sujeitos:

- **Case**, cujo sujeito é o animal.
- **Candidatura**, cujo sujeito é a dupla animal + adotante.

Ambos são configuráveis pela organização e usam a mesma mecânica. A candidatura **não é um
case** — vive numa área própria, com board própria — mas roda sobre o mesmo motor.

> **Decisão.** Um único motor, dois sujeitos. Construir dois sistemas de fluxo paralelos
> duplicaria configuração, UI de Kanban e regras de avanço. Além disso, um motor que serve
> só a um sujeito não é genérico — é um fluxo hardcodado com nome bonito.

### 3.1 Definição e instância

O motor tem dois níveis, e a distinção é essencial:

**Definição** (o modelo) — configurada pela organização.

```
PipelineDefinition
├─ nome, tipo de sujeito
└─ StageDefinition ×N   (ordenadas)
   └─ TaskDefinition ×N
```

**Instância** (a execução) — criada a partir da definição.

```
Case / Candidatura
├─ referência ao sujeito
├─ etapa atual
└─ Stage ×N   (cópia da definição no momento da abertura)
   └─ Task ×N (com estado de conclusão)
```

> **Decisão.** A instanciação **copia** a estrutura da definição; não referencia. Se a
> organização editar um fluxo, os cases já em andamento não podem mudar debaixo de quem
> está trabalhando neles. Um voluntário não pode abrir o Kanban e encontrar etapas que não
> existiam ontem, ou tarefas concluídas que desapareceram. A definição é um molde, não uma
> fonte viva.

### 3.2 Kanban

Cada definição de pipeline gera uma board. As colunas são as etapas; os cards são as
instâncias. Mover um card entre colunas é o avanço de etapa.

---

## 4. Animal

Pertence a uma organização e é cadastrado manualmente por ela. Não existe fluxo de entrada
separado — resgate, doação e entrega voluntária são apenas tipos de case que rodam depois
do cadastro.

### 4.1 Face pública e face interna

O animal tem dois conjuntos de dados:

- **Público** — o que aparece no marketplace: nome, foto, espécie, porte, idade aproximada,
  temperamento, descrição, localização da ONG.
- **Interno** — o que só a organização vê: histórico operacional, cases, anotações.

A separação é de modelagem, não de interface. Nenhum dado interno trafega para o
marketplace; a face pública é um subconjunto explícito de campos.

### 4.2 Publicação

A visibilidade no marketplace é um controle **manual** da organização. O animal entra e sai
da vitrine quando a ONG decide.

Exceção: **fechar um animal o despublica automaticamente.** A organização mantém o controle
da publicação, mas o sistema impede o estado incoerente de um animal já adotado continuar
recebendo candidaturas — o que gera frustração no adotante e triagem inútil para a ONG.

### 4.3 Ciclo de vida

Independente dos cases, o animal tem um status de ciclo de vida que pertence à plataforma e
**não é configurável**:

```
Ativo  ──→  Fechado (com motivo)  ──→  Arquivado (após N dias fechado)
```

Motivos de fechamento (fixos): `Adotado`, `Óbito`, `Transferido`, `Perdido`,
`Devolvido ao tutor`.

> **Decisão.** "Fechado" não é um case. Um case é uma unidade de trabalho com etapas e
> tarefas; "fechado" não tem trabalho dentro, não avança e não tem checklist. Modelá-lo
> como case criaria uma entidade que existe só para não se comportar como as outras, e todo
> percurso de cases no sistema precisaria tratar a exceção.
>
> Há um segundo motivo, mais importante: como o status é da plataforma e os motivos são
> fixos, eles são **comparáveis entre organizações**. Isso dá métrica real de graça — taxa
> de adoção, tempo médio até adoção, mortalidade. Se "fechado" fosse configurável, cada ONG
> nomearia à sua maneira e nenhuma métrica agregada existiria.

**Arquivamento** é reversível e nunca destrutivo. Animal arquivado sai das boards e das
listas operacionais e passa a somente-leitura, mas mantém o histórico completo e pode
retornar à operação — devolução de animal adotado acontece. Animais arquivados continuam
contando nas métricas históricas da organização.

`N` tem um default de plataforma. Não é configurável por organização no MVP.

---

## 5. Cases

Um case é a unidade de trabalho sobre um animal. Os tipos são definidos pela organização —
resgate, tratamento, castração, adoção, lar temporário, o que fizer sentido para ela.

Cases **pertencem ao animal**. Um animal acumula cases ao longo do tempo, e esse histórico
é a sua trajetória dentro da ONG.

**Regra: um animal tem no máximo um case ativo por vez.**

> **Decisão.** A exclusividade é uma **regra de negócio**, não uma restrição de schema. A
> relação é `Animal 1:N Case`. O caso real que vai aparecer é o animal em tratamento que a
> ONG já quer expor para adoção. Com a exclusividade no modelo, relaxar depois é migração
> de dados; com ela na regra, é uma linha de validação.

Fechar um animal encerra seu case ativo. Status de ciclo de vida e cases são camadas
diferentes, não conceitos concorrentes.

---

## 6. Adoção

### 6.1 Candidatura e case são coisas diferentes

O funil de adoção é **por pessoa**; o Kanban de cases é **por animal**. Confundir os dois
quebra o modelo de duas maneiras:

- Abrir um case por interessado viola a regra de um case ativo por animal.
- Abrir um case e pendurar vários interessados nele deixa o card parado numa coluna
  enquanto a ONG entrevista pessoas em estágios diferentes.

Por isso, duas entidades:

**Candidatura** — N por animal. Vive em área própria, com board própria, funil configurável
pela organização. Todo interessado que clica em "quero adotar" no marketplace entra no
funil. A ONG move cada candidato manualmente entre as etapas.

**Case de adoção** — case normal do animal, sujeito à regra de um ativo por vez. Abre
quando a organização **seleciona** uma candidatura, e segue as etapas configuradas pela ONG
até a entrega.

O que esse desenho resolve:

- Cinquenta interessados no mesmo animal geram cinquenta candidaturas e nenhum conflito.
- A ONG tria antes de comprometer o animal — que é o que ela faz na prática.
- Adoção que não vinga: o case é cancelado, o animal volta a ativo, e as candidaturas
  seguem exatamente onde estavam.

### 6.2 Candidaturas após a adoção

Quando o animal é adotado, as candidaturas **permanecem nas etapas em que estavam**. Não
são recusadas nem encerradas. Se o animal retornar, a organização continua de onde parou.

Consequência operacional: a board de candidaturas contém cards de animais indisponíveis. A
candidatura carrega o estado do animal como indicador visual, e a board filtra por padrão
as de animais fechados — sem apagar nada, apenas fora do caminho. Voltam se o animal
voltar.

Os candidatos não selecionados recebem **notificação** informando que a organização
encontrou um lar para o animal.

### 6.3 Propriedade da candidatura

A candidatura é criada por um usuário público, mas **pertence ao workspace da organização**
dona do animal — é a ONG que tria, e é o funil dela que a candidatura percorre.

---

## 7. Marketplace

Catálogo público e único de animais disponíveis para adoção, atravessando todas as
organizações. Visitantes buscam e filtram animais; cada animal tem sua página pública e um
caminho para se candidatar.

> **Decisão.** Catálogo único, não uma vitrine isolada por ONG. Um site institucional por
> organização não tem efeito de rede; um catálogo compartilhado aumenta a exposição de todo
> animal cadastrado, que é o interesse de toda ONG na plataforma.

O marketplace é público e não autenticado para navegação. Autenticação só é exigida no
momento de se candidatar.

---

## 8. Identidade e permissões

Existem duas populações de usuário com naturezas distintas:

- **Membros de organização** — escopados a um workspace, com papel definido.
- **Adotantes** — globais, atravessam organizações, interagem apenas pelo marketplace.

Uma mesma pessoa pode ser as duas coisas (um voluntário que adota um animal de outra ONG).

**Papéis são fixos, definidos no código.** Organizações não configuram permissões. É
deliberadamente menos flexível: reduz superfície de teste, elimina uma tela inteira de
configuração e evita que uma ONG se tranque para fora do próprio workspace.

### 8.1 Papéis de membro

Dois papéis, e só dois:

- **Admin** — governa o workspace. Faz tudo que o voluntário faz e, além disso, gerencia
  membros (convida, remove, muda papel), configura a organização e configura os pipelines e
  os tipos de case.
- **Voluntário** — opera. Cadastra e edita animais e suas fotos, controla a publicação no
  marketplace, fecha e arquiva animais, abre, encerra e cancela cases, move cards no Kanban,
  conclui e reabre tarefas, tria candidaturas e seleciona a que abre o case de adoção. Não
  toca em membros nem em nenhuma configuração.

A linha que separa os dois é **governar o workspace × operá-lo**. Toda ação de configuração —
membros, dados da organização, definição de pipelines e tipos de case — é do Admin; toda a
operação do dia a dia é dos dois.

| Ação                                               | Admin | Voluntário |
| -------------------------------------------------- | ----- | ---------- |
| Gerenciar membros (convidar, remover, mudar papel) | sim   | não        |
| Configurar a organização                           | sim   | não        |
| Configurar pipelines e tipos de case               | sim   | não        |
| Cadastrar e editar animal e fotos                  | sim   | sim        |
| Publicar e despublicar no marketplace              | sim   | sim        |
| Fechar, arquivar e reverter arquivamento           | sim   | sim        |
| Abrir, encerrar e cancelar case                    | sim   | sim        |
| Mover case no Kanban (avançar/retroceder etapa)    | sim   | sim        |
| Concluir e reabrir tarefas                         | sim   | sim        |
| Triar e selecionar candidatura                     | sim   | sim        |
| Ver dados internos                                 | sim   | sim        |

> **Decisão.** Dois papéis, não mais. Papéis intermediários — um coordenador que configura
> fluxos mas não gerencia membros, um observador só-leitura — multiplicam a matriz de
> permissões e a superfície de teste sem resolver uma necessidade do MVP. Entram se e quando
> um caso real pedir: adicionar flexibilidade depois é barato, tirar é caro.

**Criação e trava de acesso.** O criador da organização nasce Admin. Uma organização tem
sempre ao menos um Admin — o sistema recusa remover ou rebaixar o último. É o que impede uma
ONG de se trancar para fora do próprio workspace.

---

## 9. Notificações

O primeiro ponto em que a plataforma se comunica para fora dela. No MVP existe pelo menos
um gatilho obrigatório: informar aos candidatos não selecionados que o animal encontrou um
lar.

Canais: e-mail transacional e notificação in-app para adotantes com conta.

---

## 10. Regras de negócio

1. Todo animal pertence a exatamente uma organização.
2. Um animal tem no máximo um case ativo por vez. _(regra, não schema)_
3. Cases pertencem ao animal e formam seu histórico permanente.
4. Fechar um animal encerra seu case ativo.
5. Fechar um animal o despublica do marketplace automaticamente.
6. Fechamento exige um motivo, escolhido entre valores fixos.
7. Animal fechado é arquivado automaticamente após `N` dias.
8. Arquivamento é reversível e nunca apaga dados.
9. A publicação no marketplace é controle manual da organização.
10. Só animais publicados e ativos aparecem no marketplace.
11. Uma candidatura referencia um animal e um adotante, e pertence à organização do animal.
12. Um adotante tem no máximo uma candidatura ativa por animal.
13. Candidaturas não são encerradas quando o animal é adotado.
14. Um case de adoção só abre a partir de uma candidatura selecionada.
15. Instâncias de pipeline copiam a estrutura da definição no momento da abertura.
16. Editar uma definição de pipeline não afeta instâncias existentes.
17. Uma organização nasce com pipelines pré-definidos e funcionais.

---

## 11. Sequenciamento

O MVP é entregue em duas fatias.

**Fatia 1 — operação interna.** Organização, membros, cadastro de animal, ciclo de vida,
motor de pipeline, cases e Kanban.

**Fatia 2 — face pública.** Marketplace, adotante, candidatura e seu funil, publicação e
notificações.

> A ordem não é arbitrária. O motor de pipeline é o coração do produto, e a candidatura é o
> **segundo** sujeito a passar por ele. Construir a fatia 1 primeiro e só então plugar a
> candidatura é o que prova que o motor é genérico de verdade — e se não for, a descoberta
> acontece cedo o bastante para ser barata. Uma ONG já consegue operar com a fatia 1
> sozinha, cadastrando candidaturas manualmente se precisar.

---

## 12. Em aberto

- Valor default de `N` dias para arquivamento.
- Campos exatos da face pública do animal.
- Conteúdo dos pipelines pré-definidos que uma organização recebe ao nascer.
