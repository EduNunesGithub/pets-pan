---
name: sharp
description: sharp — processamento de imagem no servidor. Use antes de escrever ou alterar qualquer coisa que redimensione, converta, comprima ou inspecione imagem — pipeline de upload de foto, geração de variante, leitura de dimensão/formato. NÃO é necessária para exibir imagem já processada. Gatilhos: `sharp(`, `.resize`, `.webp`, `.toBuffer`, `.metadata`, redimensionar, converter, comprimir, thumbnail, EXIF, webp.
---

# sharp — processamento de imagem no servidor

Versão de referência: **`sharp@0.35.3`**. Documentação consultada em 2026-08-12.
Import: `import sharp from "sharp"`. Só roda em Node — **nunca** em Client Component.

## Referências desta skill

| Preciso de                                           | Leia                    |
| ---------------------------------------------------- | ----------------------- |
| Construtor, `resize`, formatos de saída, `metadata`  | `references/api.md`     |
| Deploy, binário nativo, memória em função serverless | `references/runtime.md` |

Se nada disso cobrir, **não escreva de memória** — https://sharp.pixelplumbing.com tem a
referência por método.

## O pipeline canônico do projeto

Toda imagem que entra passa por aqui. Nenhuma exceção.

```ts
const pipeline = sharp(buffer, {
  failOn: "error",
  limitInputPixels: 268_402_689,
})
  .autoOrient()
  .resize(width, height, { fit: "cover", withoutEnlargement: true })
  .webp({ quality: 75 });

const { data, info } = await pipeline.toBuffer({ resolveWithObject: true });
```

Cada pedaço está aí por um motivo:

- **`autoOrient()`** — foto de celular carrega orientação no EXIF. Sem isso, o `resize`
  trabalha sobre os pixels crus e a imagem sai deitada. É o bug número um de upload de foto,
  e ele só aparece com foto real, nunca com o PNG de teste.
- **`failOn: "error"`** — o default é `"warning"`, que rejeita foto levemente malformada que
  todo navegador abre sem reclamar. `"error"` recusa o que é de fato inválido e aceita o
  resto. Nunca use `"none"`: aí entra lixo.
- **`limitInputPixels`** — o default (~268 megapixels) é proteção contra _decompression
  bomb_: arquivo de 2 KB que vira 50 GB em memória. **Nunca desligue** com `false` para
  entrada de usuário.
- **`fit: "cover"`** — é o default, mas explícito porque a alternativa importa: `cover`
  corta para preencher a dimensão exata, `inside` cabe dentro sem cortar e deixa a proporção
  variar. As duas variantes do projeto usam `cover` — proporção fixa é o que estabiliza a
  grade.
- **`withoutEnlargement: true`** — sem isso, foto pequena é esticada e fica borrada.
- **`.webp({ quality: 75 })`** — decisão do projeto. O default da lib é `80`.

## Decisões fixas do projeto

- **webp, sempre, qualidade 75.** Não guardamos o original. Não negociamos formato por
  upload.
- **Dimensões fixas por variante** — o cliente nunca escolhe tamanho. As variantes vivem em
  `domain/animal/photo.ts`, constante única, nunca espalhadas por chamada:

  | Variante | Saída       | Tamanho no design | `fit`   | Onde              |
  | -------- | ----------- | ----------------- | ------- | ----------------- |
  | `card`   | 640 × 480   | 320 × 240         | `cover` | grade do catálogo |
  | `full`   | 1600 × 1200 | 800 × 600         | `cover` | detalhe do animal |

  São **2× o tamanho de exibição**, para tela retina. Ambas em 4:3 e com `cover`: proporção
  única mantém a grade estável e elimina layout shift. O preço é corte em foto muito
  vertical — aceito, porque grade com proporção variável é pior.

- **`sharp` roda em Server Action ou route handler**, nunca no cliente e nunca dentro de
  `domain/`: é I/O e binário nativo, não regra de negócio. O que o domínio conhece é a URL
  resultante.
- **Metadado é descartado por padrão — e isso é proposital.** Sem `keepMetadata()`/
  `keepExif()`, o EXIF morre no processamento, e junto vai a **geolocalização**. Foto de
  resgate carrega o endereço de quem resgatou. Nunca chame `keepMetadata()` em foto pública.
- **Validar formato real com `metadata()`, não com o `content-type` do upload.** O header
  vem do browser e é falsificável.

## Armadilhas

| Armadilha                                    | O que acontece                                                                   |
| -------------------------------------------- | -------------------------------------------------------------------------------- |
| Esquecer `autoOrient()`                      | Foto de celular sai girada 90°; só reproduz com foto real                        |
| Confiar no `content-type` do arquivo enviado | `.exe` renomeado para `.jpg` chega ao pipeline                                   |
| `limitInputPixels: false`                    | Decompression bomb derruba a função por OOM                                      |
| `failOn: "warning"` (default)                | Recusa foto boa de celular                                                       |
| Reusar a mesma instância `sharp` duas vezes  | Uma instância = uma saída; para duas variantes use `.clone()` ou duas instâncias |
| `keepMetadata()` em foto pública             | Vaza GPS do EXIF                                                                 |
| Chamar `sharp` em Client Component           | Quebra no build — é binário nativo de Node                                       |
| Processar antes de validar tamanho           | Arquivo gigante consome CPU e memória antes de ser recusado                      |

## Duas variantes a partir de um buffer

Uma instância produz **uma** saída. Para duas variantes, `clone()`:

```ts
import { photoQuality, photoVariants } from "@/domain/animal/photo";

const source = sharp(buffer, { failOn: "error" }).autoOrient();

const [card, full] = await Promise.all(
  [photoVariants.card, photoVariants.full].map((variant) =>
    source
      .clone()
      .resize(variant.width, variant.height, {
        fit: "cover",
        withoutEnlargement: true,
      })
      .webp({ quality: photoQuality })
      .toBuffer({ resolveWithObject: true }),
  ),
);
```

## Checklist

- [ ] `autoOrient()` no pipeline
- [ ] `failOn: "error"` e `limitInputPixels` no default
- [ ] Tamanho do arquivo validado **antes** de instanciar o `sharp`
- [ ] Formato conferido por `metadata()`, não pelo `content-type`
- [ ] Saída em webp q75, dimensão vinda de constante
- [ ] Nenhum `keepMetadata()`/`keepExif()` em imagem que vai a público
- [ ] Chamada em código server-side; nada de `sharp` em `domain/` ou no cliente
