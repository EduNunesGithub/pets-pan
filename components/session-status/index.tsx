import { headers } from "next/headers";
import Link from "next/link";

import { SignOutButton } from "@/components/sign-out-button";
import { auth } from "@/server";

export async function SessionStatus() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    return (
      <p>
        <Link href="/sign-in">Entrar</Link> ou{" "}
        <Link href="/sign-up">criar conta</Link>.
      </p>
    );
  }

  return (
    <section>
      <p>
        Autenticado como {session.user.name} ({session.user.email}).
      </p>

      <Link href="/organizations/new">Criar organização</Link>

      <SignOutButton />
    </section>
  );
}
