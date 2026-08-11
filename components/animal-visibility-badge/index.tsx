import { twMerge } from "tailwind-merge";

export function AnimalVisibilityBadge({ published }: { published: boolean }) {
  return (
    <span
      className={twMerge(
        "inline-flex items-center gap-pair rounded-full border px-inset py-pair text-xs font-medium whitespace-nowrap",
        published
          ? "border-pine/30 bg-pine/10 text-pine"
          : "border-line bg-line/25 text-muted",
      )}
    >
      <span
        aria-hidden
        className={twMerge(
          "size-1.5 rounded-full",
          published ? "bg-pine" : "bg-status-archived",
        )}
      />

      {published ? "Publicado" : "Não publicado"}
    </span>
  );
}
