"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import * as z from "zod";

import { authClient } from "@/auth/client";
import { useAppForm } from "@/components/app-form";
import { Button } from "@/components/button";
import { useAuthRedirect } from "@/hooks/use-auth-redirect";

const signInInput = z.object({
  email: z.email("Informe um e-mail válido."),
  password: z.string().min(1, "Informe a senha."),
});

type SignInValue = z.infer<typeof signInInput>;

export function SignInForm() {
  const router = useRouter();
  const { redirectTo } = useAuthRedirect();

  const mutation = useMutation({
    mutationFn: async (value: SignInValue) => {
      const { error } = await authClient.signIn.email(value);

      if (error) {
        throw new Error(error.message ?? "Não foi possível entrar.");
      }
    },
    onSuccess: () => {
      router.push(redirectTo);
    },
  });

  const form = useAppForm({
    defaultValues: { email: "", password: "" },
    onSubmit: ({ formApi, value }) => {
      mutation.mutate(value, {
        onSuccess: () => {
          formApi.reset();
        },
      });
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
            {mutation.isPending ? "Entrando…" : "Entrar"}
          </Button>
        )}
      </form.Subscribe>
    </form>
  );
}
