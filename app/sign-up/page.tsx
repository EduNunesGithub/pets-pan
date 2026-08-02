import Link from "next/link";

import { SignUpForm } from "@/components/sign-up-form";

export default function Page() {
  return (
    <main>
      <h1>Criar conta</h1>

      <SignUpForm />

      <p>
        Já tem conta? <Link href="/sign-in">Entrar</Link>
      </p>
    </main>
  );
}
