"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import * as z from "zod";

import { authClient } from "@/auth/client";
import { useAppForm } from "@/components/app-form";
import { useAuthRedirect } from "@/hooks/use-auth-redirect";

const signUpInput = z.object({
  email: z.email("Informe um e-mail válido."),
  name: z.string().min(1, "Informe seu nome."),
  password: z.string().min(8, "A senha precisa de ao menos 8 caracteres."),
});

type SignUpValue = z.infer<typeof signUpInput>;

export function SignUpForm() {
  const router = useRouter();
  const { redirectTo } = useAuthRedirect();

  const mutation = useMutation({
    mutationFn: async (value: SignUpValue) => {
      const { error } = await authClient.signUp.email(value);

      if (error) {
        throw new Error(error.message ?? "Não foi possível criar a conta.");
      }
    },
    onSuccess: () => {
      router.push(redirectTo);
    },
  });

  const form = useAppForm({
    defaultValues: { email: "", name: "", password: "" },
    onSubmit: ({ value }) => {
      mutation.mutate(value);
    },
    validators: { onChange: signUpInput },
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
            <field.TextField autoComplete="name" label="Nome" type="text" />
          )}
        </form.AppField>

        <form.AppField name="email">
          {(field) => (
            <field.TextField autoComplete="email" label="E-mail" type="email" />
          )}
        </form.AppField>

        <form.AppField name="password">
          {(field) => (
            <field.TextField
              autoComplete="new-password"
              label="Senha"
              type="password"
            />
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
            {mutation.isPending ? "Criando conta…" : "Criar conta"}
          </button>
        )}
      </form.Subscribe>
    </form>
  );
}
