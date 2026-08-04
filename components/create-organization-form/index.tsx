"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

import { createOrganizationAction } from "@/app/organizations/new/actions";
import { useAppForm } from "@/components/app-form";
import { createOrganizationInput } from "@/domain/organization/organization";

import type { CreateOrganizationInput } from "@/domain/organization/organization";

export function CreateOrganizationForm() {
  const router = useRouter();

  const mutation = useMutation({
    mutationFn: async (value: CreateOrganizationInput) => {
      const result = await createOrganizationAction(value);

      if (result?.error && !result.unauthenticated) {
        throw new Error(result.error);
      }

      return result;
    },
    onSuccess: (result) => {
      router.push(
        result?.unauthenticated ? "/sign-in?redirect=/organizations/new" : "/",
      );
    },
  });

  const form = useAppForm({
    defaultValues: { location: "", name: "" },
    onSubmit: ({ value }) => {
      mutation.mutate(value);
    },
    validators: { onChange: createOrganizationInput },
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
          {(field) => (
            <field.TextField
              autoComplete="organization"
              label="Nome"
              type="text"
            />
          )}
        </form.AppField>

        <form.AppField name="location">
          {(field) => (
            <field.TextField label="Localização (opcional)" type="text" />
          )}
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
          <button
            className="bg-pine flex font-medium h-control items-center justify-center px-item rounded-md text-paper text-sm transition-colors w-full disabled:cursor-not-allowed disabled:opacity-60 hover:bg-pine-strong"
            disabled={!canSubmit || mutation.isPending}
            type="submit"
          >
            {mutation.isPending ? "Criando…" : "Criar organização"}
          </button>
        )}
      </form.Subscribe>
    </form>
  );
}
