"use client";

import { Button as BaseButton } from "@base-ui/react/button";
import { twMerge } from "tailwind-merge";

import type { ComponentProps } from "react";

type IconButtonProps = Omit<ComponentProps<typeof BaseButton>, "className"> & {
  className?: string;
};

export function IconButton({ className, ...props }: IconButtonProps) {
  return (
    <BaseButton
      className={twMerge(
        "flex size-8 items-center justify-center rounded-md border border-line text-ink transition-colors hover:border-pine hover:text-pine focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pine disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-line disabled:hover:text-ink",
        className,
      )}
      {...props}
    />
  );
}
