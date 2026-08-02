"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { authClient } from "@/auth/client";

import type { FormEvent } from "react";

export function SignUpForm() {
  const router = useRouter();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);
    setIsPending(true);

    const formData = new FormData(event.currentTarget);
    const { error } = await authClient.signUp.email({
      email: String(formData.get("email")),
      name: String(formData.get("name")),
      password: String(formData.get("password")),
    });

    setIsPending(false);

    if (error) {
      setErrorMessage(error.message ?? "Não foi possível criar a conta.");
      return;
    }

    router.push("/");
  }

  return (
    <form onSubmit={handleSubmit}>
      <label>
        Nome
        <input autoComplete="name" name="name" required type="text" />
      </label>

      <label>
        E-mail
        <input autoComplete="email" name="email" required type="email" />
      </label>

      <label>
        Senha
        <input
          autoComplete="new-password"
          name="password"
          required
          type="password"
        />
      </label>

      {errorMessage ? <p role="alert">{errorMessage}</p> : null}

      <button disabled={isPending} type="submit">
        Criar conta
      </button>
    </form>
  );
}
