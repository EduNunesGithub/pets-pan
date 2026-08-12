import { ArrowLeft } from "lucide-react";
import Link from "next/link";

import type { Route } from "next";
import type { ReactNode } from "react";

export function BackLink({
  children,
  href,
}: {
  children: ReactNode;
  href: Route;
}) {
  return (
    <Link
      className="flex w-fit items-center gap-pair text-muted transition-colors hover:text-pine"
      href={href}
    >
      <ArrowLeft aria-hidden className="size-4" />

      <span className="item">{children}</span>
    </Link>
  );
}
