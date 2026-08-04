import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/server";

import type { Route } from "next";
import type { ReactNode } from "react";

export async function RequireSession({
  children,
  signInRedirectTo,
}: {
  children: ReactNode;
  signInRedirectTo: Route;
}) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    redirect(
      `/sign-in?redirect=${encodeURIComponent(signInRedirectTo)}` as Route,
    );
  }

  return children;
}
