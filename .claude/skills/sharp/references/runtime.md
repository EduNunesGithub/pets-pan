# sharp em runtime — binário nativo, bundler e função serverless

## Não precisa de `serverExternalPackages`

`sharp` já está na lista padrão de pacotes externos do servidor do Next
(`node_modules/next/dist/lib/server-external-packages.jsonc`). **Não adicione ao
`next.config.ts`** — seria configuração morta.

Fora do Next, o pacote precisa ser marcado como externo no bundler:

| Bundler | Configuração                             |
| ------- | ---------------------------------------- |
| webpack | `externals: { sharp: "commonjs sharp" }` |
| esbuild | `external: ["sharp"]`                    |
| vite    | `build.rollupOptions.external`           |

## Binário por plataforma — a armadilha do lockfile

`sharp` não é JavaScript puro: são binários pré-compilados publicados como
`optionalDependencies` (`@img/sharp-<plataforma>`). Desenvolvemos no **Windows** e
implantamos em **Linux**, então o `package-lock.json` precisa carregar as duas famílias.

Por causa do [npm#4828](https://github.com/npm/cli/issues/4828), um lockfile gerado numa
plataforma pode não registrar os binários das outras — e o build na Vercel quebra com
`Could not load the "sharp" module using the linux-x64 runtime`.

**Verificação** (deve listar `linux-x64` **e** `win32-x64`):

```bash
grep -o '"node_modules/@img/sharp-[^"]*"' package-lock.json | sort -u
```

Se faltar plataforma, force a instalação dela:

```bash
npm install --cpu=x64 --os=linux --libc=glibc sharp
```

Garanta também que o gerenciador não esteja configurado para pular
`optionalDependencies` — sem elas não há binário nenhum.

## Memória e CPU em função serverless

O processamento é a parte cara do upload. O que importa:

- **CPU ativa é o que se cobra.** Diferente da espera por banco (I/O), `resize` e
  compressão webp são CPU pura e entram integralmente na conta. Redimensionar para variantes
  fixas e pequenas é economia direta.
- **`effort` do webp troca CPU por bytes.** O default `4` é o ponto de equilíbrio. Subir
  para `6` reduz pouco o arquivo e aumenta bem o tempo de CPU.
- **`sharp.cache()`** guarda 50 MB por padrão. Em função de vida curta o cache raramente é
  reaproveitado; se houver pressão de memória, `sharp.cache(false)` devolve esse teto.
- **`sharp.concurrency()`** usa todos os cores por padrão. Processar várias fotos em
  paralelo _e_ deixar cada uma usar todos os cores multiplica o pico de memória — se subir
  várias de uma vez, serialize ou reduza a concorrência.
- **Valide o tamanho antes de instanciar o `sharp`.** Recusar um arquivo de 50 MB custa zero
  se a recusa vem antes do decode; custa memória e CPU se vem depois.

## Ordem correta do fluxo de upload

1. Sessão e escopo de organização (`requireActiveOrganization()`).
2. Tamanho do arquivo dentro do limite — **antes** de qualquer decode.
3. `sharp(buffer).metadata()` confirma que é imagem e de formato aceito.
4. Pipeline: `autoOrient` → `resize` → `webp` → `toBuffer`.
5. `put` no Blob com `pathname` escopado.
6. Gravação no banco.
7. Em falha depois do passo 5, remover o blob órfão.

Os passos 5–7 são da skill `vercel-blob`.
