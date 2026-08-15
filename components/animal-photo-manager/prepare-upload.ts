import { maxUploadBytes } from "@/domain/animal/photo";

const encodeQualitySteps = [0.85, 0.75, 0.6];

const maxClientEdge = 2400;

async function canvasToFile(
  canvas: HTMLCanvasElement,
  name: string,
): Promise<File | undefined> {
  for (const quality of encodeQualitySteps) {
    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob((result) => resolve(result), "image/webp", quality);
    });

    if (blob && blob.size <= maxUploadBytes) {
      return new File([blob], `${name}.webp`, { type: "image/webp" });
    }
  }

  return undefined;
}

function drawScaled(image: HTMLImageElement): HTMLCanvasElement {
  const longestEdge = Math.max(image.width, image.height);
  const scale = longestEdge > maxClientEdge ? maxClientEdge / longestEdge : 1;

  const canvas = document.createElement("canvas");
  canvas.width = Math.round(image.width * scale);
  canvas.height = Math.round(image.height * scale);

  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("Não foi possível processar a imagem neste navegador.");
  }

  context.drawImage(image, 0, 0, canvas.width, canvas.height);

  return canvas;
}

async function loadImage(file: File): Promise<HTMLImageElement> {
  const url = URL.createObjectURL(file);

  try {
    return await new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error("Imagem inválida."));
      image.src = url;
    });
  } finally {
    URL.revokeObjectURL(url);
  }
}

export async function prepareUpload(file: File): Promise<File> {
  if (file.size <= maxUploadBytes) {
    return file;
  }

  const image = await loadImage(file);
  const canvas = drawScaled(image);
  const reduced = await canvasToFile(canvas, "foto");

  if (!reduced) {
    throw new Error(
      "A imagem é muito grande e não pôde ser reduzida. Tente outra foto.",
    );
  }

  return reduced;
}
