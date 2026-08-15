"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

import { uploadAnimalPhotoAction } from "@/app/(workspace)/animals/[id]/edit/actions";
import { prepareUpload } from "@/components/animal-photo-manager/prepare-upload";
import { useAppForm } from "@/components/app-form";
import { Button } from "@/components/button";
import { uploadPhotoInput } from "@/domain/animal/photo";

export function PhotoUploadForm({ animalId }: { animalId: string }) {
  const router = useRouter();

  const upload = useMutation({
    mutationFn: async ({ alt, file }: { alt: string; file: File }) => {
      const prepared = await prepareUpload(file);
      const formData = new FormData();
      formData.set("alt", alt);
      formData.set("file", prepared);

      const result = await uploadAnimalPhotoAction(animalId, formData);

      if (result?.error) {
        throw new Error(result.error);
      }
    },
    onError: (error) => console.error(error),
    onSuccess: () => router.refresh(),
  });

  const form = useAppForm({
    defaultValues: { alt: "", file: null as File | null },
    onSubmit: ({ formApi, value }) => {
      if (!value.file) {
        return;
      }

      upload.mutate(
        { alt: value.alt, file: value.file },
        { onSuccess: () => formApi.reset() },
      );
    },
  });

  return (
    <form
      className="flex flex-col gap-item rounded-md border border-dashed border-line p-item"
      onSubmit={(event) => {
        event.preventDefault();
        event.stopPropagation();
        void form.handleSubmit();
      }}
    >
      <form.AppField name="file">
        {(field) => <field.DropzoneField label="Foto" />}
      </form.AppField>

      <form.AppField
        name="alt"
        validators={{ onChange: uploadPhotoInput.shape.alt }}
      >
        {(field) => (
          <field.TextField
            label="Descrição da foto (acessibilidade)"
            type="text"
          />
        )}
      </form.AppField>

      {upload.error ? (
        <p className="text-sm text-danger" role="alert">
          {upload.error.message}
        </p>
      ) : null}

      <form.Subscribe
        selector={(state) => ({
          canSubmit: state.canSubmit,
          hasFile: state.values.file !== null,
        })}
      >
        {({ canSubmit, hasFile }) => (
          <Button
            disabled={!canSubmit || !hasFile || upload.isPending}
            type="submit"
          >
            {upload.isPending ? "Enviando…" : "Adicionar foto"}
          </Button>
        )}
      </form.Subscribe>
    </form>
  );
}
