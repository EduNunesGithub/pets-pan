import Link from "next/link";

import { AuthCard } from "@/components/auth-card";
import { SignInForm } from "@/components/sign-in-form";

export default function Page() {
  return (
    <AuthCard kicker="Acesso" title="Entrar">
      <SignInForm />

      <p className="text-muted text-sm">
        Não tem conta?{" "}
        <Link
          className="font-medium text-pine underline-offset-4 hover:underline"
          href="/sign-up"
        >
          Criar conta
        </Link>
      </p>
    </AuthCard>
  );
}
