"use client";

import Image from "next/image";
import { useEffect, useMemo } from "react";
import { useDropzone } from "react-dropzone";
import { twMerge } from "tailwind-merge";

import { useFieldContext } from "@/components/app-form/contexts";
import { acceptedPhotoMimeTypes } from "@/domain/animal/photo";

import type { Accept, FileError } from "react-dropzone";

const accept: Accept = Object.fromEntries(
  acceptedPhotoMimeTypes.map((mime) => [mime, []]),
);

function errorMessage(error: FileError): string {
  if (error.code === "file-invalid-type") {
    return "Formato não suportado. Envie JPEG, PNG ou WebP.";
  }

  if (error.code === "too-many-files") {
    return "Envie uma imagem por vez.";
  }

  return error.message;
}

export function DropzoneField({ label }: { label: string }) {
  const field = useFieldContext<File | null>();
  const file = field.state.value;
  const previewUrl = useMemo(
    () => (file ? URL.createObjectURL(file) : null),
    [file],
  );

  useEffect(() => {
    if (!previewUrl) {
      return;
    }

    return () => URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  const {
    fileRejections,
    getInputProps,
    getRootProps,
    isDragAccept,
    isDragReject,
  } = useDropzone({
    accept,
    getErrorMessage: (error) => errorMessage(error),
    maxFiles: 1,
    multiple: false,
    onDrop: (accepted) => {
      const [next] = accepted;

      if (next) {
        field.handleChange(next);
      }
    },
  });

  const rejection = fileRejections[0]?.errors[0];

  return (
    <div className="flex flex-col gap-pair">
      <span className="eyebrow text-muted">{label}</span>

      <div
        {...getRootProps({
          className: twMerge(
            "flex cursor-pointer flex-col items-center justify-center gap-pair rounded-md border border-dashed border-line px-inset py-block text-center transition-colors hover:border-pine",
            isDragAccept && "border-pine bg-pine/5",
            isDragReject && "border-danger bg-danger/5",
          ),
        })}
      >
        <input {...getInputProps()} />

        {previewUrl ? (
          <div className="relative aspect-4/3 w-40 overflow-hidden rounded-sm">
            <Image
              alt="Prévia da foto selecionada"
              className="object-cover"
              fill
              sizes="160px"
              src={previewUrl}
            />
          </div>
        ) : null}

        <p className="text-sm text-muted">
          {file
            ? file.name
            : "Arraste uma imagem aqui ou clique para selecionar"}
        </p>

        <p className="meta text-muted">JPEG, PNG ou WebP</p>
      </div>

      {file ? (
        <button
          className="self-start text-sm text-muted underline-offset-2 hover:underline"
          onClick={() => field.handleChange(null)}
          type="button"
        >
          Remover seleção
        </button>
      ) : null}

      {rejection ? (
        <p className="text-sm text-danger" role="alert">
          {rejection.message}
        </p>
      ) : null}
    </div>
  );
}
