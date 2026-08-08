import { Suspense } from "react";

import { AuthCard } from "@/components/auth-card";
import { AuthFormSkeleton } from "@/components/auth-form-skeleton";
import { AuthSwitchLink } from "@/components/auth-switch-link";
import { SignUpForm } from "@/components/sign-up-form";

export default function Page() {
  return (
    <AuthCard kicker="Cadastro" title="Criar conta">
      <Suspense fallback={<AuthFormSkeleton fields={3} />}>
        <SignUpForm />

        <p className="text-muted">
          Já tem conta?{" "}
          <AuthSwitchLink
            className="item text-pine underline-offset-4 hover:underline"
            href="/sign-in"
          >
            Entrar
          </AuthSwitchLink>
        </p>
      </Suspense>
    </AuthCard>
  );
}
