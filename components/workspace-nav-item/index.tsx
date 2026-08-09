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
      <span className="flex items-center justify-between border-l-2 border-transparent px-inset py-snug text-status-archived">
        {props.label}

        <span className="eyebrow">em breve</span>
      </span>
    );
  }

  return (
    <Link
      aria-current={props.active ? "page" : undefined}
      className={twMerge(
        "flex items-center border-l-2 px-inset py-snug transition-colors",
        props.active
          ? "item border-pine bg-pine/6 text-pine"
          : "border-transparent text-ink hover:bg-line/40 hover:text-pine",
      )}
      href={props.href}
    >
      {props.label}
    </Link>
  );
}
