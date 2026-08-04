"use client";

import Link from "next/link";

import { useAuthRedirect } from "@/hooks/use-auth-redirect";

import type { Route } from "next";
import type { ReactNode } from "react";

export function AuthSwitchLink({
  children,
  className,
  href,
}: {
  children: ReactNode;
  className?: string;
  href: Route;
}) {
  const { preserve } = useAuthRedirect();

  return (
    <Link className={className} href={preserve(href)}>
      {children}
    </Link>
  );
}
