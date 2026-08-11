"use client";

import { usePathname, useRouter } from "next/navigation";
import { useTransition } from "react";

import type { Route } from "next";

export function useAnimalListNavigation() {
  const pathname = usePathname();
  const router = useRouter();
  const [, startTransition] = useTransition();

  return (search: URLSearchParams) => {
    const query = search.toString();
    const href = (query ? `${pathname}?${query}` : pathname) as Route;

    startTransition(() => {
      router.replace(href);
    });
  };
}
