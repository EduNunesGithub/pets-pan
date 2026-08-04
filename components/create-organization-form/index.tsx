"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { createOrganizationAction } from "@/app/organizations/new/actions";
import { useAppForm } from "@/components/app-form";
import { createOrganizationInput } from "@/domain/organization/organization";

export function CreateOrganizationForm() {
  const router = useRouter();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const form = useAppForm({
    defaultValues: { location: "", name: "" },
    onSubmit: async ({ value }) => {
      setSubmitError(null);

      const result = await createOrganizationAction(value);

      if (result?.unauthenticated) {
        router.push("/sign-in?redirect=/organizations/new");
        return;
      }

      if (result?.error) {
        setSubmitError(result.error);
      }
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

        {submitError ? (
          <p
            className="bg-danger/6 border border-danger/30 px-inset py-snug rounded-sm text-danger text-sm"
            role="alert"
          >
            {submitError}
          </p>
        ) : null}
      </div>

      <form.Subscribe
        selector={(state) => [state.canSubmit, state.isSubmitting]}
      >
        {([canSubmit, isSubmitting]) => (
          <button
            className="bg-pine flex font-medium h-control items-center justify-center px-item rounded-md text-paper text-sm transition-colors w-full disabled:cursor-not-allowed disabled:opacity-60 hover:bg-pine-strong"
            disabled={!canSubmit || isSubmitting}
            type="submit"
          >
            {isSubmitting ? "Criando…" : "Criar organização"}
          </button>
        )}
      </form.Subscribe>
    </form>
  );
}
