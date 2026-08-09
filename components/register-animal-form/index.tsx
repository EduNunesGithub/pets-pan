"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

import { registerAnimalAction } from "@/app/(workspace)/animals/new/actions";
import { useAppForm } from "@/components/app-form";
import { Button } from "@/components/button";
import { registerAnimalInput } from "@/domain/animal/animal";

import type {
  AgeGroup,
  RegisterAnimalFields,
  Sex,
  Size,
  Species,
} from "@/domain/animal/animal";

const ageGroupOptions: readonly { label: string; value: AgeGroup }[] = [
  { label: "Filhote", value: "baby" },
  { label: "Adulto", value: "adult" },
  { label: "Idoso", value: "senior" },
];

const emptyFields: RegisterAnimalFields = {
  ageGroup: "",
  description: "",
  name: "",
  sex: "",
  size: "",
  species: "",
  temperament: "",
};

const sexOptions: readonly { label: string; value: Sex }[] = [
  { label: "Fêmea", value: "female" },
  { label: "Macho", value: "male" },
];

const sizeOptions: readonly { label: string; value: Size }[] = [
  { label: "Pequeno", value: "small" },
  { label: "Médio", value: "medium" },
  { label: "Grande", value: "large" },
];

const speciesOptions: readonly { label: string; value: Species }[] = [
  { label: "Cão", value: "dog" },
  { label: "Gato", value: "cat" },
  { label: "Outro", value: "other" },
];

export function RegisterAnimalForm() {
  const router = useRouter();

  const mutation = useMutation({
    mutationFn: async (value: RegisterAnimalFields) => {
      const result = await registerAnimalAction(value);

      if (result?.error) {
        throw new Error(result.error);
      }
    },
    onSuccess: () => {
      form.reset();
      router.push("/animals");
    },
  });

  const form = useAppForm({
    defaultValues: emptyFields,
    onSubmit: ({ value }) => {
      mutation.mutate(value);
    },
    validators: { onChange: registerAnimalInput },
  });

  return (
    <form
      className="flex flex-col gap-block max-w-lg"
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
            className="bg-danger/6 border border-danger/30 px-inset py-snug rounded-sm text-danger text-sm"
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
            {mutation.isPending ? "Cadastrando…" : "Cadastrar animal"}
          </Button>
        )}
      </form.Subscribe>
    </form>
  );
}
