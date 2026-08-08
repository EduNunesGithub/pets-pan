"use client";

import Link from "next/link";
import { twMerge } from "tailwind-merge";

import type { Route } from "next";

type WorkspaceNavItemProps =
  | {
      active: boolean;
      href: Route;
      label: string;
      upcoming?: false;
    }
  | {
      label: string;
      upcoming: true;
    };

export function WorkspaceNavItem(props: WorkspaceNavItemProps) {
  if (props.upcoming) {
    return (
      <span className="border-l-2 border-transparent flex items-center justify-between px-inset py-snug text-sm text-status-archived">
        {props.label}

        <span className="font-mono text-xs tracking-widest uppercase">
          em breve
        </span>
      </span>
    );
  }

  return (
    <Link
      aria-current={props.active ? "page" : undefined}
      className={twMerge(
        "border-l-2 flex items-center px-inset py-snug text-sm transition-colors",
        props.active
          ? "bg-pine/6 border-pine font-medium text-pine"
          : "border-transparent text-ink hover:bg-line/40 hover:text-pine",
      )}
      href={props.href}
    >
      {props.label}
    </Link>
  );
}
