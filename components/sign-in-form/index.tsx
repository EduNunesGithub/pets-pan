"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import * as z from "zod";

import { authClient } from "@/auth/client";
import { useAppForm } from "@/components/app-form";

const signInInput = z.object({
  email: z.email("Informe um e-mail válido."),
  password: z.string().min(1, "Informe a senha."),
});

export function SignInForm() {
  const router = useRouter();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const form = useAppForm({
    defaultValues: { email: "", password: "" },
    onSubmit: async ({ value }) => {
      setSubmitError(null);

      const { error } = await authClient.signIn.email(value);

      if (error) {
        setSubmitError(error.message ?? "Não foi possível entrar.");
        return;
      }

      router.push("/");
    },
    validators: { onChange: signInInput },
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
        <form.AppField name="email">
          {(field) => (
            <field.TextField autoComplete="email" label="E-mail" type="email" />
          )}
        </form.AppField>

        <form.AppField name="password">
          {(field) => (
            <field.TextField
              autoComplete="current-password"
              label="Senha"
              type="password"
            />
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
            {isSubmitting ? "Entrando…" : "Entrar"}
          </button>
        )}
      </form.Subscribe>
    </form>
  );
}
