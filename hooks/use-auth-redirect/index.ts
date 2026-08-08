"use client";

import { useSearchParams } from "next/navigation";

import type { Route } from "next";

function toInternalPath(value: null | string): Route {
  if (value && value.startsWith("/") && !value.startsWith("//")) {
    return value as Route;
  }

  return "/";
}

export function useAuthRedirect() {
  const searchParams = useSearchParams();
  const redirectTo = toInternalPath(searchParams.get("redirect"));

  function preserve(href: Route): Route {
    if (redirectTo === "/") {
      return href;
    }

    return `${href}?redirect=${encodeURIComponent(redirectTo)}` as Route;
  }

  return { preserve, redirectTo };
}
