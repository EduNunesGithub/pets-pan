import Link from "next/link";

import { AuthCard } from "@/components/auth-card";
import { SignUpForm } from "@/components/sign-up-form";

export default function Page() {
  return (
    <AuthCard kicker="Cadastro" title="Criar conta">
      <SignUpForm />

      <p className="text-muted text-sm">
        Já tem conta?{" "}
        <Link
          className="font-medium text-pine underline-offset-4 hover:underline"
          href="/sign-in"
        >
          Entrar
        </Link>
      </p>
    </AuthCard>
  );
}
