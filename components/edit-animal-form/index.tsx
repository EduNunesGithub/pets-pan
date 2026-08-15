"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

import { editAnimalAction } from "@/app/(workspace)/animals/[id]/edit/actions";
import { useAppForm } from "@/components/app-form";
import { Button } from "@/components/button";
import { registerAnimalInput } from "@/domain/animal/animal";
import {
  ageGroupOptions,
  sexOptions,
  sizeOptions,
  speciesOptions,
} from "@/domain/animal/labels";

import type { RegisterAnimalFields } from "@/domain/animal/animal";

export function EditAnimalForm({
  animalId,
  defaultValues,
}: {
  animalId: string;
  defaultValues: RegisterAnimalFields;
}) {
  const router = useRouter();

  const mutation = useMutation({
    mutationFn: async (value: RegisterAnimalFields) => {
      const result = await editAnimalAction(animalId, value);

      if (result?.error) {
        throw new Error(result.error);
      }
    },
    onError: (error) => console.error(error),
    onSuccess: () => {
      router.push(`/animals/${animalId}`);
    },
  });

  const form = useAppForm({
    defaultValues,
    onSubmit: ({ value }) => {
      mutation.mutate(value);
    },
    validators: { onChange: registerAnimalInput },
  });

  return (
    <form
      className="flex flex-col gap-block"
      onSubmit={(event) => {
        event.preventDefault();
        event.stopPropagation();
        void form.handleSubmit();
      }}
    >
      <div className="flex flex-col gap-item">
        <form.AppField name="name">
          {(field) => <field.TextField label="Nome (opcional)" type="text" />}
        </form.AppField>

        <form.AppField name="species">
          {(field) => (
            <field.SelectField label="Espécie" options={speciesOptions} />
          )}
        </form.AppField>

        <form.AppField name="sex">
          {(field) => <field.SelectField label="Sexo" options={sexOptions} />}
        </form.AppField>

        <form.AppField name="size">
          {(field) => <field.SelectField label="Porte" options={sizeOptions} />}
        </form.AppField>

        <form.AppField name="ageGroup">
          {(field) => (
            <field.SelectField label="Faixa etária" options={ageGroupOptions} />
          )}
        </form.AppField>

        <form.AppField name="temperament">
          {(field) => (
            <field.TextField label="Temperamento (opcional)" type="text" />
          )}
        </form.AppField>

        <form.AppField name="description">
          {(field) => <field.TextAreaField label="Descrição (opcional)" />}
        </form.AppField>

        {mutation.error ? (
          <p
            className="rounded-sm border border-danger/30 bg-danger/6 px-inset py-snug text-sm text-danger"
            role="alert"
          >
            {mutation.error.message}
          </p>
        ) : null}
      </div>

      <form.Subscribe selector={(state) => state.canSubmit}>
        {(canSubmit) => (
          <Button
            className="w-full"
            disabled={!canSubmit || mutation.isPending}
            type="submit"
          >
            {mutation.isPending ? "Salvando…" : "Salvar alterações"}
          </Button>
        )}
      </form.Subscribe>
    </form>
  );
}
