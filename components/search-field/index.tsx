"use client";

import { Field } from "@base-ui/react/field";
import { Search } from "lucide-react";
import { twMerge } from "tailwind-merge";

type SearchFieldProps = {
  className?: string;
  label: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  value: string;
};

export function SearchField({
  className,
  label,
  onValueChange,
  placeholder,
  value,
}: SearchFieldProps) {
  return (
    <Field.Root className={twMerge("flex flex-col gap-pair", className)}>
      <Field.Label className="eyebrow text-muted">{label}</Field.Label>

      <div className="relative">
        <Search
          aria-hidden
          className="pointer-events-none absolute top-1/2 left-inset size-4 -translate-y-1/2 text-muted"
        />

        <Field.Control
          className="h-control w-full rounded-md border border-line bg-card pr-inset pl-9 text-sm text-ink transition-colors placeholder:text-muted hover:border-pine focus-visible:border-pine focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pine"
          onChange={(event) => onValueChange(event.target.value)}
          placeholder={placeholder}
          type="search"
          value={value}
        />
      </div>
    </Field.Root>
  );
}
