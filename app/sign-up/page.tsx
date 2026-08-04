import { Suspense } from "react";

import { AuthCard } from "@/components/auth-card";
import { AuthSwitchLink } from "@/components/auth-switch-link";
import { SignUpForm } from "@/components/sign-up-form";

export default function Page() {
  return (
    <AuthCard kicker="Cadastro" title="Criar conta">
      <Suspense fallback={<p className="text-muted text-sm">Carregando…</p>}>
        <SignUpForm />

        <p className="text-muted text-sm">
          Já tem conta?{" "}
          <AuthSwitchLink
            className="font-medium text-pine underline-offset-4 hover:underline"
            href="/sign-in"
          >
            Entrar
          </AuthSwitchLink>
        </p>
      </Suspense>
    </AuthCard>
  );
}
