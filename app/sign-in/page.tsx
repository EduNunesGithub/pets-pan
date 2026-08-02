import Link from "next/link";

import { SignInForm } from "@/components/sign-in-form";

export default function Page() {
  return (
    <main>
      <h1>Entrar</h1>

      <SignInForm />

      <p>
        Não tem conta? <Link href="/sign-up">Criar conta</Link>
      </p>
    </main>
  );
}
