"use client";

import { Button as BaseButton } from "@base-ui/react/button";
import { twMerge } from "tailwind-merge";

import type { ComponentProps } from "react";

type ButtonProps = Omit<ComponentProps<typeof BaseButton>, "className"> & {
  className?: string;
};

export function Button({ className, ...props }: ButtonProps) {
  return (
    <BaseButton
      className={twMerge(
        "flex h-control items-center justify-center rounded-md bg-pine px-item text-sm font-medium text-paper transition-colors hover:bg-pine-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pine disabled:cursor-not-allowed disabled:opacity-60",
        className,
      )}
      {...props}
    />
  );
}
