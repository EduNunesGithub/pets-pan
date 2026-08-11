import { twMerge } from "tailwind-merge";

import type { ReactNode } from "react";

type PageContainerProps = {
  children: ReactNode;
  size?: "prose" | "wide";
};

export function PageContainer({
  children,
  size = "prose",
}: PageContainerProps) {
  return (
    <div
      className={twMerge(
        "mx-auto w-full",
        size === "wide" ? "max-w-5xl" : "max-w-2xl",
      )}
    >
      {children}
    </div>
  );
}
