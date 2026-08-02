"use client";

import { useRouter } from "next/navigation";

import { authClient } from "@/auth/client";

export function SignOutButton() {
  const router = useRouter();

  async function signOut() {
    await authClient.signOut();
    router.refresh();
  }

  return (
    <button onClick={signOut} type="button">
      Sair
    </button>
  );
}
