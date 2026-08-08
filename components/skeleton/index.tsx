import { twMerge } from "tailwind-merge";

export function Skeleton({ className }: { className: string }) {
  return (
    <div aria-hidden className={twMerge("animate-pulse bg-line", className)}>
      &nbsp;
    </div>
  );
}
