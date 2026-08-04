import { Suspense } from "react";

import { AuthCard } from "@/components/auth-card";
import { AuthFormSkeleton } from "@/components/auth-form-skeleton";
import { AuthSwitchLink } from "@/components/auth-switch-link";
import { SignInForm } from "@/components/sign-in-form";

export default function Page() {
  return (
    <AuthCard kicker="Acesso" title="Entrar">
      <Suspense fallback={<AuthFormSkeleton fields={2} />}>
        <SignInForm />

        <p className="text-muted text-sm">
          Não tem conta?{" "}
          <AuthSwitchLink
            className="font-medium text-pine underline-offset-4 hover:underline"
            href="/sign-up"
          >
            Criar conta
          </AuthSwitchLink>
        </p>
      </Suspense>
    </AuthCard>
  );
}
