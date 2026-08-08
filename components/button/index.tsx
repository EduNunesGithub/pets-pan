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
        "bg-pine flex font-medium h-control items-center justify-center px-item rounded-md text-paper text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pine hover:bg-pine-strong",
        className,
      )}
      {...props}
    />
  );
}
