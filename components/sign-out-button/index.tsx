"use client";

import { Button } from "@base-ui/react/button";
import { useRouter } from "next/navigation";

import { authClient } from "@/auth/client";

export function SignOutButton() {
  const router = useRouter();

  async function signOut() {
    await authClient.signOut();
    router.refresh();
  }

  return <Button onClick={signOut}>Sair</Button>;
}
